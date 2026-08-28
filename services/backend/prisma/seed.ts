import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const gift1 = await prisma.gift.upsert({
    where: { id: "gift-1" },
    update: {},
    create: { id: "gift-1", name: "Heart", iconUrl: "/gifts/heart.png", coinCost: 10, active: true },
  });

  const gift2 = await prisma.gift.upsert({
    where: { id: "gift-2" },
    update: {},
    create: { id: "gift-2", name: "Star", iconUrl: "/gifts/star.png", coinCost: 25, active: true },
  });

  const gift3 = await prisma.gift.upsert({
    where: { id: "gift-3" },
    update: {},
    create: { id: "gift-3", name: "Crown", iconUrl: "/gifts/crown.png", coinCost: 100, active: true },
  });

  await prisma.coinPackage.upsert({
    where: { id: "pkg-1" },
    update: {},
    create: { id: "pkg-1", name: "Starter", coins: 100, price: 99, currency: "INR", active: true, sortOrder: 1 },
  });

  await prisma.coinPackage.upsert({
    where: { id: "pkg-2" },
    update: {},
    create: { id: "pkg-2", name: "Popular", coins: 500, price: 399, currency: "INR", active: true, sortOrder: 2 },
  });

  await prisma.coinPackage.upsert({
    where: { id: "pkg-3" },
    update: {},
    create: { id: "pkg-3", name: "Premium", coins: 1200, price: 799, currency: "INR", active: true, sortOrder: 3 },
  });

  await prisma.coinPackage.upsert({
    where: { id: "pkg-4" },
    update: {},
    create: { id: "pkg-4", name: "Ultimate", coins: 3000, price: 1999, currency: "INR", active: true, sortOrder: 4 },
  });

  console.log("Seed completed:", { gifts: [gift1, gift2, gift3] });
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
