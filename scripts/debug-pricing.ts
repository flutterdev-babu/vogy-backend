
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const vt = await prisma.vehicleType.findMany();
    console.log('--- VEHICLE TYPES ---');
    vt.forEach(v => console.log(`${v.displayName || v.name}: Base=${v.baseFare}, PerKm=${v.pricePerKm}, Active=${v.isActive}`));

    const pc = await prisma.pricingConfig.findMany({ where: { isActive: true } });
    console.log('--- ACTIVE PRICING CONFIGS ---');
    console.log(JSON.stringify(pc, null, 2));

    if (pc.length === 0) {
        console.log('No active pricing config found! Creating one...');
        await prisma.pricingConfig.create({
            data: {
                name: 'Default Config',
                baseFare: 20,
                perKmFare: 15,
                isActive: true
            }
        });
    }

    await prisma.$disconnect();
}

main();
