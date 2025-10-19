import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "supersecreto";
const ADMIN_KEY = process.env.ADMIN_KEY || "miclavesupersecreta"; 

export async function POST(req: Request) {
  try {
    const { name, email, username, password, phone, adminKey } = await req.json();

    if (!name || !email || !username || !password || !phone) {
      return NextResponse.json(
        { success: false, error: "Todos los campos son obligatorios" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        { success: false, error: "Email inválido" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "El nombre de usuario ya existe" },
        { status: 400 }
      );
    }

    const existingEmail = await prisma.user.findFirst({ where: { email } });
    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: "El correo electrónico ya está en uso" },
        { status: 400 }
      );
    }

    let role: "USER" | "ADMIN" = "USER";
    if (adminKey) {
      if (adminKey !== ADMIN_KEY) {
        return NextResponse.json(
          { success: false, error: "Clave de admin incorrecta" },
          { status: 403 }
        );
      }
      role = "ADMIN";
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await prisma.user.create({
      data: { username, password: hashedPassword, email, name, role, phone },
    });

    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, role: newUser.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({ success: true, token });
  } catch (err: any) {
  
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[]).join(", ");
      return NextResponse.json(
        { success: false, error: `Ya existe un usuario con: ${target}` },
        { status: 400 }
      );
    }

    console.error(err);
    return NextResponse.json(
      { success: false, error: "Error en el servidor" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
