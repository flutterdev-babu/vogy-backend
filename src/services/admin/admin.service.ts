import { prisma } from "../../config/prisma";
import { generateUnique4DigitOtp } from "../../utils/generateUniqueOtp";
import { emitRiderAssigned } from "../socket/socket.service";

/* ============================================
    VEHICLE TYPE MANAGEMENT
============================================ */

export const createVehicleType = async (data: {
  category: "BIKE" | "AUTO" | "CAR";
  name: string;
  displayName: string;
  pricePerKm: number;
  baseFare?: number;
}) => {
  // Validate category
  const validCategories = ["BIKE", "AUTO", "CAR"];
  if (!validCategories.includes(data.category)) {
    throw new Error("Invalid category. Must be BIKE, AUTO, or CAR.");
  }

  // Check if vehicle type with this name already exists
  const exists = await prisma.vehicleType.findUnique({
    where: { name: data.name },
  });

  if (exists) {
    throw new Error("Vehicle type with this name already exists");
  }

  const vehicleType = await prisma.vehicleType.create({
    data: {
      category: data.category as any,
      name: data.name,
      displayName: data.displayName,
      pricePerKm: data.pricePerKm,
      baseFare: data.baseFare ?? null,
    },
  });

  return vehicleType;
};

export const getAllVehicleTypes = async () => {
  const vehicleTypes = await prisma.vehicleType.findMany({
    orderBy: { createdAt: "desc" },
  });

  return vehicleTypes;
};

export const getVehicleTypeById = async (id: string) => {
  const vehicleType = await prisma.vehicleType.findUnique({
    where: { id },
  });

  if (!vehicleType) {
    throw new Error("Vehicle type not found");
  }

  return vehicleType;
};

export const updateVehicleType = async (
  id: string,
  data: {
    displayName?: string;
    pricePerKm?: number;
    baseFare?: number;
    isActive?: boolean;
  }
) => {
  const vehicleType = await prisma.vehicleType.findUnique({
    where: { id },
  });

  if (!vehicleType) {
    throw new Error("Vehicle type not found");
  }

  const updated = await prisma.vehicleType.update({
    where: { id },
    data: {
      ...(data.displayName && { displayName: data.displayName }),
      ...(data.pricePerKm !== undefined && { pricePerKm: data.pricePerKm }),
      ...(data.baseFare !== undefined && { baseFare: data.baseFare }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

  return updated;
};

export const deleteVehicleType = async (id: string) => {
  const vehicleType = await prisma.vehicleType.findUnique({
    where: { id },
  });

  if (!vehicleType) {
    throw new Error("Vehicle type not found");
  }

  await prisma.vehicleType.delete({
    where: { id },
  });

  return { message: "Vehicle type deleted successfully" };
};

/* ============================================
    PRICING CONFIGURATION
============================================ */

export const getPricingConfig = async () => {
  let config = await prisma.pricingConfig.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  // If no config exists, create default one
  if (!config) {
    config = await prisma.pricingConfig.create({
      data: {
        riderPercentage: 80,
        appCommission: 20,
      },
    });
  }

  return config;
};

export const updatePricingConfig = async (data: {
  baseFare?: number;
  riderPercentage: number;
  appCommission: number;
}) => {
  // Validate percentages
  if (data.riderPercentage + data.appCommission !== 100) {
    throw new Error("Rider percentage and app commission must sum to 100%");
  }

  // Deactivate old configs
  await prisma.pricingConfig.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });

  // Create new active config
  const config = await prisma.pricingConfig.create({
    data: {
      baseFare: data.baseFare ?? 20,
      riderPercentage: data.riderPercentage,
      appCommission: data.appCommission,
      isActive: true,
    },
  });

  return config;
};

/* ============================================
    RIDER MANAGEMENT
============================================ */

export const getAllRiders = async () => {
  const riders = await prisma.rider.findMany({
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      profileImage: true,
      vehicleNumber: true,
      vehicleModel: true,
      isOnline: true,
      rating: true,
      totalEarnings: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return riders;
};

export const getRiderById = async (riderId: string) => {
  const rider = await prisma.rider.findUnique({
    where: { id: riderId },
    include: {
      rides: {
        select: {
          id: true,
          status: true,
          totalFare: true,
          riderEarnings: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!rider) {
    throw new Error("Rider not found");
  }

  return rider;
};

/* ============================================
    SCHEDULED RIDE MANAGEMENT
============================================ */

export const getScheduledRides = async () => {
  const rides = await prisma.ride.findMany({
    where: {
      status: "SCHEDULED",
      isManualBooking: true,
      riderId: null,
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
    orderBy: { scheduledDateTime: "asc" },
  });

  return rides;
};

export const assignRiderToRide = async (
  rideId: string,
  riderId: string,
  adminId: string
) => {
  // Verify rider exists
  const rider = await prisma.rider.findUnique({
    where: { id: riderId },
  });

  if (!rider) {
    throw new Error("Rider not found");
  }

  // Verify ride exists and is scheduled
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
  });

  if (!ride) {
    throw new Error("Ride not found");
  }

  if (ride.status !== "SCHEDULED") {
    throw new Error("Ride is not a scheduled ride or already assigned");
  }

  if (ride.riderId) {
    throw new Error("Ride already has a rider assigned");
  }

  // Assign rider to ride
  const updatedRide = await prisma.ride.update({
    where: { id: rideId },
    data: {
      riderId: riderId,
      assignedByAdminId: adminId,
      status: "ACCEPTED",
      acceptedAt: new Date(),
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
      rider: {
        select: {
          id: true,
          name: true,
          phone: true,
          profileImage: true,
          vehicleNumber: true,
          vehicleModel: true,
          rating: true,
        },
      },
      vehicleType: true,
    },
  });

  // Emit socket event to notify user and rider
  emitRiderAssigned(updatedRide);

  return updatedRide;
};

/* ============================================
    ADMIN RIDE MANAGEMENT
============================================ */

export const getAllRides = async (filters?: {
  status?: string;
  vehicleType?: string;
  userId?: string;
  riderId?: string;
}) => {
  const rides = await prisma.ride.findMany({
    where: {
      ...(filters?.status && { status: filters.status as any }),
      ...(filters?.vehicleType && {
        vehicleType: {
          name: filters.vehicleType as any,
        },
      }),
      ...(filters?.userId && { userId: filters.userId }),
      ...(filters?.riderId && { riderId: filters.riderId }),
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
      rider: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
      vehicleType: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return rides;
};

export const getRideById = async (id: string) => {
  const ride = await prisma.ride.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
      rider: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
      vehicleType: true,
    },
  });

  if (!ride) {
    throw new Error("Ride not found");
  }

  return ride;
};

/* ============================================
    ADMIN USER MANAGEMENT
============================================ */

export const updateUserUniqueOtpByAdmin = async (userId: string) => {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Generate new unique OTP
  const newUniqueOtp = await generateUnique4DigitOtp();

  // Update user's unique OTP
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      uniqueOtp: newUniqueOtp,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      uniqueOtp: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

export const getAllUsers = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      uniqueOtp: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return users;
};

export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      uniqueOtp: true,
      createdAt: true,
      updatedAt: true,
      rides: {
        select: {
          id: true,
          status: true,
          totalFare: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

