const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const candidates = await prisma.ride.findMany({
    where: {
      status: { in: ['UPCOMING', 'SCHEDULED'] },
      partnerId: null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
      vehicleType: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  
  if (candidates.length === 0) {
    console.log("No UPCOMING or SCHEDULED unassigned rides found.");
    return;
  }
  
  let bufferMinutes = 120;
  
  function getEffectivePickupTime(ride) {
    if (ride.scheduledDateTime) return new Date(ride.scheduledDateTime);
    if (ride.requestedPickupTime) return new Date(ride.requestedPickupTime);
    return new Date(ride.createdAt);
  }
  
  function getExpiryTime(ride, bufferMinutes) {
    const pickupTime = getEffectivePickupTime(ride);
    return new Date(pickupTime.getTime() + bufferMinutes * 60 * 1000);
  }
  
  function isRideExpired(ride, bufferMinutes) {
    const expiresAt = getExpiryTime(ride, bufferMinutes);
    return new Date() > expiresAt;
  }
  
  const now = new Date();
  
  const liveRides = candidates
    .filter(ride => !isRideExpired(ride, bufferMinutes))
    .map(ride => {
      const effectivePickupTime = getEffectivePickupTime(ride);
      const expiresAt = getExpiryTime(ride, bufferMinutes);
      const timeRemainingMs = expiresAt.getTime() - now.getTime();
      const timeRemainingMinutes = Math.max(0, Math.round(timeRemainingMs / (60 * 1000)));

      return {
        id: ride.id,
        customId: ride.customId,
        status: ride.status,
        effectivePickupTime: effectivePickupTime.toISOString(),
        expiresAt: expiresAt.toISOString(),
        timeRemainingMinutes,
      };
    })
    .sort((a, b) => a.timeRemainingMinutes - b.timeRemainingMinutes);

  console.log("Candidates count:", candidates.length);
  console.log("Live Rides filtered count:", liveRides.length);
  console.log("Live Rides output:", JSON.stringify(liveRides, null, 2));
}

main().finally(() => prisma.$disconnect());
