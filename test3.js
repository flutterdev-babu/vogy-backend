const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ride = await prisma.ride.findUnique({
    where: { id: '69dfaea35a8c14e4960fcffe' },
    select: { id: true, status: true, customId: true }
  });
  console.log(JSON.stringify(ride, null, 2));
}

main().finally(() => prisma.$disconnect());
