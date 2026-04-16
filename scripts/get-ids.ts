import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const vehicleTypes = await prisma.vehicleType.findMany({
    select: { id: true, name: true }
  });
  const cityCodes = await prisma.cityCode.findMany({
    select: { id: true, code: true, cityName: true }
  });

  console.log('--- VEHICLE TYPES ---');
  console.log(JSON.stringify(vehicleTypes, null, 2));
  console.log('--- CITY CODES ---');
  console.log(JSON.stringify(cityCodes, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
