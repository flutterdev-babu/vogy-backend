
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const cities = [
        { code: "NLR", cityName: "Nellore" },
        { code: "BLR", cityName: "Bengaluru" },
        { code: "HYD", cityName: "Hyderabad" }
    ];

    for (const city of cities) {
        try {
            const existing = await prisma.cityCode.findFirst({
                where: { code: city.code }
            });
            if (!existing) {
                await prisma.cityCode.create({
                    data: { ...city, isActive: true }
                });
                console.log(`Created city: ${city.cityName}`);
            } else {
                console.log(`City already exists: ${city.cityName}`);
            }
        } catch (e) {
            console.error(`Error adding ${city.cityName}:`, e);
        }
    }
    await prisma.$disconnect();
}

main();
