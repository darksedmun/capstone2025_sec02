import { NextResponse } from "next/server";
import * as nodemailer from "nodemailer";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "supersecreto";

function errorResponse(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

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

export async function POST(req: Request) {
  try {
    const { qrCode } = await req.json();
    if (!qrCode) return errorResponse("QR es requerido", 400);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return errorResponse("No autorizado", 401);

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);
    if (!payload) return errorResponse("Token inválido", 401);

    const userId = payload.id;

    const qr = await prisma.qRCode.findUnique({ where: { code: qrCode } });
    if (!qr) return errorResponse("QR no válido", 404);
    if (qr.used) return errorResponse("QR ya usado", 400);

    const pointsMap: Record<string, number> = {
      plastico: 1300,
      vidrio: 1500,
      papel: 2500,
      metal: 2000,
      organico: 2500,
    };
    const material = (qr.tipo || "material").toString();
    const pointsToAdd = qr.tipo ? pointsMap[material.toLowerCase()] || 50 : 50;

    const [_, updatedUser] = await prisma.$transaction([
      prisma.qRCode.update({
        where: { id: qr.id },
        data: { used: true, usedAt: new Date(), usedBy: userId },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { points: { increment: pointsToAdd } },
        select: { id: true, points: true, email: true, name: true },
      }),
      prisma.reciclaje.create({
        data: { userId, tipo: qr.tipo as any, points: pointsToAdd },
      }),
      prisma.pointTransaction.create({
        data: {
          userId,
          type: "earned",
          points: pointsToAdd,
          description: `Ganaste ${pointsToAdd} puntos por reciclar ${material}`,
        },
      }),
    ]);

    if (updatedUser?.email) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS,
        },
      });

      const mailOptions = {
        from: `"EcoFinder" <${process.env.GMAIL_USER}>`,
        to: updatedUser.email,
        subject: `¡Gracias por reciclar, ${updatedUser.name || "usuario"}! ♻️`,
        text: `Has reciclado ${material} y ganaste ${pointsToAdd} puntos.
Tu total acumulado es de ${updatedUser.points} puntos. ¡Gracias por ayudar al planeta 🌍!`,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`Correo enviado a ${updatedUser.email}`);
      } catch (e) {
        console.warn("No se pudo enviar el correo:", e);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Reciclaje de ${material} registrado correctamente`,
      tipo: material,
      pointsAdded: pointsToAdd,
      totalPoints: updatedUser.points,
    });
  } catch (err) {
    console.error(err);
    return errorResponse("Error del servidor", 500);
  } finally {
    await prisma.$disconnect();
  }
}
