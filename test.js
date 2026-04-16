const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rides = await prisma.ride.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      status: true,
      customId: true,
      isManualBooking: true,
      partnerId: true,
      scheduledDateTime: true,
      createdAt: true
    }
  });
  console.log(JSON.stringify(rides, null, 2));
}

main().finally(() => prisma.$disconnect());
