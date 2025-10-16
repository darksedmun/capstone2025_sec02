/**
 * @jest-environment node
 */

const mockQRFindUnique = jest.fn();
const mockQRCodeUpdate = jest.fn();
const mockUserFindUnique = jest.fn();
const mockUserUpdate = jest.fn();
const mockReciclajeCreate = jest.fn();
const mockDisconnect = jest.fn().mockResolvedValue(undefined);

const sendMailMock = jest.fn().mockResolvedValue(true);

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    qRCode: { findUnique: mockQRFindUnique, update: mockQRCodeUpdate },
    user: { findUnique: mockUserFindUnique, update: mockUserUpdate },
    reciclaje: { create: mockReciclajeCreate },
    $disconnect: mockDisconnect,
  })),
}));

jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({ sendMail: sendMailMock })),
}));

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(() => ({ id: 1 })),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options })),
  },
}));

import { POST } from "./route";

describe("POST /api/scanner", () => {
  beforeEach(() => jest.clearAllMocks());

  it("debería devolver 400 si falta qrCode", async () => {
    console.log("Validando QR requerido");
    const req = { json: async () => ({}) } as Request;
    await POST(req);
    expect(require("next/server").NextResponse.json).toHaveBeenCalledWith(
      { success: false, error: "QR es requerido" },
      { status: 400 }
    );
  });

  it("debería devolver 401 si no hay Authorization", async () => {
    console.log("Validando Authorization header");
    const req = { json: async () => ({ qrCode: "ABC123" }), headers: { get: () => null } as any } as Request;
    await POST(req);
    expect(require("next/server").NextResponse.json).toHaveBeenCalledWith(
      { success: false, error: "No autorizado" },
      { status: 401 }
    );
  });

  it("debería procesar reciclaje correctamente", async () => {
    console.log("Validando flujo completo de reciclaje");
    mockQRFindUnique.mockResolvedValue({ id: 1, code: "ABC123", tipo: "plastico", used: false });
    mockQRCodeUpdate.mockResolvedValue({ id: 1, code: "ABC123", tipo: "plastico", used: true });
    mockUserFindUnique.mockResolvedValue({ id: 1, email: "test@mail.com", name: "Test", points: 100 });
    mockUserUpdate.mockResolvedValue({ id: 1, email: "test@mail.com", name: "Test", points: 400 });
    mockReciclajeCreate.mockResolvedValue({});

    const req = { json: async () => ({ qrCode: "ABC123" }), headers: { get: () => "Bearer token123" } as any } as Request;
    await POST(req);

    expect(mockQRFindUnique).toHaveBeenCalledWith({ where: { code: "ABC123" } });
    expect(mockQRCodeUpdate).toHaveBeenCalled();
    expect(mockUserUpdate).toHaveBeenCalled();
    expect(mockReciclajeCreate).toHaveBeenCalled();
    expect(sendMailMock).toHaveBeenCalled();
    expect(require("next/server").NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, tipo: "plastico", pointsAdded: 300, totalPoints: 400 })
    );
  });

  it("debería devolver 404 si QR no válido", async () => {
    console.log("Validando QR no válido");
    mockQRFindUnique.mockResolvedValue(null);
    const req = { json: async () => ({ qrCode: "XYZ999" }), headers: { get: () => "Bearer token123" } as any } as Request;
    await POST(req);
    expect(require("next/server").NextResponse.json).toHaveBeenCalledWith(
      { success: false, error: "QR no válido" },
      { status: 404 }
    );
  });

  it("debería devolver 400 si QR ya usado", async () => {
    console.log("Validando QR ya usado");
    mockQRFindUnique.mockResolvedValue({ id: 1, code: "ABC123", tipo: "plastico", used: true });
    const req = { json: async () => ({ qrCode: "ABC123" }), headers: { get: () => "Bearer token123" } as any } as Request;
    await POST(req);
    expect(require("next/server").NextResponse.json).toHaveBeenCalledWith(
      { success: false, error: "QR ya usado" },
      { status: 400 }
    );
  });

  it("debería devolver 500 si hay error inesperado", async () => {
    console.log("Validando error inesperado");
    mockQRFindUnique.mockRejectedValue(new Error("DB error"));
    const req = { json: async () => ({ qrCode: "ABC123" }), headers: { get: () => "Bearer token123" } as any } as Request;
    await POST(req);
    expect(require("next/server").NextResponse.json).toHaveBeenCalledWith(
      { success: false, error: "Error del servidor" },
      { status: 500 }
    );
  });
});
