import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
  const rewards = [
    {
      name: "Descuento en McDonald's",
      description: "Combo Big Mac a mitad de precio 🍔",
      points: 2000,
      store: "McDonald's",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/McDonald%27s_Golden_Arches.svg/877px-McDonald%27s_Golden_Arches.svg.png",
    },
    {
      name: "Descuento en Adidas",
      description: "10% en tu próxima compra 👟",
      points: 3000,
      store: "Adidas",
      image: "https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg",
    },
    {
      name: "Descuento en Nike",
      description: "15% de descuento en zapatillas seleccionadas 🏃‍♂️",
      points: 2800,
      store: "Nike",
      image: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg",
    },
    {
      name: "Descuento en Falabella",
      description: "15% off en artículos del hogar 🛋️",
      points: 2700,
      store: "Falabella",
      image: "https://upload.wikimedia.org/wikipedia/commons/6/6a/Falabella.svg",
    },
  ]

  await prisma.reward.createMany({ data: rewards })
  console.log("✅ Cupones insertados correctamente.")
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect())
