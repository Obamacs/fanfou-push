import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@meal-meet.com";
  const password = process.env.ADMIN_PASSWORD || "Admin123!";
  const name = process.env.ADMIN_NAME || "Admin";

  const hashedPassword = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: {
        role: "ADMIN",
        canCreateEvents: true,
        passwordHash: hashedPassword,
      },
    });
    console.log(`🔑 Admin password reset: ${email}`);
    console.log(`   Password: ${password}`);
    return;
  }

  await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: hashedPassword,
      role: "ADMIN",
      isActive: true,
      isBanned: false,
      canCreateEvents: true,
    },
  });

  console.log(`✅ Admin created: ${email}`);
  console.log(`   Password: ${password}`);
}

main()
  .catch((e) => {
    console.error("Failed:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
