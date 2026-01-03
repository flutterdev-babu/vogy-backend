import { Router } from "express";
import { prisma } from "../../config/prisma";

const router = Router();

/* ===============================
        PUBLIC RIDE ROUTES
================================ */

// Get all active vehicle types (public - no auth required)
router.get("/vehicle-types", async (req, res) => {
  try {
    const vehicleTypes = await prisma.vehicleType.findMany({
      where: { isActive: true },
      select: {
        id: true,
        category: true,
        name: true,
        displayName: true,
        pricePerKm: true,
        baseFare: true,
        isActive: true,
      },
      orderBy: [{ category: "asc" }, { pricePerKm: "asc" }],
    });

    return res.status(200).json({
      success: true,
      message: "Vehicle types retrieved successfully",
      data: vehicleTypes,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to get vehicle types",
    });
  }
});

// Get fare estimates for all vehicle types based on distance
// Optionally filter by nearby available captains
router.get("/fare-estimate", async (req, res) => {
  try {
    const { distanceKm, pickupLat, pickupLng, radiusKm } = req.query;

    if (!distanceKm || isNaN(parseFloat(distanceKm as string))) {
      return res.status(400).json({
        success: false,
        message: "distanceKm is required and must be a number",
      });
    }

    const distance = parseFloat(distanceKm as string);
    const hasLocationFilter = pickupLat && pickupLng;
    const radius = radiusKm ? parseFloat(radiusKm as string) : 10; // Default 10km radius

    // Get active pricing config
    const pricingConfig = await prisma.pricingConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (!pricingConfig) {
      return res.status(400).json({
        success: false,
        message: "Pricing configuration not found",
      });
    }

    // Get all active vehicle types
    let vehicleTypes = await prisma.vehicleType.findMany({
      where: { isActive: true },
      orderBy: { pricePerKm: "asc" },
    });

    // If location provided, filter vehicle types by nearby online riders
    let nearbyRidersCount: Record<string, number> = {};
    if (hasLocationFilter) {
      const userLat = parseFloat(pickupLat as string);
      const userLng = parseFloat(pickupLng as string);

      // Get all online riders with their vehicle types
      const onlineRiders = await prisma.rider.findMany({
        where: {
          isOnline: true,
          currentLat: { not: null },
          currentLng: { not: null },
          vehicleTypeId: { not: null },
        },
        select: {
          id: true,
          vehicleTypeId: true,
          currentLat: true,
          currentLng: true,
        },
      });

      // Filter riders within radius and count by vehicle type
      const nearbyVehicleTypeIds = new Set<string>();
      for (const rider of onlineRiders) {
        if (rider.currentLat && rider.currentLng && rider.vehicleTypeId) {
          const dist = calculateDistance(userLat, userLng, rider.currentLat, rider.currentLng);
          if (dist <= radius) {
            nearbyVehicleTypeIds.add(rider.vehicleTypeId);
            nearbyRidersCount[rider.vehicleTypeId] = (nearbyRidersCount[rider.vehicleTypeId] || 0) + 1;
          }
        }
      }

      // Filter vehicle types to only those with nearby riders
      if (nearbyVehicleTypeIds.size > 0) {
        vehicleTypes = vehicleTypes.filter(vt => nearbyVehicleTypeIds.has(vt.id));
      }
      // If no nearby riders found, still return all vehicle types but mark as unavailable
    }

    // Calculate fare for each vehicle type
    const fareEstimates = vehicleTypes.map((vehicleType) => {
      // Use per-type baseFare if set, otherwise use global config
      const baseFare = vehicleType.baseFare ?? pricingConfig.baseFare ?? 20;
      const totalFare = baseFare + (vehicleType.pricePerKm * distance);
      const riderEarnings = (totalFare * pricingConfig.riderPercentage) / 100;
      const appCommission = (totalFare * pricingConfig.appCommission) / 100;

      return {
        vehicleTypeId: vehicleType.id,
        category: vehicleType.category,
        vehicleTypeName: vehicleType.name,
        displayName: vehicleType.displayName,
        pricePerKm: vehicleType.pricePerKm,
        baseFare: baseFare,
        distanceKm: distance,
        totalFare: Math.round(totalFare * 100) / 100,
        riderEarnings: Math.round(riderEarnings * 100) / 100,
        appCommission: Math.round(appCommission * 100) / 100,
        nearbyDrivers: nearbyRidersCount[vehicleType.id] || 0,
        isAvailable: hasLocationFilter ? (nearbyRidersCount[vehicleType.id] || 0) > 0 : true,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Fare estimates retrieved successfully",
      data: {
        distanceKm: distance,
        locationFiltered: hasLocationFilter,
        pricingConfig: {
          baseFare: pricingConfig.baseFare,
          riderPercentage: pricingConfig.riderPercentage,
          appCommission: pricingConfig.appCommission,
        },
        fareEstimates: fareEstimates,
      },
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to get fare estimates",
    });
  }
});

// Helper function to calculate distance between two points (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Get pricing config (public - for displaying pricing info)
router.get("/pricing", async (req, res) => {
  try {
    let pricingConfig = await prisma.pricingConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (!pricingConfig) {
      // Return defaults if no config exists
      pricingConfig = {
        id: "",
        baseFare: 20,
        riderPercentage: 80,
        appCommission: 20,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return res.status(200).json({
      success: true,
      message: "Pricing config retrieved successfully",
      data: {
        baseFare: pricingConfig.baseFare,
        riderPercentage: pricingConfig.riderPercentage,
        appCommission: pricingConfig.appCommission,
      },
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to get pricing config",
    });
  }
});

export default router;

