
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const cities = [
        { code: "NLR", cityName: "Nellore" },
        { code: "BLR", cityName: "Bengaluru" },
        { code: "BNG", cityName: "Bangalore" },
        { code: "HYD", cityName: "Hyderabad" },
        { code: "MAS", cityName: "Chennai" },
        { code: "BOM", cityName: "Mumbai" },
        { code: "DEL", cityName: "Delhi" },
        { code: "VGA", cityName: "Vijayawada" },
        { code: "VTZ", cityName: "Visakhapatnam" }
    ];

    for (const city of cities) {
        try {
            const existing = await prisma.cityCode.findUnique({
                where: { code: city.code }
            });
            if (!existing) {
                await prisma.cityCode.create({
                    data: { ...city, isActive: true }
                });
                console.log(`Created city: ${city.cityName}`);
            } else {
                await prisma.cityCode.update({
                    where: { code: city.code },
                    data: { isActive: true }
                });
                console.log(`Updated city ${city.cityName} to active`);
            }
        } catch (e) {
            console.error(`Error processing ${city.cityName}:`, e);
        }
    }
    await prisma.$disconnect();
}

main();
