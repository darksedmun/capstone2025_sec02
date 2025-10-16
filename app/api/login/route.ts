import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "supersecreto";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Usuario y contraseña son requeridos" },
        { status: 400 }
      );
    }

    // Buscar usuario por username
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Validar contraseña
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Contraseña incorrecta" },
        { status: 401 }
      );
    }

    // Generar JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({ success: true, token });
  } catch (err) {
    // ✅ Evita mostrar errores en consola cuando NODE_ENV === 'test'
    if (process.env.NODE_ENV !== "test") {
      console.error(err);
    }

    return NextResponse.json(
      { success: false, error: "Error en el servidor" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
