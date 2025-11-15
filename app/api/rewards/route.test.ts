/**
 * @jest-environment node
 */

import jwt from "jsonwebtoken"
import { NextResponse } from "next/server"

const mockFindUniqueUser = jest.fn()
const mockFindManyRewards = jest.fn()
const mockDisconnect = jest.fn()

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: { findUnique: mockFindUniqueUser },
    reward: { findMany: mockFindManyRewards },
    $disconnect: mockDisconnect,
  })),
}))

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}))

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn(),
  },
}))

import { GET } from "./route"

describe("GET /api/rewards", () => {
  beforeEach(() => jest.clearAllMocks())

  it("debe retornar recompensas sin usuario autenticado", async () => {
    mockFindManyRewards.mockResolvedValue([
      { id: 1, name: "Café Gratis", points: 200 },
      { id: 2, name: "Descuento Nike", points: 800 },
    ])

    const req = new Request("http://localhost/api/rewards")
    await GET(req)

    expect(NextResponse.json).toHaveBeenCalledWith({
      rewards: [
        { id: 1, name: "Café Gratis", points: 200, canRedeem: false },
        { id: 2, name: "Descuento Nike", points: 800, canRedeem: false },
      ],
      userPoints: 0,
      newRewardsCount: 0,
    })
  })

  it("debe retornar recompensas y puntos del usuario autenticado", async () => {
    ;(jwt.verify as jest.Mock).mockReturnValue({ id: 1 })

    mockFindUniqueUser.mockResolvedValue({ id: 1, points: 600 })
    mockFindManyRewards.mockResolvedValue([
      { id: 1, name: "Café Gratis", points: 200 },
      { id: 2, name: "Descuento Nike", points: 800 },
    ])

    const req = new Request("http://localhost/api/rewards", {
      headers: { Authorization: "Bearer valid" },
    })
    await GET(req)

    expect(NextResponse.json).toHaveBeenCalledWith({
      rewards: [
        { id: 1, name: "Café Gratis", points: 200, canRedeem: true },
        { id: 2, name: "Descuento Nike", points: 800, canRedeem: false },
      ],
      userPoints: 600,
      newRewardsCount: 1,
    })
  })

  it("debe retornar recompensas si el token es inválido", async () => {
    ;(jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("invalid token")
    })

    mockFindManyRewards.mockResolvedValue([
      { id: 1, name: "Café Gratis", points: 200 },
    ])

    const req = new Request("http://localhost/api/rewards", {
      headers: { Authorization: "Bearer invalid" },
    })
    await GET(req)

    expect(NextResponse.json).toHaveBeenCalledWith({
      rewards: [
        { id: 1, name: "Café Gratis", points: 200, canRedeem: false },
      ],
      userPoints: 0,
      newRewardsCount: 0,
    })
  })

  it("debe manejar errores del servidor", async () => {
    mockFindManyRewards.mockRejectedValue(new Error("DB error"))

    const req = new Request("http://localhost/api/rewards")
    await GET(req)

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Error al cargar recompensas" },
      { status: 500 }
    )
  })
})
