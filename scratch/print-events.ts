import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== DB Events ===");
  const events = await prisma.event.findMany({
    select: {
      id: true,
      title: true,
      type: true,
      city: true,
      status: true,
    }
  });
  console.log(JSON.stringify(events, null, 2));

  console.log("=== DB Users ===");
  const users = await prisma.user.findMany({
    take: 5,
    select: {
      id: true,
      name: true,
      city: true,
    }
  });
  console.log(JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
