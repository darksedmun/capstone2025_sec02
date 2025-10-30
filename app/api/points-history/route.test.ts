/**
 * @jest-environment node
 */

import jwt from "jsonwebtoken"
import { NextResponse } from "next/server"

const mockFindMany = jest.fn()
const mockDisconnect = jest.fn()

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    pointTransaction: { findMany: mockFindMany },
    $disconnect: mockDisconnect,
  })),
}))

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}))

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options })),
  },
}))

import { GET } from "./route"

describe("GET /api/points-history", () => {
  beforeEach(() => jest.clearAllMocks())

  it("debe retornar 401 si no hay Authorization header", async () => {
    const req = new Request("http://localhost", { headers: {} })
    await GET(req)
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "No autorizado" },
      { status: 401 }
    )
  })

  it("debe retornar 401 si el token es inválido", async () => {
    ;(jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("invalid")
    })

    const req = new Request("http://localhost", {
      headers: { Authorization: "Bearer invalid" },
    })
    await GET(req)

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Token inválido" },
      { status: 401 }
    )
  })

  it("debe retornar movimientos correctamente", async () => {
    ;(jwt.verify as jest.Mock).mockReturnValue({ id: 1 })

    mockFindMany.mockResolvedValue([
      {
        type: "earned",
        points: 300,
        description: "Reciclaje de vidrio",
        createdAt: new Date("2025-10-25T12:00:00Z"),
      },
      {
        type: "spent",
        points: 100,
        description: "Canje en Nike",
        createdAt: new Date("2025-10-24T15:00:00Z"),
      },
    ])

    const req = new Request("http://localhost", {
      headers: { Authorization: "Bearer valid" },
    })
    await GET(req)

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { userId: 1 },
      orderBy: { createdAt: "desc" },
      select: {
        type: true,
        points: true,
        description: true,
        createdAt: true,
      },
    })

    expect(NextResponse.json).toHaveBeenCalledWith({
      movements: expect.arrayContaining([
        expect.objectContaining({ type: "earned" }),
        expect.objectContaining({ type: "spent" }),
      ]),
    })
  })

  it("debe manejar errores del servidor correctamente", async () => {
    ;(jwt.verify as jest.Mock).mockReturnValue({ id: 1 })
    mockFindMany.mockRejectedValue(new Error("DB error"))

    const req = new Request("http://localhost", {
      headers: { Authorization: "Bearer valid" },
    })
    await GET(req)

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Error del servidor" },
      { status: 500 }
    )
  })
})
