
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const cities = await prisma.cityCode.findMany();
    console.log(JSON.stringify(cities, null, 2));
    await prisma.$disconnect();
}

main();
