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

describe("API /notifications", () => {
  beforeEach(() => jest.clearAllMocks())

  it("GET debe retornar 401 si no hay token", async () => {
    const req = new Request("http://localhost")
    await GET(req)

    expect(NextResponse.json).toHaveBeenCalledWith(
      { success: false, error: "No autorizado" },
      { status: 401 }
    )
  })

  it("GET debe retornar 401 si el token es inválido", async () => {
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

  it("GET debe generar insights, evitar duplicados y retornar unreadCount", async () => {
    ;(jwt.verify as jest.Mock).mockReturnValue({ id: 1 })

    mockFindUnique.mockResolvedValue({ id: 1, points: 3500, name: "Juan" })

    mockFindMany
      .mockResolvedValueOnce([
        { tipo: "VIDRIO", points: 800, createdAt: new Date() },
        { tipo: "VIDRIO", points: 900, createdAt: new Date() },
      ])
      .mockResolvedValueOnce([{ points: 500 }])
      .mockResolvedValueOnce([
        {
          id: 1,
          type: "summary",
          title: "Resumen mensual",
          message: "Mensaje A",
          read: false,
          createdAt: new Date("2025-10-25T10:00:00Z"),
        },
        {
          id: 2,
          type: "summary",
          title: "Resumen mensual repetido",
          message: "Mensaje B",
          read: false,
          createdAt: new Date("2025-10-26T10:00:00Z"),
        },
        {
          id: 3,
          type: "habit",
          title: "Hábito",
          message: "Mensaje C",
          read: false,
          createdAt: new Date("2025-10-27T10:00:00Z"),
        },
      ])

    mockFindFirst.mockResolvedValue(null)
    mockCreate.mockResolvedValue({})
    mockCount.mockResolvedValue(2)

    const req = new Request("http://localhost", {
      headers: { Authorization: "Bearer valid" },
    })

    await GET(req)

    const response = (NextResponse.json as jest.Mock).mock.calls[0][0]

    const types = response.insights.map((n: any) => n.type)
    const uniqueTypes = [...new Set(types)]

    expect(types.length).toBe(uniqueTypes.length)
    expect(mockCreate).toHaveBeenCalledTimes(3)
    expect(response.unreadCount).toBe(2)
  })

  it("PATCH debe marcar notificaciones como leídas", async () => {
    ;(jwt.verify as jest.Mock).mockReturnValue({ id: 1 })
    mockUpdateMany.mockResolvedValue({ count: 3 })

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
