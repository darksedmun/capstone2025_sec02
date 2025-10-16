import jwt from "jsonwebtoken";

let mockFindUnique = jest.fn();
let mockDisconnect = jest.fn();

jest.mock("@prisma/client", () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: { findUnique: mockFindUnique },
      $disconnect: mockDisconnect,
    })),
  };
});

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}));

import { GET } from "./route";

describe("POST /api/user", () => {
  afterEach(() => jest.clearAllMocks());

  it("debe retornar 401 si no hay Authorization header", async () => {
    const req = new Request("http://localhost");
    const res = await GET(req);
    const json = await res.json();
    console.log("Authorization header ausente");
    expect(res.status).toBe(401);
    expect(json).toEqual({ error: "No autorizado" });
  });

  it("debe retornar 401 si el token es inválido", async () => {
    (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error("Token inválido") });
    const req = new Request("http://localhost", {
      headers: { Authorization: "Bearer tokeninvalido" },
    });
    const res = await GET(req);
    const json = await res.json();
    console.log("Token inválido");
    expect(res.status).toBe(401);
    expect(json).toEqual({ error: "Token inválido" });
  });

  it("debe retornar 404 si el usuario no existe", async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ id: 1 });
    mockFindUnique.mockResolvedValue(null);

    const req = new Request("http://localhost", {
      headers: { Authorization: "Bearer validtoken" },
    });
    const res = await GET(req);
    const json = await res.json();
    console.log("Usuario no encontrado");
    expect(res.status).toBe(404);
    expect(json).toEqual({ error: "Usuario no encontrado" });
  });

  it("debe retornar los datos del usuario si todo es válido", async () => {
    const mockUser = { points: 100, name: "Juan", email: "juan@test.com" };
    (jwt.verify as jest.Mock).mockReturnValue({ id: 1 });
    mockFindUnique.mockResolvedValue(mockUser);

    const req = new Request("http://localhost", {
      headers: { Authorization: "Bearer validtoken" },
    });
    const res = await GET(req);
    const json = await res.json();
    console.log("Usuario encontrado correctamente");
    expect(res.status).toBe(200);
    expect(json).toEqual({
      points: 100,
      name: "Juan",
      email: "juan@test.com",
    });
  });
});
