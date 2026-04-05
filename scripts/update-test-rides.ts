import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Rescheduling Stale Test Rides ---');

    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0); // 10:00 AM tomorrow

    // We find rides that are in "active/upcoming" statuses but scheduled in the past
    const staleRides = await prisma.ride.findMany({
        where: {
            status: {
                in: ['ASSIGNED', 'ACCEPTED', 'REQUESTED', 'UPCOMING', 'SCHEDULED']
            },
            OR: [
                { scheduledDateTime: { lt: now } },
                {
                    scheduledDateTime: null,
                    createdAt: { lt: now }
                }
            ]
        }
    });

    console.log(`Found ${staleRides.length} stale rides to reschedule.`);

    for (const ride of staleRides) {
        // Spread them out a bit in the future for testing
        const newDate = new Date(tomorrow);
        // Add some random minutes so they aren't all at the same time
        newDate.setMinutes(Math.floor(Math.random() * 60));

        await prisma.ride.update({
            where: { id: ride.id },
            data: {
                scheduledDateTime: newDate,
                updatedAt: new Date()
            }
        });
        console.log(`Updated ride ${ride.customId || ride.id} to ${newDate.toISOString()}`);
    }

    console.log('--- Done ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
