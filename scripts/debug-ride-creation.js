const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const data = {
    userId: "some-real-user-id", // Will replace
    userName: "Debug User",
    userPhone: "+919999888877",
    vehicleTypeId: "69970158d1e9c000a1297437",
    cityCodeId: "6996ffbbd1e9c000a1297434",
    pickupAddress: "Debug Pickup",
    dropAddress: "Debug Drop",
    pickupLat: 12.9716,
    pickupLng: 77.5946,
    dropLat: 12.9352,
    dropLng: 77.6245,
    distanceKm: 10.5,
    scheduledDateTime: new Date("2026-12-31T10:00:00.000Z"),
    paymentMode: "CASH",
    rideType: "LOCAL"
  };

  try {
    console.log("1. Finding admin user for userId fallback...");
    const admin = await prisma.admin.findFirst();
    const userId = admin.id;
    console.log(`   UserId set to: ${userId}`);

    console.log("2. Resolving city code...");
    const cityCodeEntry = await prisma.cityCode.findUnique({ where: { id: data.cityCodeId } });
    console.log(`   City Code found: ${cityCodeEntry ? cityCodeEntry.code : 'NOT FOUND'}`);

    console.log("3. Counting rides for customId...");
    const count = await prisma.ride.count({
      where: { cityCode: { code: cityCodeEntry.code } },
    });
    console.log(`   Ride count: ${count}`);

    console.log("4. Fetching vehicle type...");
    const vehicleType = await prisma.vehicleType.findUnique({ where: { id: data.vehicleTypeId } });
    console.log(`   Vehicle Type found: ${vehicleType ? vehicleType.name : 'NOT FOUND'}`);

    console.log("5. Fetching pricing config...");
    const pricingConfig = await prisma.pricingConfig.findFirst({ where: { isActive: true } });
    console.log(`   Pricing Config found: ${pricingConfig ? pricingConfig.id : 'NOT FOUND'}`);

    console.log("6. Creating ride record...");
    // Just a dry run of the create call with minimal fields if possible, or full fields
    const ride = await prisma.ride.create({
      data: {
        userId: userId,
        vehicleTypeId: data.vehicleTypeId,
        pickupLat: data.pickupLat,
        pickupLng: data.pickupLng,
        pickupAddress: data.pickupAddress,
        dropLat: data.dropLat,
        dropLng: data.dropLng,
        dropAddress: data.dropAddress,
        distanceKm: data.distanceKm,
        baseFare: 100,
        perKmPrice: 15,
        totalFare: 250,
        status: "SCHEDULED",
        isManualBooking: true,
        scheduledDateTime: data.scheduledDateTime,
        cityCodeId: data.cityCodeId,
        customId: `DEBUG-R-${Date.now()}`,
      }
    });
    console.log(`   Ride created: ${ride.id}`);

  } catch (err) {
    console.error("❌ ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
