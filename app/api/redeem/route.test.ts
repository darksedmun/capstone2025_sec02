/**
 * @jest-environment node
 */

import jwt from "jsonwebtoken"
import { NextResponse } from "next/server"

const mockFindUniqueUser = jest.fn()
const mockFindUniqueReward = jest.fn()
const mockUpdateUser = jest.fn()
const mockCreateRedeemedReward = jest.fn()
const mockCreateTransaction = jest.fn()
const mockFindManyRedeemed = jest.fn()
const mockDisconnect = jest.fn()

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: { findUnique: mockFindUniqueUser, update: mockUpdateUser },
    reward: { findUnique: mockFindUniqueReward },
    redeemedReward: { create: mockCreateRedeemedReward, findMany: mockFindManyRedeemed },
    pointTransaction: { create: mockCreateTransaction },
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

import { POST, GET } from "./route"

describe("POST /api/redeem", () => {
  beforeEach(() => jest.clearAllMocks())

  it("debe retornar 401 si no hay token", async () => {
    const req = new Request("http://localhost", {
      method: "POST",
      headers: {},
    })
    await POST(req)
    expect(NextResponse.json).toHaveBeenCalledWith({ error: "No autorizado" }, { status: 401 })
  })

  it("debe retornar 401 si el token es inválido", async () => {
    ;(jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("invalid")
    })

    const req = new Request("http://localhost", {
      method: "POST",
      headers: { Authorization: "Bearer invalid" },
    })
    await POST(req)
    expect(NextResponse.json).toHaveBeenCalledWith({ error: "Token inválido" }, { status: 401 })
  })

  it("debe retornar 404 si usuario o cupón no existen", async () => {
    ;(jwt.verify as jest.Mock).mockReturnValue({ id: 1 })
    mockFindUniqueUser.mockResolvedValue(null)
    mockFindUniqueReward.mockResolvedValue(null)

    const req = new Request("http://localhost", {
      method: "POST",
      headers: { Authorization: "Bearer valid" },
      body: JSON.stringify({ rewardId: 2 }),
    })
    await POST(req)
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Usuario o cupón no encontrado" },
      { status: 404 }
    )
  })

  it("debe retornar 400 si el usuario no tiene puntos suficientes", async () => {
    ;(jwt.verify as jest.Mock).mockReturnValue({ id: 1 })
    mockFindUniqueUser.mockResolvedValue({ id: 1, points: 100 })
    mockFindUniqueReward.mockResolvedValue({ id: 2, points: 200 })

    const req = new Request("http://localhost", {
      method: "POST",
      headers: { Authorization: "Bearer valid" },
      body: JSON.stringify({ rewardId: 2 }),
    })
    await POST(req)
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Puntos insuficientes" },
      { status: 400 }
    )
  })

  it("debe canjear correctamente una recompensa", async () => {
    ;(jwt.verify as jest.Mock).mockReturnValue({ id: 1 })
    mockFindUniqueUser.mockResolvedValue({ id: 1, points: 1000 })
    mockFindUniqueReward.mockResolvedValue({ id: 2, name: "Nike Cupón", points: 500 })
    mockUpdateUser.mockResolvedValue({ id: 1, points: 500 })

    const req = new Request("http://localhost", {
      method: "POST",
      headers: { Authorization: "Bearer valid" },
      body: JSON.stringify({ rewardId: 2 }),
    })

    await POST(req)

    expect(mockUpdateUser).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { points: { decrement: 500 } },
    })
    expect(mockCreateRedeemedReward).toHaveBeenCalled()
    expect(mockCreateTransaction).toHaveBeenCalled()
    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.stringContaining("canjeado correctamente"),
        remainingPoints: 500,
      })
    )
  })

  it("debe manejar errores del servidor", async () => {
    ;(jwt.verify as jest.Mock).mockReturnValue({ id: 1 })
    mockFindUniqueUser.mockRejectedValue(new Error("DB error"))

    const req = new Request("http://localhost", {
      method: "POST",
      headers: { Authorization: "Bearer valid" },
      body: JSON.stringify({ rewardId: 2 }),
    })

    await POST(req)
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Error del servidor" },
      { status: 500 }
    )
  })
})

describe("GET /api/redeem", () => {
  beforeEach(() => jest.clearAllMocks())

  it("debe retornar 401 si no hay token", async () => {
    const req = new Request("http://localhost", { headers: {} })
    await GET(req)
    expect(NextResponse.json).toHaveBeenCalledWith({ error: "No autorizado" }, { status: 401 })
  })

  it("debe retornar 401 si el token es inválido", async () => {
    ;(jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("invalid")
    })

    const req = new Request("http://localhost", {
      headers: { Authorization: "Bearer invalid" },
    })
    await GET(req)
    expect(NextResponse.json).toHaveBeenCalledWith({ error: "Token inválido" }, { status: 401 })
  })

  it("debe retornar el historial de canjes correctamente", async () => {
    ;(jwt.verify as jest.Mock).mockReturnValue({ id: 1 })

    mockFindManyRedeemed.mockResolvedValue([
      {
        id: 1,
        redeemedAt: new Date("2025-10-25T12:00:00Z"),
        reward: {
          name: "Cupón Starbucks",
          store: "Starbucks",
          points: 400,
          image: "img.png",
        },
      },
    ])

    const req = new Request("http://localhost", {
      headers: { Authorization: "Bearer valid" },
    })
    await GET(req)

    expect(mockFindManyRedeemed).toHaveBeenCalledWith({
      where: { userId: 1 },
      include: { reward: true },
      orderBy: { redeemedAt: "desc" },
    })
    expect(NextResponse.json).toHaveBeenCalledWith({
      redeemed: expect.arrayContaining([
        expect.objectContaining({
          name: "Cupón Starbucks",
          store: "Starbucks",
          points: 400,
        }),
      ]),
    })
  })

  it("debe manejar errores del servidor", async () => {
    ;(jwt.verify as jest.Mock).mockReturnValue({ id: 1 })
    mockFindManyRedeemed.mockRejectedValue(new Error("DB error"))

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
