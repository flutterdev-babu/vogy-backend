import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const agents = await prisma.agent.findMany({
    select: {
      id: true,
      customId: true,
      name: true,
      phone: true,
      email: true,
      cityCodeId: true,
    }
  });

  console.log('--- Agents ---');
  console.log(JSON.stringify(agents, null, 2));

  const cityCodes = await prisma.cityCode.findMany();
  console.log('--- City Codes ---');
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
