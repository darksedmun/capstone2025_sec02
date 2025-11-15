/**
 * @jest-environment node
 */

import { POST } from "./route"
import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"

jest.mock("@prisma/client", () => {
  const mockFindUnique = jest.fn()
  const mockUpdate = jest.fn()
  const mockDisconnect = jest.fn().mockResolvedValue(undefined)

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: {
        findUnique: mockFindUnique,
        update: mockUpdate,
      },
      $disconnect: mockDisconnect,
    })),
    __mocks: {
      mockFindUnique,
      mockUpdate,
      mockDisconnect,
    },
  }
})

jest.mock("bcrypt", () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue("hashedPassword"),
}))

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options })),
  },
}))

const { __mocks } = jest.requireMock("@prisma/client")
const { mockFindUnique, mockUpdate } = __mocks as {
  mockFindUnique: jest.Mock
  mockUpdate: jest.Mock
}

describe("POST /api/reset-password", () => {
  const mockPrisma = new PrismaClient() as any
  let originalConsoleError: typeof console.error

  beforeAll(() => {
    originalConsoleError = console.error
    console.error = jest.fn()
  })

  afterAll(() => {
    console.error = originalConsoleError
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("debería devolver 400 si faltan campos", async () => {
    const req = {
      json: async () => ({
        username: "Mauricio",
        oldPassword: "",
        password: "1234",
        confirmPassword: "1234",
      }),
    } as Request

    await POST(req)

    expect(NextResponse.json).toHaveBeenCalledWith(
      { success: false, error: "Todos los campos son obligatorios" },
      { status: 400 }
    )
  })

  it("debería devolver 400 si las contraseñas no coinciden", async () => {
    const req = {
      json: async () => ({
        username: "Mauricio",
        oldPassword: "oldpass",
        password: "1234",
        confirmPassword: "9999",
      }),
    } as Request

    await POST(req)

    expect(NextResponse.json).toHaveBeenCalledWith(
      { success: false, error: "Las contraseñas no coinciden" },
      { status: 400 }
    )
  })

  it("debería devolver 404 si el usuario no existe", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)

    const req = {
      json: async () => ({
        username: "Mauricio",
        oldPassword: "oldpass",
        password: "1234",
        confirmPassword: "1234",
      }),
    } as Request

    await POST(req)

    expect(NextResponse.json).toHaveBeenCalledWith(
      { success: false, error: "Usuario no encontrado" },
      { status: 404 }
    )
  })

  it("debería devolver 401 si la contraseña actual es incorrecta", async () => {
    const fakeUser = {
      id: 1,
      username: "Mauricio",
      password: "hashedOldPass",
    }

    mockPrisma.user.findUnique.mockResolvedValue(fakeUser)
    ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

    const req = {
      json: async () => ({
        username: "Mauricio",
        oldPassword: "wrongPass",
        password: "1234",
        confirmPassword: "1234",
      }),
    } as Request

    await POST(req)

    expect(bcrypt.compare).toHaveBeenCalledWith("wrongPass", "hashedOldPass")

    expect(NextResponse.json).toHaveBeenCalledWith(
      { success: false, error: "La contraseña actual es incorrecta" },
      { status: 401 }
    )
  })

  it("debería actualizar la contraseña correctamente", async () => {
    const fakeUser = {
      id: 1,
      username: "Mauricio",
      password: "hashedOldPass",
    }

    mockPrisma.user.findUnique.mockResolvedValue(fakeUser)
    ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

    mockPrisma.user.update.mockResolvedValue({
      ...fakeUser,
      password: "hashedPassword",
    })

    const req = {
      json: async () => ({
        username: "Mauricio",
        oldPassword: "oldpass",
        password: "nueva123",
        confirmPassword: "nueva123",
      }),
    } as Request

    await POST(req)

    expect(bcrypt.hash).toHaveBeenCalledWith("nueva123", 10)

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { password: "hashedPassword" },
    })

    expect(NextResponse.json).toHaveBeenCalledWith({ success: true })
  })

  it("debería devolver 500 si hay un error inesperado", async () => {
    mockPrisma.user.findUnique.mockRejectedValue(new Error("DB error"))

    const req = {
      json: async () => ({
        username: "Mauricio",
        oldPassword: "oldpass",
        password: "1234",
        confirmPassword: "1234",
      }),
    } as Request

    await POST(req)

    expect(NextResponse.json).toHaveBeenCalledWith(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    )
  })
})
