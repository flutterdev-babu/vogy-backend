import { prisma } from "./src/config/prisma";

async function main() {
    console.log("Connecting to database...");
    const partners = await prisma.partner.findMany({
        select: {
            id: true,
            name: true,
            phone: true,
            status: true,
        },
        take: 10,
    });
    console.log("Found partners:", JSON.stringify(partners, null, 2));
}

main().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
