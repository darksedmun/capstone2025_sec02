import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"

const prisma = new PrismaClient()
const SALT_ROUNDS = 10

export async function POST(req: Request) {
  try {
    const { username, oldPassword, password, confirmPassword } = await req.json()

    if (!username || !oldPassword || !password || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Todos los campos son obligatorios" },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Las contraseñas no coinciden" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password)
    if (!isOldPasswordValid) {
      return NextResponse.json(
        { success: false, error: "La contraseña actual es incorrecta" },
        { status: 401 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
