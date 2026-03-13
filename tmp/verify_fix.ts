import { prisma } from "../src/config/prisma";
import { getAvailableRides } from "../src/services/ride/ride.service";
import { createManualRideByAdmin } from "../src/services/admin/admin.service";
import { calculateDistance } from "../src/services/ride/ride.service"; // Might need it for the helper, though service should have it.

async function verify() {
  console.log("Starting verification...");

  try {
    // 1. Test City-Wide Visibility
    // Create a dummy city if not exists
    let city = await prisma.cityCode.findFirst({ where: { code: "TEST" } });
    if (!city) {
      city = await prisma.cityCode.create({
        data: {
          code: "TEST",
          cityName: "Test City",
        },
      });
    }

    // Create a vehicle type
    let vt = await prisma.vehicleType.findFirst({ where: { name: "TEST_VT" } });
    if (!vt) {
      vt = await prisma.vehicleType.create({
        data: {
          category: "CAR",
          name: "TEST_VT",
          displayName: "Test Vehicle",
          pricePerKm: 10,
          baseFare: 50,
        },
      });
    }

    // Create a ride in TEST city, far from partner
    // Partner at (0, 0), Ride at (0.2, 0.2) -> approx 31km away
    const ride = await prisma.ride.create({
      data: {
        pickupLat: 0.2,
        pickupLng: 0.2,
        pickupAddress: "Far Away",
        dropLat: 0.3,
        dropLng: 0.3,
        dropAddress: "Further Away",
        distanceKm: 15,
        status: "UPCOMING",
        cityCodeId: city.id,
        vehicleTypeId: vt.id,
      },
    });

    console.log(`Created test ride ${ride.id} in city ${city.id} at (0.2, 0.2)`);

    // Fetch available rides for partner at (0, 0) in same city
    const availableRides = await getAvailableRides(0, 0, vt.id, city.id);
    const found = availableRides.find((r: any) => r.id === ride.id);

    if (found) {
      console.log("✅ SUCCESS: Ride in same city is visible even if >10km away.");
    } else {
      console.log("❌ FAILURE: Ride in same city is NOT visible.");
    }

    // 2. Test Admin Assignment Status
    // Create a partner in same city
    const partner = await prisma.partner.create({
      data: {
        name: "Test Partner",
        phone: "9999999999",
        password: "password",
        cityCodeId: city.id,
        isOnline: true,
        currentLat: 0,
        currentLng: 0,
        status: "ACTIVE",
        verificationStatus: "VERIFIED",
        vehicleId: null, // assigned later or not needed for this test
      },
    });

    const adminRide = await createManualRideByAdmin("dummyAdminId", {
      userPhone: "8888888888",
      userName: "Test User",
      vehicleTypeId: vt.id,
      pickupLat: 0,
      pickupLng: 0,
      pickupAddress: "Here",
      dropLat: 0.05,
      dropLng: 0.05,
      dropAddress: "There",
      distanceKm: 5,
      cityCodeId: city.id,
      isInstant: false, // For auto-assignment logic
    });

    if (adminRide.status === "ASSIGNED") {
      console.log("✅ SUCCESS: Admin-assigned ride has status 'ASSIGNED'.");
    } else {
      console.log(`❌ FAILURE: Admin-assigned ride has status '${adminRide.status}', expected 'ASSIGNED'.`);
    }

    // Cleanup
    await prisma.ride.deleteMany({ where: { id: { in: [ride.id, adminRide.id] } } });
    await prisma.partner.delete({ where: { id: partner.id } });
    // Keep city and vt for now or clean up if desired

  } catch (error) {
    console.error("Verification failed with error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
