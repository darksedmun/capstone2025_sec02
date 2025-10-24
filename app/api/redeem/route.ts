import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import jwt from "jsonwebtoken"

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || "supersecreto"

function verifyToken(token: string): { id: number } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    if (typeof payload === "object" && payload && "id" in payload) {
      return payload as { id: number }
    }
    return null
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const { rewardId } = await req.json()

    const user = await prisma.user.findUnique({ where: { id: payload.id } })
    const reward = await prisma.reward.findUnique({ where: { id: rewardId } })

    if (!user || !reward) {
      return NextResponse.json({ error: "Usuario o cupón no encontrado" }, { status: 404 })
    }

    if (user.points < reward.points) {
      return NextResponse.json({ error: "Puntos insuficientes" }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { points: { decrement: reward.points } },
    })

    await prisma.redeemedReward.create({
      data: {
        userId: user.id,
        rewardId: reward.id,
      },
    })

    await prisma.pointTransaction.create({
      data: {
        userId: user.id,
        type: "spent",
        points: reward.points,
        description: `Canjeaste ${reward.name}`,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Cupón ${reward.name} canjeado correctamente`,
      remainingPoints: updatedUser.points,
    })
  } catch (error) {
    console.error("Error al canjear:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const redeemed = await prisma.redeemedReward.findMany({
      where: { userId: payload.id },
      include: { reward: true },
      orderBy: { redeemedAt: "desc" },
    })

    return NextResponse.json({
      redeemed: redeemed.map((r) => ({
        id: r.id,
        name: r.reward.name,
        store: r.reward.store,
        points: r.reward.points,
        image: r.reward.image,
        redeemedAt: r.redeemedAt,
      })),
    })
  } catch (error) {
    console.error("Error al obtener historial:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
