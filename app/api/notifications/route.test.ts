/**
 * @jest-environment node
 */
import { GET, PATCH } from "./route"
import jwt from "jsonwebtoken"
import { NextResponse } from "next/server"

jest.mock("@prisma/client", () => {
  const mockFindUnique = jest.fn()
  const mockFindMany = jest.fn()
  const mockFindFirst = jest.fn()
  const mockCreate = jest.fn()
  const mockCount = jest.fn()
  const mockUpdateMany = jest.fn()

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: { findUnique: mockFindUnique },
      reciclaje: { findMany: mockFindMany },
      pointTransaction: { findMany: mockFindMany },
      notification: {
        findFirst: mockFindFirst,
        findMany: mockFindMany,
        create: mockCreate,
        count: mockCount,
        updateMany: mockUpdateMany,
      },
    })),
    __mocks: {
      mockFindUnique,
      mockFindMany,
      mockFindFirst,
      mockCreate,
      mockCount,
      mockUpdateMany,
    },
  }
})

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}))

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options })),
  },
}))

const { __mocks } = jest.requireMock("@prisma/client")
const {
  mockFindUnique,
  mockFindMany,
  mockFindFirst,
  mockCreate,
  mockCount,
  mockUpdateMany,
} = __mocks

describe("GET /api/notifications", () => {
  beforeEach(() => jest.clearAllMocks())

  it("debe retornar 401 si no hay token", async () => {
    const req = new Request("http://localhost", { headers: {} })
    await GET(req)
    expect(NextResponse.json).toHaveBeenCalledWith(
      { success: false, error: "No autorizado" },
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
      { success: false, error: "Token inválido" },
      { status: 401 }
    )
  })

  it("debe generar y devolver notificaciones correctamente", async () => {
    ;(jwt.verify as jest.Mock).mockReturnValue({ id: 1 })
    mockFindUnique.mockResolvedValue({ id: 1, points: 3700, name: "Juan" })
    mockFindMany
      .mockResolvedValueOnce([
        { tipo: "ORGANICO", points: 1200, createdAt: new Date() },
        { tipo: "VIDRIO", points: 800, createdAt: new Date() },
      ])
      .mockResolvedValueOnce([{ points: 500 }])
    mockFindFirst.mockResolvedValue(null)
    mockCreate.mockResolvedValue({})
    mockFindMany.mockResolvedValue([
      {
        id: 1,
        title: "Resumen mensual",
        message: "Mensaje de prueba",
        type: "summary",
        read: false,
        createdAt: new Date(),
      },
    ])
    mockCount.mockResolvedValue(1)

    const req = new Request("http://localhost", {
      headers: { Authorization: "Bearer valid" },
    })
    await GET(req)

    expect(mockCreate).toHaveBeenCalledTimes(3)
    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        insights: expect.any(Array),
        unreadCount: 1,
      })
    )
  })
})

describe("PATCH /api/notifications", () => {
  beforeEach(() => jest.clearAllMocks())

  it("debe retornar 401 si no hay token", async () => {
    const req = new Request("http://localhost", { headers: {} })
    await PATCH(req)
    expect(NextResponse.json).toHaveBeenCalledWith(
      { success: false, error: "No autorizado" },
      { status: 401 }
    )
  })

  it("debe marcar como leídas las notificaciones", async () => {
    ;(jwt.verify as jest.Mock).mockReturnValue({ id: 1 })
    mockUpdateMany.mockResolvedValue({ count: 2 })

    const req = new Request("http://localhost", {
      headers: { Authorization: "Bearer valid" },
    })
    await PATCH(req)

    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { userId: 1, read: false },
      data: { read: true },
    })
    expect(NextResponse.json).toHaveBeenCalledWith({ success: true })
  })
})
