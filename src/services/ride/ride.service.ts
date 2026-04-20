import { prisma } from "../../config/prisma";
import {
  emitRideCreated,
  emitManualRideCreated,
  emitRideAccepted,
  emitRideArrived,
  emitRideStarted,
  emitRideCompleted,
  emitRideCancelled,
} from "../socket/socket.service";
import { emitRideRequestToDrivers } from "../socket/socket.service";
import { generateEntityCustomId, getPricingForCity } from "../city/city.service";
import { getPeakHourAdjustment } from "../admin/peakHour.service";
import { logPaymentAudit } from "./payment.service";
import { PaymentStatus, AuditAction } from "@prisma/client";
import { computeHaversineDistance } from "../../utils/haversine";
import { EventEmitter } from "events";

export const rideEventEmitter = new EventEmitter();
const driverCooldowns = new Map<string, number>();

/* ============================================
    COUPON VALIDATION LOGIC
============================================ */
export const validateCouponLogic = async (
  couponCode: string,
  cityCodeId: string,
  totalFare: number
) => {
  const coupon = await prisma.agentCoupon.findUnique({
    where: { couponCode },
    include: {
      agent: {
        include: {
          cityCodes: true,
        },
      },
    },
  });

  if (!coupon) {
    throw new Error("Invalid coupon code");
  }

  if (!coupon.isActive) {
    throw new Error("Coupon is not active");
  }

  const currentDate = new Date();
  if (currentDate < coupon.validFrom || currentDate > coupon.validTo) {
    throw new Error("Coupon has expired or is not yet valid");
  }

  if (totalFare < coupon.minBookingAmount) {
    throw new Error(`Minimum booking amount for this coupon is ${coupon.minBookingAmount}`);
  }

  // Check if city matches (Primary or Legacy)
  const isPrimaryCity = coupon.agent.cityCodeId === cityCodeId;
  const isLegacyCity = coupon.agent.cityCodes.some((c) => c.id === cityCodeId);

  if (!isPrimaryCity && !isLegacyCity) {
    throw new Error("Coupon is not valid for this city");
  }

  // Calculate rounded discount
  let discountAmount = Math.round((totalFare * coupon.discountValue) / 100);
  if (coupon.maxDiscountAmount > 0 && discountAmount > coupon.maxDiscountAmount) {
    discountAmount = coupon.maxDiscountAmount;
  }

  return {
    couponId: coupon.id,
    discountAmount,
    couponCode: coupon.couponCode,
  };
};

/* ============================================
    FARE ESTIMATION (No ride created)
    Returns ALL active vehicle types with prices
============================================ */
export const estimateFare = async (data: {
  distanceKm: number;
  cityCodeId: string;
  couponCode?: string;
  rideType?: "AIRPORT" | "LOCAL" | "OUTSTATION" | "RENTAL";
}) => {
  // Validate city code
  const cityCodeEntry = await prisma.cityCode.findUnique({
    where: { id: data.cityCodeId },
  });
  if (!cityCodeEntry) {
    throw new Error("Invalid city code ID");
  }

  // Get ALL active vehicle types
  const vehicleTypes = await prisma.vehicleType.findMany({
    where: { isActive: true },
    orderBy: { pricePerKm: "asc" },
  });

  if (vehicleTypes.length === 0) {
    throw new Error("No active vehicle types found");
  }

  // Get active pricing config
  const pricingConfig = await prisma.pricingConfig.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });
  if (!pricingConfig) {
    throw new Error("Pricing configuration not found");
  }

  const globalBaseFare = pricingConfig.baseFare || 20;

  // Validate coupon if provided (once, reuse for all vehicles)
  let couponInfo: { discountValue: number; maxDiscountAmount: number; couponCode: string } | null = null;
  if (data.couponCode) {
    const coupon = await prisma.agentCoupon.findUnique({
      where: { couponCode: data.couponCode },
      include: { agent: { include: { cityCodes: true } } },
    });

    if (coupon && coupon.isActive) {
      const now = new Date();
      const isDateValid = now >= coupon.validFrom && now <= coupon.validTo;

      const isPrimaryCity = coupon.agent.cityCodeId === data.cityCodeId;
      const isLegacyCity = coupon.agent.cityCodes.some((c) => c.id === data.cityCodeId);

      if (isDateValid && (isPrimaryCity || isLegacyCity)) {
        couponInfo = {
          discountValue: coupon.discountValue,
          maxDiscountAmount: coupon.maxDiscountAmount,
          couponCode: coupon.couponCode,
        };
      }
    }
  }

  // Build fare for each vehicle type
  const vehicleOptions = await Promise.all(vehicleTypes.map(async (vt) => {
    // NEW: Get city-specific pricing group or fallback to vehicle type defaults
    const cityPricing = await getPricingForCity(vt.id, data.cityCodeId, data.rideType || "LOCAL");

    const baseFare = cityPricing.baseFare;
    const perKmPrice = cityPricing.perKmPrice;

    // Calculation: baseFare + (perKmPrice * (distanceKm - baseKm))
    const billableKm = Math.max(0, data.distanceKm - (cityPricing.baseKm || 0));
    let estimatedFare = Math.round(baseFare + perKmPrice * billableKm);

    // NEW: Apply Peak Hour Adjustment
    const peakAdjustment = await getPeakHourAdjustment(data.cityCodeId, vt.id, new Date());
    if (peakAdjustment.fixedExtra > 0 || peakAdjustment.percentageExtra > 0) {
      const percentageAmount = (estimatedFare * peakAdjustment.percentageExtra) / 100;
      estimatedFare = Math.round(estimatedFare + peakAdjustment.fixedExtra + percentageAmount);
    }

    let discountAmount = 0;
    let finalFare = estimatedFare;

    if (couponInfo && estimatedFare >= 0) {
      discountAmount = Math.round((estimatedFare * couponInfo.discountValue) / 100);
      if (couponInfo.maxDiscountAmount > 0 && discountAmount > couponInfo.maxDiscountAmount) {
        discountAmount = couponInfo.maxDiscountAmount;
      }
      finalFare = Math.round(estimatedFare - discountAmount);
    }

    return {
      vehicleTypeId: vt.id,
      category: vt.category,
      name: vt.name,
      displayName: vt.displayName,
      baseFare,
      pricePerKm: perKmPrice,
      baseKm: cityPricing.baseKm,
      estimatedFare,
      totalFare: couponInfo ? finalFare : estimatedFare,
      ...(couponInfo && {
        discountAmount,
        finalFare,
      }),
    };
  }));

  return {
    distanceKm: data.distanceKm,
    fareEstimates: vehicleOptions,
    vehicleOptions, // For public API compatibility
    ...(couponInfo && {
      couponApplied: {
        couponCode: couponInfo.couponCode,
        discountPercentage: couponInfo.discountValue,
        maxDiscountAmount: couponInfo.maxDiscountAmount,
      },
    }),
  };
};

export const findNearbyDrivers = async ({
  pickupLat,
  pickupLng,
  cityCodeId,
  vehicleTypeId,
  radius,
}: {
  pickupLat: number;
  pickupLng: number;
  cityCodeId: string;
  vehicleTypeId: string;
  radius: number;
}) => {
  const drivers = await prisma.partner.findMany({
    where: {
      cityCodeId,
      isOnline: true,
      status: "ACTIVE", // Using standard active status check for VOGY partner model
      OR: [
        { vehicle: { vehicleTypeId } },
        { ownVehicleTypeId: vehicleTypeId }
      ],
      currentLat: { not: null },
      currentLng: { not: null },
    },
    take: 200,
    select: { id: true, currentLat: true, currentLng: true },
  });

  const now = Date.now();
  
  const nearbyDrivers = drivers
    .map(driver => ({
      ...driver,
      distance: computeHaversineDistance(
        pickupLat,
        pickupLng,
        driver.currentLat!,
        driver.currentLng!
      )
    }))
    .filter(driver => {
      // Check cooldown (15s)
      const lastPing = driverCooldowns.get(driver.id) || 0;
      if (now - lastPing < 15000) return false;
      return driver.distance <= radius;
    })
    .sort((a, b) => a.distance - b.distance);

  return nearbyDrivers;
};

const waitForDriverAcceptance = (rideId: string, timeoutMs: number): Promise<string | null> => {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      rideEventEmitter.removeAllListeners(`ride_accepted_${rideId}`);
      resolve(null);
    }, timeoutMs);

    rideEventEmitter.once(`ride_accepted_${rideId}`, (driverId: string) => {
      clearTimeout(timeout);
      resolve(driverId);
    });
  });
};

export const runDispatchEngine = async (ride: any) => {
  const radii = [2000, 4000, 6000];
  let driverAssigned = false;

  for (const radius of radii) {
    if (driverAssigned) break;

    const nearbyDrivers = await findNearbyDrivers({
      pickupLat: ride.pickupLat,
      pickupLng: ride.pickupLng,
      cityCodeId: ride.cityCodeId,
      vehicleTypeId: ride.vehicleTypeId,
      radius,
    });

    if (nearbyDrivers.length === 0) continue;

    const topDrivers = nearbyDrivers.slice(0, 3);
    const driverIds = topDrivers.map(d => d.id);

    // Apply cooldown
    const now = Date.now();
    driverIds.forEach(id => driverCooldowns.set(id, now));

    await emitRideRequestToDrivers(driverIds, ride);

    const acceptedDriverId = await waitForDriverAcceptance(ride.id, 15000);

    if (acceptedDriverId) {
      driverAssigned = true;
      break;
    }
  }

  if (!driverAssigned) {
    await prisma.ride.update({
      where: { id: ride.id },
      data: { status: "CANCELLED", bookingNotes: "No drivers available" },
    });
    // Emit generic cancel message so user knows
    emitRideCancelled(ride, "PARTNER");
  }
};

/* ============================================
    CREATE RIDE (USER) - Instant Booking
============================================ */
export const createRide = async (
  userId: string,
  data: {
    vehicleTypeId: string;
    pickupLat: number;
    pickupLng: number;
    pickupAddress: string;
    dropLat: number;
    dropLng: number;
    dropAddress: string;
    distanceKm: number;
    cityCodeId: string; // NEW: Required for customId generation
    rideType?: "AIRPORT" | "LOCAL" | "OUTSTATION" | "RENTAL";
    altMobile?: string;
    paymentMode?: "CASH" | "CREDIT" | "UPI" | "CARD" | "ONLINE";
    agentCode?: string;
    couponCode?: string;
    expectedFare?: number;
    corporateId?: string;
    corporateEmployeeId?: string;
    advanceAmount?: number;
    transactionId?: string;
    idempotencyKey?: string;
    paymentVerificationId?: string;
    scheduledDateTime?: string | Date;
  }
) => {
  // 1. Idempotency Check
  if (data.idempotencyKey) {
    const existingRide = await prisma.ride.findFirst({
      where: { idempotencyKey: data.idempotencyKey },
      include: {
        vehicleType: true,
        user: { select: { id: true, name: true, phone: true } },
      },
    });
    if (existingRide) return existingRide;
  }

  // 2. Fetch City Code
  const cityCodeEntry = await prisma.cityCode.findUnique({
    where: { id: data.cityCodeId },
  });

  if (!cityCodeEntry) {
    throw new Error("Invalid city code ID");
  }

  const customId = await generateEntityCustomId(cityCodeEntry.code, "RIDE");

  // Verify vehicle type exists and is active
  const vehicleType = await prisma.vehicleType.findUnique({
    where: { id: data.vehicleTypeId },
  });

  if (!vehicleType) {
    throw new Error("Vehicle type not found");
  }

  if (!vehicleType.isActive) {
    throw new Error("Vehicle type is not available");
  }

  // Get active pricing config
  const pricingConfig = await prisma.pricingConfig.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  if (!pricingConfig) {
    throw new Error("Pricing configuration not found");
  }

  // NEW: Get city-specific pricing group or fallback to vehicle type defaults
  const cityPricing = await getPricingForCity(data.vehicleTypeId, data.cityCodeId, data.rideType || "LOCAL");

  const baseFare = cityPricing.baseFare;
  const perKmPrice = cityPricing.perKmPrice;
  const billableKm = Math.max(0, data.distanceKm - (cityPricing.baseKm || 0));
  let totalFare = baseFare + (perKmPrice * billableKm);

  // NEW: Apply Peak Hour Adjustment
  const calculationDate = data.scheduledDateTime ? new Date(data.scheduledDateTime) : new Date();
  const peakAdjustment = await getPeakHourAdjustment(data.cityCodeId, data.vehicleTypeId, calculationDate);
  if (peakAdjustment.fixedExtra > 0 || peakAdjustment.percentageExtra > 0) {
    const percentageAmount = (totalFare * peakAdjustment.percentageExtra) / 100;
    totalFare = Math.round(totalFare + peakAdjustment.fixedExtra + percentageAmount);
  }

  // NEW: Validate and apply Coupon Code
  let appliedCouponCode = null;
  let appliedDiscountAmount = 0;

  if (data.couponCode) {
    const couponData = await validateCouponLogic(data.couponCode, data.cityCodeId, totalFare);
    appliedCouponCode = couponData.couponCode;
    appliedDiscountAmount = couponData.discountAmount;
    totalFare = totalFare - appliedDiscountAmount;
  }

  // EXPECTED FARE VALIDATION (Strict Mode)
  // If the frontend explicitly passed an `expectedFare` (what the user agreed to pay), 
  // the backend calculation must exactly match it to prevent hidden price jumps.
  if (data.expectedFare !== undefined) {
    // allow a 1 rupee buffer for floating point JS rounding
    if (Math.abs(totalFare - data.expectedFare) > 1) {
      throw new Error(`Price mismatch. The frontend expected ₹${data.expectedFare}, but the server calculated ₹${totalFare}. Please refresh and try again.`);
    }
  }

  const riderEarnings = Math.round((totalFare * pricingConfig.riderPercentage) / 100);
  const commission = Math.round((totalFare * pricingConfig.appCommission) / 100);

  // NEW: Handle agentCode if provided
  let agentId = null;
  let agentCode = null;
  if ((data as any).agentCode) {
    const agent = await prisma.agent.findUnique({
      where: { agentCode: (data as any).agentCode },
    });
    if (agent) {
      agentId = agent.id;
      agentCode = agent.agentCode;
    }
  }

  // 3. Payment Verification Check (Step 4 of Atomic Flow)
  let verification = null;
  if (data.paymentVerificationId) {
    verification = await prisma.paymentVerification.findUnique({
      where: { id: data.paymentVerificationId },
    });

    if (!verification) {
      throw new Error("Payment verification record not found.");
    }

    if (verification.status === "LINKED") {
      throw new Error("This payment has already been used for another booking.");
    }

    if (verification.status !== "VERIFIED") {
      throw new Error("Payment has not been verified yet.");
    }
  }

  // 4. Create Ride with Atomic Status Update
  return await prisma.$transaction(async (tx) => {
    const ride = await tx.ride.create({
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
        baseFare: baseFare,
        perKmPrice: perKmPrice,
        totalFare: totalFare,
        couponCode: appliedCouponCode,
        discountAmount: appliedDiscountAmount,
        riderEarnings: riderEarnings,
        commission: commission,
        status: data.scheduledDateTime ? "SCHEDULED" : "UPCOMING",
        scheduledDateTime: data.scheduledDateTime ? new Date(data.scheduledDateTime) : null,
        isManualBooking: false,
        cityCodeId: data.cityCodeId,
        customId: customId,
        agentId: agentId,
        agentCode: agentCode || (data as any).agentCode || null,
        rideType: data.rideType || "LOCAL",
        altMobile: data.altMobile || null,
        paymentMode: data.paymentMode || "CASH",
        corporateId: data.corporateId || null,
        corporateEmployeeId: data.corporateEmployeeId || null,
        advanceAmount: data.advanceAmount || null,
        transactionId: data.transactionId || null,
        idempotencyKey: data.idempotencyKey,
        paymentVerificationId: data.paymentVerificationId,
      },
      include: {
        vehicleType: true,
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    if (data.paymentVerificationId) {
      await tx.paymentVerification.update({
        where: { id: data.paymentVerificationId },
        data: { status: "LINKED" as any },
      });

      // Audit Log
      await logPaymentAudit({
        userId,
        action: AuditAction.UPDATE,
        transactionId: data.transactionId,
        entityId: ride.id,
        description: `Ride ${ride.customId} successfully LINKED to payment intent ${data.paymentVerificationId}`,
        newData: { status: "LINKED", rideId: ride.id },
      });
    }

    // Trigger asynchronous dispatch flow without blocking return
    runDispatchEngine(ride).catch((err) => {
      console.error(`Dispatch Engine Error for Ride ${ride.id}:`, err);
    });

    return ride;
  });
};
/* ============================================
    CREATE MANUAL/SCHEDULED RIDE (USER)
============================================ */
export const createManualRide = async (
  userId: string,
  data: {
    vehicleTypeId: string;
    pickupLat: number;
    pickupLng: number;
    pickupAddress: string;
    dropLat: number;
    dropLng: number;
    dropAddress: string;
    distanceKm: number;
    scheduledDateTime: Date;
    bookingNotes?: string;
    cityCodeId: string; // NEW: Required for customId generation
    rideType?: "AIRPORT" | "LOCAL" | "OUTSTATION" | "RENTAL";
    altMobile?: string;
    paymentMode?: "CASH" | "CREDIT" | "UPI" | "CARD" | "ONLINE";
    agentCode?: string;
    couponCode?: string;
    expectedFare?: number;
    corporateId?: string;
    corporateEmployeeId?: string;
    advanceAmount?: number;
    transactionId?: string;
  }
) => {
  // Get city code for ID generation
  const cityCodeEntry = await prisma.cityCode.findUnique({
    where: { id: data.cityCodeId },
  });

  if (!cityCodeEntry) {
    throw new Error("Invalid city code ID");
  }

  const customId = await generateEntityCustomId(cityCodeEntry.code, "RIDE");

  // Verify vehicle type exists and is active
  const vehicleType = await prisma.vehicleType.findUnique({
    where: { id: data.vehicleTypeId },
  });

  if (!vehicleType) {
    throw new Error("Vehicle type not found");
  }

  if (!vehicleType.isActive) {
    throw new Error("Vehicle type is not available");
  }

  // Validate scheduled date is not too far in the past (allow 10m buffer for immediate bookings)
  const scheduledDate = new Date(data.scheduledDateTime);
  const nowWithBuffer = new Date();
  nowWithBuffer.setMinutes(nowWithBuffer.getMinutes() - 10);
  
  if (scheduledDate < nowWithBuffer) {
    throw new Error("Scheduled date must be current or in the future");
  }

  // Get active pricing config
  const pricingConfig = await prisma.pricingConfig.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  if (!pricingConfig) {
    throw new Error("Pricing configuration not found");
  }

  // NEW: Get city-specific pricing group or fallback to vehicle type defaults
  const cityPricing = await getPricingForCity(data.vehicleTypeId, data.cityCodeId, data.rideType || "LOCAL");

  const baseFare = cityPricing.baseFare;
  const perKmPrice = cityPricing.perKmPrice;
  const billableKm = Math.max(0, data.distanceKm - (cityPricing.baseKm || 0));
  let totalFare = baseFare + (perKmPrice * billableKm);

  // NEW: Apply Peak Hour Adjustment (using scheduled time)
  const peakAdjustment = await getPeakHourAdjustment(data.cityCodeId, data.vehicleTypeId, scheduledDate);
  if (peakAdjustment.fixedExtra > 0 || peakAdjustment.percentageExtra > 0) {
    const percentageAmount = (totalFare * peakAdjustment.percentageExtra) / 100;
    totalFare = Math.round(totalFare + peakAdjustment.fixedExtra + percentageAmount);
  }

  // NEW: Validate and apply Coupon Code
  let appliedCouponCode = null;
  let appliedDiscountAmount = 0;

  if (data.couponCode) {
    const couponData = await validateCouponLogic(data.couponCode, data.cityCodeId, totalFare);
    appliedCouponCode = couponData.couponCode;
    appliedDiscountAmount = couponData.discountAmount;
    totalFare = Math.round(totalFare - appliedDiscountAmount);
  }

  // EXPECTED FARE VALIDATION (Strict Mode)
  if (data.expectedFare !== undefined) {
    if (Math.abs(totalFare - data.expectedFare) > 1) {
      throw new Error(`Price mismatch. The frontend expected ₹${data.expectedFare}, but the server calculated ₹${totalFare}. Please refresh and try again.`);
    }
  }

  const riderEarnings = Math.round((totalFare * pricingConfig.riderPercentage) / 100);
  const commission = Math.round((totalFare * pricingConfig.appCommission) / 100);

  // Handle agentCode if provided
  let agentId = null;
  let agentCode = null;
  if (data.agentCode) {
    const agent = await prisma.agent.findUnique({
      where: { agentCode: data.agentCode },
    });
    if (agent) {
      agentId = agent.id;
      agentCode = agent.agentCode;
    }
  }

  // Create scheduled ride
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
      baseFare: baseFare,
      perKmPrice: perKmPrice,
      totalFare: totalFare,
      couponCode: appliedCouponCode,
      discountAmount: appliedDiscountAmount,
      riderEarnings: riderEarnings,
      commission: commission,
      status: "SCHEDULED",
      isManualBooking: true,
      scheduledDateTime: scheduledDate,
      bookingNotes: data.bookingNotes || null,
      cityCodeId: data.cityCodeId,
      customId: customId,
      agentId: agentId,
      agentCode: agentCode || data.agentCode || null,
      rideType: data.rideType || "LOCAL",
      altMobile: data.altMobile || null,
      paymentMode: data.paymentMode || "CASH",
      corporateId: data.corporateId || null,
      corporateEmployeeId: data.corporateEmployeeId || null,
      advanceAmount: data.advanceAmount || null,
      transactionId: data.transactionId || null,
    },
    include: {
      vehicleType: true,
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  });

  // Emit socket event for admins
  emitManualRideCreated(ride);

  return ride;
};

/* ============================================
    GET USER RIDES
============================================ */
export const getUserRides = async (userId: string, status?: string) => {
  const where: any = { userId };

  if (status === "FUTURE") {
    where.status = {
      in: ["UPCOMING", "ASSIGNED", "STARTED", "ARRIVED", "ONGOING", "STOPPED"]
    };
  } else if (status) {
    where.status = status as any;
  }

  const rides = await prisma.ride.findMany({
    where,
    include: {
      vehicleType: true,
      partner: {
        select: {
          id: true,
          customId: true,
          name: true,
          phone: true,
          profileImage: true,
          rating: true,
          hasOwnVehicle: true,
          ownVehicleNumber: true,
          ownVehicleModel: true,
        },
      },
      vehicle: {
        select: {
          id: true,
          customId: true,
          registrationNumber: true,
          vehicleModel: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return rides;
};

/* ============================================
    GET RIDE BY ID (USER)
============================================ */
export const getRideById = async (rideId: string, userId: string) => {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      vehicleType: true,
      partner: {
        select: {
          id: true,
          customId: true,
          name: true,
          phone: true,
          profileImage: true,
          rating: true,
          hasOwnVehicle: true,
          ownVehicleNumber: true,
          ownVehicleModel: true,
          currentLat: true,
          currentLng: true,
        },
      },
      vehicle: {
        select: {
          id: true,
          customId: true,
          registrationNumber: true,
          vehicleModel: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      corporate: {
        select: {
          id: true,
          companyName: true,
        },
      },
      corporateEmployee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!ride) {
    throw new Error("Ride not found");
  }

  // Verify ride belongs to user
  if (ride.userId !== userId) {
    throw new Error("Unauthorized to access this ride");
  }

  return ride;
};

/* ============================================
    CANCEL RIDE (USER)
============================================ */
export const cancelRide = async (rideId: string, userId: string) => {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
  });

  if (!ride) {
    throw new Error("Ride not found");
  }

  if (ride.userId !== userId) {
    throw new Error("Unauthorized to cancel this ride");
  }

  if (ride.status === "COMPLETED") {
    throw new Error("Cannot cancel a completed ride");
  }

  if (ride.status === "CANCELLED") {
    throw new Error("Ride is already cancelled");
  }

  // NEW: 3-hour cancellation rule
  const scheduledTime = ride.scheduledDateTime ? new Date(ride.scheduledDateTime) : new Date(ride.createdAt);
  const now = new Date();
  const diffMs = scheduledTime.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 3 && diffHours > -1) { // If within 3 hours or passed but not started
    throw new Error("Cancellation is only allowed up to 3 hours before the ride start time.");
  }

  const updatedRide = await prisma.ride.update({
    where: { id: rideId },
    data: {
      status: "CANCELLED",
    },
    include: {
      vehicleType: true,
      partner: {
        select: {
          id: true,
          customId: true,
          name: true,
          phone: true,
        },
      },
    },
  });

  // Emit socket event to notify partner
  emitRideCancelled(updatedRide, "USER");

  return updatedRide;
};

/* ============================================
    COMPLETE RIDE WITH OTP (USER)
============================================ */
export const completeRideWithOtp = async (
  rideId: string,
  userId: string,
  userOtp: string
) => {
  // Get user to verify OTP
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Verify OTP
  if (user.uniqueOtp !== userOtp) {
    throw new Error("Invalid OTP");
  }

  // Get ride
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      partner: true,
    },
  });

  if (!ride) {
    throw new Error("Ride not found");
  }

  if (ride.userId !== userId) {
    throw new Error("Unauthorized to complete this ride");
  }

  if (ride.status !== "STARTED") {
    throw new Error("Ride must be started before completion");
  }

  // Update ride status and partner earnings
  const updatedRide = await prisma.ride.update({
    where: { id: rideId },
    data: {
      status: "COMPLETED",
      endTime: new Date(),
      userOtp: userOtp,
    },
    include: {
      vehicleType: true,
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      partner: {
        select: {
          id: true,
          customId: true,
          name: true,
          phone: true,
        },
      },
    },
  });

  // Update partner's total earnings if partner exists
  if (ride.partnerId && ride.riderEarnings) {
    await prisma.partner.update({
      where: { id: ride.partnerId },
      data: {
        totalEarnings: {
          increment: ride.riderEarnings,
        },
      },
    });
  }

  // Emit socket event
  emitRideCompleted(updatedRide);

  return updatedRide;
};

/* ============================================
    GET AVAILABLE RIDES FOR PARTNER
============================================ */
export const getAvailableRides = async (
  partnerLat: number,
  partnerLng: number,
  vehicleTypeId?: string,
  cityCodeId?: string
) => {
  // Get pending rides not yet accepted
  const rides = await prisma.ride.findMany({
    where: {
      status: "UPCOMING",
      ...(vehicleTypeId && { vehicleTypeId: vehicleTypeId }),
      partnerId: null, // Only rides not yet accepted
      ...(cityCodeId && {
        OR: [
          { cityCodeId: cityCodeId },
          // Distance check is handled post-fetch, but typically we want to see rides in the same city anyway
        ],
      }),
    },
    include: {
      vehicleType: true,
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          profileImage: true,
        },
      },
    },
    orderBy: { createdAt: "asc" }, // Oldest first
  });

  // Calculate distance and filter nearby rides (within 10km)
  const nearbyRides = rides
    .map((ride) => {
      const distance = calculateDistance(
        partnerLat,
        partnerLng,
        ride.pickupLat,
        ride.pickupLng
      );
      return { ...ride, distanceFromPartner: distance };
    })
    .filter((ride) => {
      // Show ALL rides in the same city, OR rides within 10km (in case cityCodeId is missing or ride is near border)
      if (cityCodeId && ride.cityCodeId === cityCodeId) {
        return true;
      }
      return ride.distanceFromPartner <= 10;
    })
    .sort((a, b) => a.distanceFromPartner - b.distanceFromPartner); // Closest first

  return nearbyRides;
};

/* ============================================
    ACCEPT RIDE (PARTNER)
============================================ */
export const acceptRide = async (rideId: string, partnerId: string) => {
  // Check if partner exists and is online
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    include: {
      vehicle: true,
    },
  });

  if (!partner) {
    throw new Error("Partner not found");
  }

  if (!partner.isOnline) {
    throw new Error("Partner must be online to accept rides");
  }

  // Determine vehicle to use (partner's assigned vendor vehicle or own vehicle)
  const vehicleId = partner.vehicleId || null;

  // Use updateMany for atomic operation to prevent race conditions
  const updateResult = await prisma.ride.updateMany({
    where: { 
      id: rideId, 
      status: "UPCOMING",
      partnerId: null 
    },
    data: {
      partnerId: partnerId,
      vehicleId: vehicleId,
      status: "ASSIGNED",
      acceptedAt: new Date(),
    },
  });

  if (updateResult.count === 0) {
    throw new Error("Ride is no longer available or already accepted by another driver.");
  }

  // Fetch the successfully updated ride
  const updatedRide = await prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      vehicleType: true,
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          profileImage: true,
        },
      },
      partner: {
        select: {
          id: true,
          customId: true,
          name: true,
          phone: true,
          profileImage: true,
          hasOwnVehicle: true,
          ownVehicleNumber: true,
          ownVehicleModel: true,
          rating: true,
        },
      },
      vehicle: {
        select: {
          id: true,
          customId: true,
          registrationNumber: true,
          vehicleModel: true,
        },
      },
    },
  });

  if (!updatedRide) {
    throw new Error("Ride could not be retrieved after acceptance.");
  }

  // Emit event for dispatch engine to resolve waitForDriverAcceptance
  rideEventEmitter.emit(`ride_accepted_${rideId}`, partnerId);

  // Emit socket event to notify user
  emitRideAccepted(updatedRide);

  return updatedRide;
};

/* ============================================
    GET PARTNER RIDES
============================================ */
export const getPartnerRides = async (partnerId: string, status?: string) => {
  const rides = await prisma.ride.findMany({
    where: {
      partnerId: partnerId,
      ...(status && { status: status as any }),
    },
    include: {
      vehicleType: true,
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          profileImage: true,
          uniqueOtp: true, // Partner needs to see OTP for completion
        },
      },
      vehicle: {
        select: {
          id: true,
          customId: true,
          registrationNumber: true,
          vehicleModel: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return rides;
};

/* ============================================
    UPDATE RIDE STATUS (PARTNER)
============================================ */
export const updateRideStatus = async (
  rideId: string,
  partnerId: string,
  status: "ARRIVED" | "STARTED" | "ONGOING" | "COMPLETED" | "CANCELLED",
  userOtp?: string,
  startingKm?: number,
  endingKm?: number
) => {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
  });

  if (!ride) {
    throw new Error("Ride not found");
  }

  if (ride.partnerId !== partnerId) {
    throw new Error("Unauthorized to update this ride");
  }

  // Validate status transition
  if (status === "ARRIVED" && ride.status !== "ASSIGNED" && ride.status !== "ACCEPTED") {
    throw new Error("Ride must be assigned before marking as arrived");
  }

  if (status === "STARTED" && ride.status !== "ARRIVED") {
    throw new Error("Ride must be arrived before starting");
  }

  if (status === "ONGOING" && ride.status !== "STARTED" && ride.status !== "ARRIVED") {
    // Some flows might go from ARRIVED -> ONGOING or STARTED -> ONGOING
    throw new Error("Ride must be started or arrived before making it ongoing");
  }

  // OTP Verification for moving to STARTED or ONGOING status (Trip Beginning)
  if (status === "STARTED" || status === "ONGOING") {
    // Get user to verify uniqueOtp
    if (!ride.userId) {
      throw new Error("User not found for this ride");
    }

    const user = await prisma.user.findUnique({
      where: { id: ride.userId },
      select: { uniqueOtp: true }
    });

    if (!user) {
      throw new Error("User record not found");
    }

    if (!userOtp) {
      throw new Error(`User unique OTP is required to make the ride ${status.toLowerCase()}`);
    }

    if (user.uniqueOtp !== userOtp) {
      throw new Error("Invalid user OTP");
    }

    // Rental validation
    if (status === "ONGOING" && ride.rideType === "RENTAL") {
      if (startingKm === undefined || startingKm < 0) {
        throw new Error("Valid starting KM is required to start a rental ride");
      }
    }
  }

  // Handle completion validation
  if (status === "COMPLETED") {
    if (ride.status !== "ONGOING" && ride.status !== "STARTED") {
      throw new Error("Ride must be ONGOING or STARTED before completing");
    }

    // Rental validation
    if (ride.rideType === "RENTAL") {
      if (endingKm === undefined || endingKm < 0) {
        throw new Error("Ending KM is required to complete a rental ride");
      }
      if (!ride.startingKm || endingKm <= ride.startingKm) {
        throw new Error("Ending KM must be greater than starting KM");
      }
    }
  }

  const updateData: any = {
    status: status,
  };

  if (status === "ARRIVED") {
    updateData.arrivedAt = new Date();
  }

  if (status === "STARTED") {
    updateData.startTime = new Date();
  }

  if (status === "ONGOING") {
    // If not already started, set start time
    if (!ride.startTime) {
      updateData.startTime = new Date();
    }
    if (ride.rideType === "RENTAL" && startingKm !== undefined) {
      updateData.startingKm = startingKm;
    }
  }

  // Custom completion logic for pricing
  if (status === "COMPLETED") {
    updateData.endTime = new Date();

    if (ride.rideType === "RENTAL" && endingKm !== undefined && ride.startingKm) {
      updateData.endingKm = endingKm;
      const totalDistance = endingKm - ride.startingKm;
      updateData.distanceKm = totalDistance;

      // Calculate fare for rental ride based on distance and pricing
      const perKmPrice = ride.perKmPrice || 0;
      const baseFare = ride.baseFare || 20;

      const newTotalFare = baseFare + (perKmPrice * totalDistance);

      const pricingConfig = await prisma.pricingConfig.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      });
      const riderPercentage = pricingConfig ? pricingConfig.riderPercentage : 80;
      const appCommissionStr = pricingConfig ? pricingConfig.appCommission : 20;

      updateData.totalFare = newTotalFare;
      updateData.riderEarnings = (newTotalFare * riderPercentage) / 100;
      updateData.commission = (newTotalFare * appCommissionStr) / 100;
    }
  }

  if (status === "COMPLETED") {
    updateData.endTime = new Date();
  }

  const updatedRide = await prisma.ride.update({
    where: { id: rideId },
    data: updateData,
    include: {
      vehicleType: true,
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          profileImage: true,
        },
      },
      partner: {
        select: {
          id: true,
          customId: true,
          name: true,
          phone: true,
          profileImage: true,
          hasOwnVehicle: true,
          ownVehicleNumber: true,
          ownVehicleModel: true,
        },
      },
      vehicle: {
        select: {
          id: true,
          customId: true,
          registrationNumber: true,
          vehicleModel: true,
        },
      },
    },
  });

  // Ensure riderEarnings is not null for the returned object
  if (updatedRide.riderEarnings === null || updatedRide.riderEarnings === undefined) {
    (updatedRide as any).riderEarnings = ride.riderEarnings || 0;
  }

  // Emit socket event based on status
  if (status === "ARRIVED") {
    emitRideArrived(updatedRide);
  } else if (status === "STARTED" || status === "ONGOING") {
    // Emitting ride started handles ONGOING well enough, depending on frontend.
    emitRideStarted(updatedRide);
  } else if (status === "COMPLETED") {

    // Update partner's total earnings if partner exists
    if (updatedRide.partnerId && updatedRide.riderEarnings) {
      await prisma.partner.update({
        where: { id: updatedRide.partnerId },
        data: {
          totalEarnings: {
            increment: updatedRide.riderEarnings,
          },
        },
      });
    }

    emitRideCompleted(updatedRide);
  }

  return updatedRide;
};

/* ============================================
    CALCULATE DISTANCE (Helper function)
============================================ */
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
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
  const distance = R * c;
  return distance;
};

