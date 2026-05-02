import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const vendors = await prisma.vendor.findMany({
    select: {
      id: true,
      name: true,
      phone: true,
      customId: true
    }
  });
  console.log('--- VENDORS IN DB ---');
  console.log(JSON.stringify(vendors, null, 2));
  console.log('--------------------');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
