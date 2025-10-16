-- CreateEnum
CREATE TYPE "TipoReciclaje" AS ENUM ('PLASTICO', 'VIDRIO', 'PAPEL', 'METAL', 'ORGANICO', 'OTRO');

-- AlterTable
ALTER TABLE "QRCode" ADD COLUMN     "tipo" TEXT NOT NULL DEFAULT 'generico';

-- CreateTable
CREATE TABLE "Reciclaje" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tipo" "TipoReciclaje" NOT NULL,
    "points" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reciclaje_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Reciclaje" ADD CONSTRAINT "Reciclaje_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
