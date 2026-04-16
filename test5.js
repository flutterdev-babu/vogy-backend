const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const rides = await prisma.ride.findMany({
    where: { status: { in: ['UPCOMING', 'SCHEDULED'] }, OR: [{ partnerId: null }, { partnerId: { isSet: false } }] },
    select: { id: true, status: true, partnerId: true }
  });
  console.log("Rides array:", JSON.stringify(rides, null, 2));
}
main().finally(() => prisma.$disconnect());
