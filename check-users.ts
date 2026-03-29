import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            password: true,
            uniqueOtp: true
        }
    });

    console.log('Total Users:', users.length);
    users.forEach(user => {
        console.log(`User: ${user.name} (${user.phone}) - Email: ${user.email} - Password Set: ${!!user.password} - OTP: ${user.uniqueOtp}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
