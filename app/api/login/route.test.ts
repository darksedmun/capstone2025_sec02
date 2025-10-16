/**
 * @jest-environment node
 */

const mockUserFindUnique = jest.fn();
const mockDisconnect = jest.fn().mockResolvedValue(undefined);
const mockBcryptCompare = jest.fn();
const mockJwtSign = jest.fn().mockReturnValue("mockedToken");

import { POST } from "./route";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: { findUnique: mockUserFindUnique },
    $disconnect: mockDisconnect,
  })),
}));

jest.mock("bcrypt", () => ({
  compare: mockBcryptCompare,
}));

jest.mock("jsonwebtoken", () => ({
  sign: mockJwtSign,
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options })),
  },
}));

describe("POST /api/login", () => {
  beforeEach(() => jest.clearAllMocks());

  it("debe retornar 400 si faltan username o password", async () => {
    const req = { json: async () => ({}) } as Request;
    await POST(req);
    expect(require("next/server").NextResponse.json).toHaveBeenCalledWith(
      { success: false, error: "Usuario y contraseña son requeridos" },
      { status: 400 }
    );
  });

  it("debe retornar 404 si usuario no existe", async () => {
    mockUserFindUnique.mockResolvedValue(null);
    const req = { json: async () => ({ username: "juan", password: "123456" }) } as Request;

    await POST(req);
    expect(require("next/server").NextResponse.json).toHaveBeenCalledWith(
      { success: false, error: "Usuario no encontrado" },
      { status: 404 }
    );
  });

  it("debe retornar 401 si contraseña incorrecta", async () => {
    mockUserFindUnique.mockResolvedValue({ id: 1, username: "juan", password: "hashed" });
    mockBcryptCompare.mockResolvedValue(false);

    const req = { json: async () => ({ username: "juan", password: "wrongpass" }) } as Request;
    await POST(req);

    expect(require("next/server").NextResponse.json).toHaveBeenCalledWith(
      { success: false, error: "Contraseña incorrecta" },
      { status: 401 }
    );
  });

  it("debe retornar token si login correcto", async () => {
    mockUserFindUnique.mockResolvedValue({ id: 1, username: "juan", password: "hashed" });
    mockBcryptCompare.mockResolvedValue(true);

    const req = { json: async () => ({ username: "juan", password: "123456" }) } as Request;
    await POST(req);

    expect(mockBcryptCompare).toHaveBeenCalledWith("123456", "hashed");
    expect(mockJwtSign).toHaveBeenCalledWith(
      { id: 1, username: "juan" },
      process.env.JWT_SECRET || "supersecreto",
      { expiresIn: "7d" }
    );

    expect(require("next/server").NextResponse.json).toHaveBeenCalledWith(
      { success: true, token: "mockedToken" }
    );
  });

  it("debe retornar 500 si hay error inesperado", async () => {
    mockUserFindUnique.mockRejectedValue(new Error("DB error"));

    const req = { json: async () => ({ username: "juan", password: "123456" }) } as Request;
    await POST(req);

    expect(require("next/server").NextResponse.json).toHaveBeenCalledWith(
      { success: false, error: "Error en el servidor" },
      { status: 500 }
    );
  });
});
