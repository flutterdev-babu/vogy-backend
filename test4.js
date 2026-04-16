const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const rides = await prisma.ride.findMany({
    where: { status: { in: ['UPCOMING', 'SCHEDULED'] }, partnerId: null },
    select: { id: true, status: true }
  });
  console.log("Rides array:", JSON.stringify(rides, null, 2));
}
main().finally(() => prisma.$disconnect());
