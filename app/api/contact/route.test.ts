/**
 * @jest-environment node
 */

import { POST } from "./route"
import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

jest.mock("@prisma/client", () => {
  const mockCreate = jest.fn()
  return {
    PrismaClient: jest.fn(() => ({
      contactMessage: { create: mockCreate },
    })),
  }
})

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options })),
  },
}))

describe("POST /api/contact", () => {
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
      json: async () => ({ name: "Mauricio", email: "" }),
    } as Request

    await POST(req)

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Faltan campos obligatorios" },
      { status: 400 }
    )
  })

  it("debería crear un nuevo mensaje correctamente", async () => {
    const fakeMessage = {
      id: 1,
      name: "Mauricio",
      email: "test@mail.com",
      message: "Hola!",
      createdAt: new Date(),
    }
    mockPrisma.contactMessage.create.mockResolvedValue(fakeMessage)

    const req = {
      json: async () => ({
        name: "Mauricio",
        email: "test@mail.com",
        message: "Hola!",
      }),
    } as Request

    await POST(req)

    expect(mockPrisma.contactMessage.create).toHaveBeenCalledWith({
      data: {
        name: "Mauricio",
        email: "test@mail.com",
        message: "Hola!",
      },
    })

    expect(NextResponse.json).toHaveBeenCalledWith(
      { success: true, data: fakeMessage },
      { status: 201 }
    )
  })

  it("debería devolver 500 si hay un error inesperado", async () => {
    mockPrisma.contactMessage.create.mockRejectedValue(new Error("DB error"))

    const req = {
      json: async () => ({
        name: "Mauricio",
        email: "test@mail.com",
        message: "Hola!",
      }),
    } as Request

    await POST(req)

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Error al guardar el mensaje" },
      { status: 500 }
    )
  })
})
