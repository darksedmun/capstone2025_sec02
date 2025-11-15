/**
 * @jest-environment node
 */

import jwt from "jsonwebtoken"

let mockFindUnique = jest.fn()
let mockAggregate = jest.fn()
let mockDisconnect = jest.fn()

jest.mock("@prisma/client", () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: { findUnique: mockFindUnique },
      pointTransaction: { aggregate: mockAggregate },
      $disconnect: mockDisconnect,
    })),
  }
})

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}))

import { GET } from "./route"

describe("GET /api/user", () => {
  afterEach(() => jest.clearAllMocks())

  it("debe retornar 401 si no hay Authorization header", async () => {
    const req = new Request("http://localhost")
    const res = await GET(req)
    const json = await res.json()
    expect(res.status).toBe(401)
    expect(json).toEqual({ error: "No autorizado" })
  })

  it("debe retornar 401 si el token es inválido", async () => {
    ;(jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("Token inválido")
    })

    const req = new Request("http://localhost", {
      headers: { Authorization: "Bearer tokeninvalido" },
    })

    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json).toEqual({ error: "Token inválido" })
  })

  it("debe retornar 404 si el usuario no existe", async () => {
    ;(jwt.verify as jest.Mock).mockReturnValue({ id: 1 })
    mockFindUnique.mockResolvedValue(null)

    const req = new Request("http://localhost", {
      headers: { Authorization: "Bearer valido" },
    })

    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(404)
    expect(json).toEqual({ error: "Usuario no encontrado" })
  })

  it("debe retornar datos del usuario y changeThisMonth correctamente", async () => {
    ;(jwt.verify as jest.Mock).mockReturnValue({ id: 1 })

    mockFindUnique.mockResolvedValue({
      points: 500,
      name: "Juan",
      email: "juan@test.com",
    })

    mockAggregate
      .mockResolvedValueOnce({ _sum: { points: 300 } })
      .mockResolvedValueOnce({ _sum: { points: 100 } })

    const req = new Request("http://localhost", {
      headers: { Authorization: "Bearer valido" },
    })

    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toEqual({
      points: 500,
      name: "Juan",
      email: "juan@test.com",
      changeThisMonth: 200,
    })
  })

  it("debe retornar 500 en error interno", async () => {
    ;(jwt.verify as jest.Mock).mockReturnValue({ id: 1 })
    mockFindUnique.mockRejectedValue(new Error("DB error"))

    const req = new Request("http://localhost", {
      headers: { Authorization: "Bearer valido" },
    })

    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json).toEqual({ error: "Error del servidor" })
  })
})
