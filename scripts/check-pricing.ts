
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const vt = await prisma.vehicleType.findMany();
    console.log('--- VEHICLE TYPES ---');
    console.log(JSON.stringify(vt, null, 2));

    const pg = await prisma.vehiclePricingGroup.findMany();
    console.log('--- PRICING GROUPS ---');
    console.log(JSON.stringify(pg, null, 2));

    await prisma.$disconnect();
}

main();
