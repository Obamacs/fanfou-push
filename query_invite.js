const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const invites = await prisma.inviteCode.findMany({
    include: { owner: { select: { name: true, role: true } } }
  });
  console.log(JSON.stringify(invites, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
