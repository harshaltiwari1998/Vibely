/**
 * One-time bootstrap: promotes a user to SUPER_ADMIN by email.
 * Needed because there is no other way to create the first admin —
 * every other role change goes through the (SuperAdmin-only) admin API.
 *
 * Usage: npm run admin:promote -- someone@example.com
 */
import { PrismaClient } from "@prisma/client";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npm run admin:promote -- <email>");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.error(`No user found with email ${email}`);
      process.exit(1);
    }

    const updated = await prisma.user.update({
      where: { email },
      data: { role: "SUPER_ADMIN" },
      select: { id: true, username: true, email: true, role: true },
    });

    console.log("Promoted:", updated);
  } finally {
    await prisma.$disconnect();
  }
}

main();
