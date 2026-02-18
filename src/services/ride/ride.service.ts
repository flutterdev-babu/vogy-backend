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
import { generateEntityCustomId } from "../city/city.service";

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
    corporateId?: string;
    agentCode?: string;
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

  // Get active pricing config
  const pricingConfig = await prisma.pricingConfig.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  if (!pricingConfig) {
    throw new Error("Pricing configuration not found");
  }

  // Calculate fare with admin-controlled pricing
  // TOTAL FARE = baseFare + (pricePerKm × distanceKm)
  const baseFare = pricingConfig.baseFare || 20;
  const perKmPrice = vehicleType.pricePerKm;
  const totalFare = baseFare + (perKmPrice * data.distanceKm);
  const riderEarnings = (totalFare * pricingConfig.riderPercentage) / 100;
  const commission = (totalFare * pricingConfig.appCommission) / 100;

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

  // Create ride
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
      riderEarnings: riderEarnings,
      commission: commission,
      status: "UPCOMING",
      isManualBooking: false,
      cityCodeId: data.cityCodeId,
      customId: customId,
      agentId: agentId,
      agentCode: agentCode || (data as any).agentCode || null,
      rideType: data.rideType || "LOCAL",
      altMobile: data.altMobile || null,
      paymentMode: data.paymentMode || "CASH",
      corporateId: data.corporateId || null,
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

  // Emit socket event for real-time updates
  emitRideCreated(ride);

  return ride;
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
    corporateId?: string;
    agentCode?: string;
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

  // Validate scheduled date is in the future
  const scheduledDate = new Date(data.scheduledDateTime);
  if (scheduledDate <= new Date()) {
    throw new Error("Scheduled date must be in the future");
  }

  // Get active pricing config
  const pricingConfig = await prisma.pricingConfig.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  if (!pricingConfig) {
    throw new Error("Pricing configuration not found");
  }

  // Calculate fare with admin-controlled pricing
  const baseFare = pricingConfig.baseFare || 20;
  const perKmPrice = vehicleType.pricePerKm;
  const totalFare = baseFare + (perKmPrice * data.distanceKm);
  const riderEarnings = (totalFare * pricingConfig.riderPercentage) / 100;
  const commission = (totalFare * pricingConfig.appCommission) / 100;

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
  vehicleTypeId?: string
) => {
  // Get pending rides not yet accepted
  const rides = await prisma.ride.findMany({
    where: {
      status: "UPCOMING",
      ...(vehicleTypeId && { vehicleTypeId: vehicleTypeId }),
      partnerId: null, // Only rides not yet accepted
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
    .filter((ride) => ride.distanceFromPartner <= 10) // Within 10km
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

  // Get ride
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
  });

  if (!ride) {
    throw new Error("Ride not found");
  }

  if (ride.status !== "UPCOMING") {
    throw new Error("Ride is not available for acceptance");
  }

  if (ride.partnerId) {
    throw new Error("Ride has already been accepted");
  }

  // Determine vehicle to use (partner's assigned vendor vehicle or own vehicle)
  const vehicleId = partner.vehicleId || null;

  // Accept ride
  const updatedRide = await prisma.ride.update({
    where: { id: rideId },
    data: {
      partnerId: partnerId,
      vehicleId: vehicleId,
      status: "ASSIGNED",
      acceptedAt: new Date(),
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
  status: "ARRIVED" | "STARTED"
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
  if (status === "ARRIVED" && ride.status !== "ASSIGNED") {
    throw new Error("Ride must be assigned before marking as arrived");
  }

  if (status === "STARTED" && ride.status !== "ARRIVED") {
    throw new Error("Ride must be arrived before starting");
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

  // Emit socket event based on status
  if (status === "ARRIVED") {
    emitRideArrived(updatedRide);
  } else if (status === "STARTED") {
    emitRideStarted(updatedRide);
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

