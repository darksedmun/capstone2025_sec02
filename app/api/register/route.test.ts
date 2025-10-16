/**
 * @jest-environment node
 */

const mockUserFindUnique = jest.fn();
const mockUserFindFirst = jest.fn();
const mockUserCreate = jest.fn();
const mockDisconnect = jest.fn().mockResolvedValue(undefined);

import { POST } from "./route";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: mockUserFindUnique,
      findFirst: mockUserFindFirst,
      create: mockUserCreate,
    },
    $disconnect: mockDisconnect,
  })),
}));

jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashedPassword"),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn().mockReturnValue("mockedToken"),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options })),
  },
}));

describe("POST /api/register", () => {
  beforeEach(() => jest.clearAllMocks());

  it("debe retornar 400 si faltan campos", async () => {
    const req = { json: async () => ({}) } as Request;
    await POST(req);
    expect(require("next/server").NextResponse.json).toHaveBeenCalledWith(
      { success: false, error: "Todos los campos son obligatorios" },
      { status: 400 }
    );
  });

  it("debe retornar 400 si contraseña corta", async () => {
    const req = {
      json: async () => ({
        name: "Juan",
        email: "juan@test.com",
        username: "juan123",
        password: "123",
        phone: "12345678",
      }),
    } as Request;

    await POST(req);
    expect(require("next/server").NextResponse.json).toHaveBeenCalledWith(
      { success: false, error: "La contraseña debe tener al menos 6 caracteres" },
      { status: 400 }
    );
  });

  it("debe retornar 400 si email inválido", async () => {
    const req = {
      json: async () => ({
        name: "Juan",
        email: "juan@invalid",
        username: "juan123",
        password: "123456",
        phone: "12345678",
      }),
    } as Request;

    await POST(req);
    expect(require("next/server").NextResponse.json).toHaveBeenCalledWith(
      { success: false, error: "Email inválido" },
      { status: 400 }
    );
  });

  it("debe retornar 400 si username ya existe", async () => {
    mockUserFindUnique.mockResolvedValue({ id: 1, username: "juan123" });

    const req = {
      json: async () => ({
        name: "Juan",
        email: "juan@test.com",
        username: "juan123",
        password: "123456",
        phone: "12345678",
      }),
    } as Request;

    await POST(req);
    expect(require("next/server").NextResponse.json).toHaveBeenCalledWith(
      { success: false, error: "El nombre de usuario ya existe" },
      { status: 400 }
    );
  });

  it("debe retornar 400 si email ya en uso", async () => {
    mockUserFindUnique.mockResolvedValue(null);
    mockUserFindFirst.mockResolvedValue({ id: 1, email: "juan@test.com" });

    const req = {
      json: async () => ({
        name: "Juan",
        email: "juan@test.com",
        username: "juan123",
        password: "123456",
        phone: "12345678",
      }),
    } as Request;

    await POST(req);
    expect(require("next/server").NextResponse.json).toHaveBeenCalledWith(
      { success: false, error: "El correo electrónico ya está en uso" },
      { status: 400 }
    );
  });

  it("debe retornar 403 si adminKey es incorrecta", async () => {
    mockUserFindUnique.mockResolvedValue(null);
    mockUserFindFirst.mockResolvedValue(null);

    const req = {
      json: async () => ({
        name: "Admin",
        email: "admin@test.com",
        username: "admin123",
        password: "123456",
        phone: "12345678",
        adminKey: "wrongKey",
      }),
    } as Request;

    await POST(req);
    expect(require("next/server").NextResponse.json).toHaveBeenCalledWith(
      { success: false, error: "Clave de admin incorrecta" },
      { status: 403 }
    );
  });

  it("debe crear usuario USER correctamente", async () => {
    mockUserFindUnique.mockResolvedValue(null);
    mockUserFindFirst.mockResolvedValue(null);
    mockUserCreate.mockResolvedValue({ id: 1, username: "juan123", role: "USER" });

    const req = {
      json: async () => ({
        name: "Juan",
        email: "juan@test.com",
        username: "juan123",
        password: "123456",
        phone: "12345678",
      }),
    } as Request;

    await POST(req);
    expect(require("next/server").NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, token: "mockedToken" })
    );
  });

  it("debe crear usuario ADMIN correctamente", async () => {
    mockUserFindUnique.mockResolvedValue(null);
    mockUserFindFirst.mockResolvedValue(null);
    mockUserCreate.mockResolvedValue({ id: 1, username: "admin123", role: "ADMIN" });

    const req = {
      json: async () => ({
        name: "Admin",
        email: "admin@test.com",
        username: "admin123",
        password: "123456",
        phone: "12345678",
        adminKey: process.env.ADMIN_KEY || "miclavesupersecreta",
      }),
    } as Request;

    await POST(req);
    expect(require("next/server").NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, token: "mockedToken" })
    );
  });

  it("debe retornar 500 si hay error inesperado", async () => {
    mockUserFindUnique.mockRejectedValue(new Error("DB error"));

    const req = {
      json: async () => ({
        name: "Juan",
        email: "juan@test.com",
        username: "juan123",
        password: "123456",
        phone: "12345678",
      }),
    } as Request;

    await POST(req);
    expect(require("next/server").NextResponse.json).toHaveBeenCalledWith(
      { success: false, error: "Error en el servidor" },
      { status: 500 }
    );
  });
});
