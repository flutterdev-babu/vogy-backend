import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const targetNames = ['CAR', 'Test', 'TEST_SEDAN'];
  const types = await prisma.vehicleType.findMany({
    where: {
      name: { in: targetNames }
    }
  });

  console.log('--- Vehicle Types Investigation ---');
  if (types.length === 0) {
    console.log('No vehicle types found with names:', targetNames);
  }

  for (const type of types) {
    // 1. Check for dependent Vehicles
    const vehicleCount = await prisma.vehicle.count({
      where: { vehicleTypeId: type.id }
    });
    
    // 2. Check for dependent Pricing Groups
    const pricingGroupCount = await prisma.vehiclePricingGroup.count({
      where: { vehicleTypeId: type.id }
    });

    // 3. Check for dependent Peak Hour Charges
    const peakHourCount = await prisma.peakHourCharge.count({
      where: { vehicleTypeId: type.id }
    });

    // 4. Check for dependent Rides
    const rideCount = await prisma.ride.count({
      where: { vehicleTypeId: type.id }
    });

    console.log(`\nSegment: ${type.displayName} (Internal Name: ${type.name})`);
    console.log(`ID: ${type.id}`);
    console.log(`Dependencies:`);
    console.log(`  - Vehicles: ${vehicleCount}`);
    console.log(`  - Pricing Groups: ${pricingGroupCount}`);
    console.log(`  - Peak Hour Charges: ${peakHourCount}`);
    console.log(`  - Rides: ${rideCount}`);
    
    if (vehicleCount > 0) {
      const vehicles = await prisma.vehicle.findMany({
        where: { vehicleTypeId: type.id },
        select: { registrationNumber: true, vehicleModel: true }
      });
      console.log('  Active Vehicles:', vehicles);
    }
  }

  const allTypes = await prisma.vehicleType.findMany({ select: { id: true, name: true, displayName: true } });
  console.log('\n--- All Active Vehicle Types (for reference) ---');
  console.log(allTypes);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
