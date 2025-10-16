import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "supersecreto";

function verifyToken(token: string): { id: number } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (typeof payload === "object" && payload !== null && "id" in payload) {
      return payload as { id: number };
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) 
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token);
  if (!payload) 
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { points: true, name: true, email: true }, 
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      points: user.points ?? 0,
      name: user.name ?? null,
      email: user.email ?? null,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
