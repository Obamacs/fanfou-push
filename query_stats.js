const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
  const userCount = await prisma.user.count({ where: { role: 'USER' } });
  const eventCount = await prisma.event.count();
  const poolCount = await prisma.event.count({ where: { type: 'POOL' } });
  const couponCount = await prisma.freeCoupon.count();
  const orderCount = await prisma.eventAttendance.count();
  
  console.log(`Admins: ${adminCount}`);
  console.log(`Users: ${userCount}`);
  console.log(`Events: ${eventCount} (of which POOL: ${poolCount})`);
  console.log(`Coupons issued: ${couponCount}`);
  console.log(`Attendances/Orders: ${orderCount}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
