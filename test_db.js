const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const event = await prisma.event.findFirst({
    where: { title: '见你一面（周四的吃面局）' },
    include: {
      attendances: {
        where: { status: 'CONFIRMED' },
        include: { user: true }
      }
    }
  });
  console.log(JSON.stringify(event.attendances.map(a => a.user.email), null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
