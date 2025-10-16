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
      plastico: 300,
      vidrio: 150,
      papel: 500,
      organico: 250,
      otro: 130,
      generico: 50,
    };
    const pointsToAdd = qr.tipo ? pointsMap[qr.tipo.toLowerCase()] || 50 : 50;

    await prisma.qRCode.update({
      where: { id: qr.id },
      data: { used: true, usedAt: new Date(), usedBy: userId },
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { points: { increment: pointsToAdd } },
    });

    await prisma.reciclaje.create({
      data: {
        userId,
        tipo: qr.tipo as any,
        points: pointsToAdd,
      },
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (user?.email) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS,
        },
      });

      const mailOptions = {
        from: `"EcoFinder" <${process.env.GMAIL_USER}>`,
        to: user.email,
        subject: `¡Gracias por reciclar, ${user.name || "usuario"}! ♻️`,
        text: `Has reciclado ${qr.tipo || "material"} y ganaste ${pointsToAdd} puntos. 
Tu total acumulado es de ${updatedUser.points} puntos. ¡Gracias por ayudar al planeta 🌍!`,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Correo enviado a ${user.email}`);
    }

    return NextResponse.json({
      success: true,
      message: `Reciclaje de ${qr.tipo || "desconocido"} registrado y correo enviado correctamente`,
      tipo: qr.tipo || "desconocido",
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
