
import { PrismaClient } from '@prisma/client';
import { estimateFare } from '../src/services/ride/ride.service';
const prisma = new PrismaClient();

async function main() {
    const city = await prisma.cityCode.findFirst({ where: { isActive: true } });
    if (!city) {
        console.error('No active city found');
        return;
    }

    console.log(`Testing with city: ${city.cityName} (${city.id})`);

    try {
        const estimates = await estimateFare({
            distanceKm: 44.6,
            cityCodeId: city.id,
            rideType: "LOCAL"
        });
        console.log('--- ESTIMATES ---');
        console.log(JSON.stringify(estimates, null, 2));
    } catch (e) {
        console.error('Estimate failed:', e);
    }

    await prisma.$disconnect();
}

main();
