import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import jwt from "jsonwebtoken"

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || "supersecreto"

function verifyToken(token: string): { id: number } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    if (typeof payload === "object" && payload !== null && "id" in payload) {
      return payload as { id: number }
    }
    return null
  } catch {
    return null
  }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("Authorization")
  let userPoints = 0

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1]
    const payload = verifyToken(token)
    if (payload) {
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { points: true },
      })
      userPoints = user?.points ?? 0
    }
  }

  try {
    const rewards = await prisma.reward.findMany({
      orderBy: { points: "asc" },
    })

    const rewardsWithStatus = rewards.map((r) => ({
      ...r,
      canRedeem: userPoints >= r.points,
    }))

    const newRewardsCount = rewardsWithStatus.filter((r) => r.canRedeem).length

    return NextResponse.json({
      rewards: rewardsWithStatus,
      userPoints,
      newRewardsCount, 
    })
  } catch (error) {
    console.error("Error al obtener recompensas:", error)
    return NextResponse.json(
      { error: "Error al cargar recompensas" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
