const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in3Hours = new Date(now.getTime() + 3 * 60 * 60 * 1000);

  console.log("Current Time (UTC):", now.toISOString());
  console.log("24h Threshold:", in24Hours.toISOString());
  console.log("3h Threshold:", in3Hours.toISOString());

  const events = await prisma.event.findMany({
    where: {
      status: "UPCOMING",
    },
    include: {
      attendances: true
    }
  });

  console.log(`Found ${events.length} UPCOMING events.`);
  
  for (const ev of events) {
    console.log(`Event: ${ev.title} | Date: ${ev.date.toISOString()} | notified24h: ${ev.notified24h} | notified3h: ${ev.notified3h}`);
    console.log(`  Attendances: ${ev.attendances.length} (Confirmed: ${ev.attendances.filter(a => a.status === 'CONFIRMED').length})`);
    
    if (ev.date <= in24Hours && ev.date > now && !ev.notified24h) {
      console.log("  >>> SHOULD BE REVEALED IN 24H JOB!");
    } else if (ev.date <= now) {
      console.log("  >>> THIS EVENT IS IN THE PAST!");
    } else if (ev.notified24h) {
      console.log("  >>> ALREADY NOTIFIED 24H.");
    } else {
      console.log("  >>> MORE THAN 24H AWAY.");
    }
  }
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
