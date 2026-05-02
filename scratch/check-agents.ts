import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const agents = await prisma.agent.findMany({
    select: {
      id: true,
      name: true,
      phone: true,
      customId: true
    }
  });
  console.log('--- AGENTS IN DB ---');
  console.log(JSON.stringify(agents, null, 2));
  console.log('--------------------');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
