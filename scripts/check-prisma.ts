import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    try {
        const rides = await (prisma as any).ride.findMany({ take: 1, select: { isLocked: true } });
        console.log("Success: isLocked exists", rides);
    } catch (err: any) {
        console.error("Error: isLocked does not exist", err.message);
    } finally {
        await prisma.$disconnect();
    }
}
main();
