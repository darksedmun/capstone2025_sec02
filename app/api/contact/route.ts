import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json()

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
    }

    const newMessage = await prisma.contactMessage.create({
      data: { name, email, message },
    })

    return NextResponse.json({ success: true, data: newMessage }, { status: 201 })
  } catch (error) {
    console.error("Error al guardar mensaje de contacto:", error)
    return NextResponse.json({ error: "Error al guardar el mensaje" }, { status: 500 })
  }
}
