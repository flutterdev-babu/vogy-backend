import { Router } from "express";
import { prisma } from "../../config/prisma";
import rideController from "../../controllers/ride/ride.controller";

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

      // Get all online partners with their vehicle types
      const onlinePartners = await prisma.partner.findMany({
        where: {
          isOnline: true,
          currentLat: { not: null },
          currentLng: { not: null },
          OR: [
            { ownVehicleTypeId: { not: null } },
            { vehicle: { isNot: null } }
          ]
        },
        select: {
          id: true,
          ownVehicleTypeId: true,
          currentLat: true,
          currentLng: true,
          vehicle: {
            select: {
              vehicleTypeId: true
            }
          }
        },
      });

      // Filter partners within radius and count by vehicle type
      const nearbyVehicleTypeIds = new Set<string>();
      for (const partner of onlinePartners) {
        if (partner.currentLat && partner.currentLng) {
          const effectiveVehicleTypeId = partner.ownVehicleTypeId || partner.vehicle?.vehicleTypeId;
          if (!effectiveVehicleTypeId) continue;

          const dist = calculateDistance(userLat, userLng, partner.currentLat, partner.currentLng);
          if (dist <= radius) {
            nearbyVehicleTypeIds.add(effectiveVehicleTypeId);
            nearbyRidersCount[effectiveVehicleTypeId] = (nearbyRidersCount[effectiveVehicleTypeId] || 0) + 1;
          }
        }
      }

      // Filter vehicle types to only those with nearby riders
      if (nearbyVehicleTypeIds.size > 0) {
        vehicleTypes = vehicleTypes.filter(vt => nearbyVehicleTypeIds.has(vt.id));
      }
      // If no nearby riders found, still return all vehicle types but mark as unavailable
    }

    // NEW: Use rideService.estimateFare to centralize logic
    const { estimateFare } = require("../../services/ride/ride.service");
    const cityCodeId = req.query.cityCodeId;
    const fareData = await estimateFare({
      distanceKm: distance,
      cityCodeId: cityCodeId as string,
      // If we want to support coupon here too in future, we can
    });

    // Merge nearby drivers info if needed, or just return fareData
    // The original code filtered vehicleTypes by nearby drivers. 
    // We should probably keep that filtering logic but use the fare calculation from service.

    const enhancedFareEstimates = (fareData.vehicleOptions as any[]).map((vo: any) => {
      const nearbyDrivers = nearbyRidersCount[vo.vehicleTypeId] || 0;
      return {
        ...vo,
        vehicleTypeName: vo.name, // compatibility with old response
        nearbyDrivers,
        isAvailable: hasLocationFilter ? nearbyDrivers > 0 : true,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Fare estimates retrieved successfully",
      data: {
        distanceKm: distance,
        locationFiltered: hasLocationFilter,
        pricingConfig: fareData.couponApplied ? {
           // if coupon applied, maybe return coupon info? 
           // but original response had global pricing config
        } : {}, 
        fareEstimates: enhancedFareEstimates,
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
        payLaterSurchargePercent: 2,
        onlinePayDiscountPercent: 2,
        assignmentBufferMinutes: 120,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    if (!pricingConfig) {
      throw new Error("Failed to load pricing configuration.");
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

// Create a public ride booking (landing page)
router.post("/book", rideController.publicBook);

export default router;

