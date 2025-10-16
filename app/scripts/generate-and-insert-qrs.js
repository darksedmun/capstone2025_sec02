import fs from "fs";
import path from "path";
import QRCode from "qrcode";
import { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

const OUT_DIR = path.join(process.cwd(), "generated-qrs");
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const QRS = [
  { code: "RECYCLE67890", tipo: "PLASTICO", points: 300 },
  { code: "RECYCLE67891", tipo: "VIDRIO", points: 150 },
  { code: "RECYCLE67892", tipo: "PAPEL", points: 500 },
  { code: "RECYCLE67893", tipo: "METAL", points: 200 },
  { code: "RECYCLE67894", tipo: "ORGANICO", points: 250 },
];

async function generateImage(code) {
  const filename = `${code}.jpg`;
  const outPath = path.join(OUT_DIR, filename);
  await QRCode.toFile(outPath, code, { width: 800, type: "jpg", margin: 2 });
  return outPath;
}

async function upsertQRCode(entry) {
  const now = new Date();
  const data = {
    code: entry.code,
    tipo: entry.tipo ?? "generico",
    points: typeof entry.points === "number" ? entry.points : 50,
    used: false,
  };

  return prisma.qRCode.upsert({
    where: { code: entry.code },
    update: {
      tipo: data.tipo,
      points: data.points,
      used: false,
      usedAt: null,
      usedBy: null,
    },
    create: {
      code: data.code,
      tipo: data.tipo,
      points: data.points,
      used: false,
    },
  });
}

async function main() {
  try {
    console.log("🔁 Generando QRs e insertando en DB...");
    for (const entry of QRS) {
      const imgPath = await generateImage(entry.code);
      console.log("✅ Imagen generada:", imgPath);

      const dbEntry = await upsertQRCode(entry);
      console.log("💾 Upserted DB QR:", dbEntry.code, "| tipo:", dbEntry.tipo, "| points:", dbEntry.points);
    }
    console.log("\n🎉 Listo. Imágenes en:", OUT_DIR);
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
