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

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { success: false, error: "No autorizado" },
      { status: 401 }
    )
  }

  const token = authHeader.split(" ")[1]
  const payload = verifyToken(token)

  if (!payload) {
    return NextResponse.json(
      { success: false, error: "Token inválido" },
      { status: 401 }
    )
  }

  const userId = payload.id

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { points: true, name: true },
  })

  const reciclajes = await prisma.reciclaje.findMany({
    where: { userId },
    select: { tipo: true, points: true, createdAt: true },
  })

  const canjes = await prisma.pointTransaction.findMany({
    where: { userId, type: "spent" },
    select: { points: true },
  })

  const totalReciclajes = reciclajes.length
  const totalPuntosReciclaje = reciclajes.reduce((sum, r) => sum + r.points, 0)
  const tipoMasReciclado = (() => {
    const counts: Record<string, number> = {}
    reciclajes.forEach((r) => (counts[r.tipo] = (counts[r.tipo] || 0) + 1))
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "ninguno"
  })()

  const puntosGastados = canjes.reduce((sum, c) => sum + c.points, 0)

  const insights = [
    {
      title: "Hábitos de reciclaje",
      message: `Tu material más reciclado este mes fue ${tipoMasReciclado.toUpperCase()}. ¡Excelente trabajo! ♻️`,
      type: "habit",
    },
    {
      title: "Sugerencia de canje",
      message: `Con tus ${user?.points ?? 0} pts, puedes canjear un cupón de McDonald's 🍔 o Nike 👟.`,
      type: "suggestion",
    },
    {
      title: "Resumen mensual",
      message: `Este mes reciclaste ${totalReciclajes} veces y acumulaste ${totalPuntosReciclaje} pts.`,
      type: "summary",
    },
  ]

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  for (const n of insights) {
    const exists = await prisma.notification.findFirst({
      where: {
        userId,
        type: n.type,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    })

    if (!exists) {
      await prisma.notification.create({
        data: {
          userId,
          title: n.title,
          message: n.message,
          type: n.type,
        },
      })
    }
  }

  const recent = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  const uniqueByType = recent.filter(
    (n, index, self) => index === self.findIndex(t => t.type === n.type)
  )

  return NextResponse.json({
    success: true,
    insights: uniqueByType,
    unreadCount: await prisma.notification.count({
      where: { userId, read: false },
    }),
  })
}

export async function PATCH(req: Request) {
  const authHeader = req.headers.get("Authorization")

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { success: false, error: "No autorizado" },
      { status: 401 }
    )
  }

  const token = authHeader.split(" ")[1]
  const payload = verifyToken(token)

  if (!payload) {
    return NextResponse.json(
      { success: false, error: "Token inválido" },
      { status: 401 }
    )
  }

  await prisma.notification.updateMany({
    where: { userId: payload.id, read: false },
    data: { read: true },
  })

  return NextResponse.json({ success: true })
}
