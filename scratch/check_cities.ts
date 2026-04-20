import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cities = await prisma.cityCode.findMany();
  console.log('--- City Codes ---');
  console.log(cities);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
