import { prisma } from "../../config/prisma";
import { generateUnique4DigitOtp } from "../../utils/generateUniqueOtp";
import { hashPassword } from "../../utils/hash";

/* ============================================
    UPDATE USER PASSWORD
============================================ */
export const updateUserPassword = async (userId: string, password: string) => {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Hash new password
  const hashedPassword = await hashPassword(password);

  // Update user's password
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
    },
  });

  return updatedUser;
};

/* ============================================
    GET USER PROFILE
============================================ */
export const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      profileImage: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

/* ============================================
    UPDATE USER PROFILE
============================================ */
export const updateUserProfile = async (
  userId: string,
  data: {
    name?: string;
    email?: string;
    profileImage?: string;
  }
) => {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Check if email is being updated and if it's already taken by another user
  if (data.email && data.email !== user.email) {
    const emailExists = await prisma.user.findFirst({
      where: { email: data.email },
    });

    if (emailExists) {
      throw new Error("Email is already registered");
    }
  }

  // Update user profile
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.email !== undefined && { email: data.email || null }),
      ...(data.profileImage !== undefined && {
        profileImage: data.profileImage || null,
      }),
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      profileImage: true,
      uniqueOtp: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

/* ============================================
    UPDATE USER UNIQUE OTP
============================================ */
export const updateUserUniqueOtp = async (userId: string) => {
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
      uniqueOtp: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

/* ============================================
    GET USER UNIQUE OTP (for user to see their OTP)
============================================ */
export const getUserUniqueOtp = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      phone: true,
      uniqueOtp: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

/* ============================================
    GET USER RIDE SUMMARY / STATS
============================================ */
export const getUserRideSummary = async (userId: string) => {
  const [totalRides, completedRides, cancelledRides, spending] = await Promise.all([
    prisma.ride.count({ where: { userId } }),
    prisma.ride.count({ where: { userId, status: "COMPLETED" } }),
    prisma.ride.count({ where: { userId, status: "CANCELLED" } }),
    prisma.ride.aggregate({
      where: { userId, status: "COMPLETED" },
      _sum: { totalFare: true },
      _avg: { totalFare: true },
    }),
  ]);

    return {
    totalRides,
    completedRides,
    cancelledRides,
    activeRides: totalRides - completedRides - cancelledRides, // Changed from inProgress to activeRides
    totalSpent: spending._sum.totalFare || 0,
    averageFare: spending._avg.totalFare ? parseFloat(spending._avg.totalFare.toFixed(2)) : 0,
  };
};

/* ============================================
    GET USER ACTIVE RIDE
============================================ */
export const getActiveRide = async (userId: string) => {
  const ride = await prisma.ride.findFirst({
    where: {
      userId,
      status: {
        in: ["UPCOMING", "ACCEPTED", "ASSIGNED", "STARTED", "ARRIVED", "ONGOING"],
      },
    },
    include: {
      partner: {
        select: {
          id: true,
          customId: true,
          name: true,
          phone: true,
          profileImage: true,
          rating: true,
          currentLat: true,
          currentLng: true,
          isOnline: true,
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
      vehicleType: {
        select: { id: true, name: true, displayName: true, category: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return ride || null;
};

/* ============================================
    GET USER SPEND SUMMARY
============================================ */
export const getUserSpendSummary = async (userId: string) => {
  // By payment mode
  const byPaymentMode = await prisma.ride.groupBy({
    by: ["paymentMode"],
    where: { userId, status: "COMPLETED" },
    _count: true,
    _sum: { totalFare: true },
  });

  // By vehicle type
  const byVehicleType = await prisma.ride.groupBy({
    by: ["vehicleTypeId"],
    where: { userId, status: "COMPLETED", vehicleTypeId: { not: null } },
    _count: true,
    _sum: { totalFare: true },
  });

  // Fetch vehicle type names
  const vehicleTypeIds = byVehicleType.map((vt) => vt.vehicleTypeId).filter(Boolean) as string[];
  const vehicleTypes = await prisma.vehicleType.findMany({
    where: { id: { in: vehicleTypeIds } },
    select: { id: true, displayName: true, category: true },
  });
  const vehicleTypeMap = new Map(vehicleTypes.map((vt) => [vt.id, vt]));

  // Last 30 days monthly
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentRides = await prisma.ride.findMany({
    where: {
      userId,
      status: "COMPLETED",
      createdAt: { gte: thirtyDaysAgo },
    },
    select: {
      totalFare: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const dailySpend: Record<string, { spent: number; rides: number }> = {};
  recentRides.forEach((ride) => {
    const dateKey = ride.createdAt.toISOString().split("T")[0];
    if (!dailySpend[dateKey]) {
      dailySpend[dateKey] = { spent: 0, rides: 0 };
    }
    dailySpend[dateKey].spent += ride.totalFare || 0;
    dailySpend[dateKey].rides += 1;
  });

  return {
    byPaymentMode: byPaymentMode.map((pm) => ({
      mode: pm.paymentMode,
      count: pm._count,
      amount: pm._sum.totalFare || 0,
    })),
    byVehicleType: byVehicleType.map((vt) => ({
      vehicleTypeId: vt.vehicleTypeId,
      vehicleType: vehicleTypeMap.get(vt.vehicleTypeId || "") || null,
      count: vt._count,
      amount: vt._sum.totalFare || 0,
    })),
    dailySpend: Object.entries(dailySpend).map(([date, data]) => ({
      date,
      ...data,
    })),
  };
};

/* ============================================
    SAVED PLACES
============================================ */
export const getSavedPlaces = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { savedPlaces: true },
  });
  if (!user) throw new Error("User not found");
  return (user.savedPlaces as any[]) || [];
};

export const updateSavedPlaces = async (userId: string, places: any[]) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { savedPlaces: places },
    select: { savedPlaces: true },
  });
  return (user.savedPlaces as any[]) || [];
};

/* ============================================
    EMERGENCY CONTACTS
============================================ */
export const getEmergencyContacts = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emergencyContacts: true, safetyPrefs: true },
  });
  if (!user) throw new Error("User not found");
  return {
    contacts: (user.emergencyContacts as any[]) || [],
    safetyPrefs: (user.safetyPrefs as any) || {},
  };
};

export const updateEmergencyContacts = async (
  userId: string,
  contacts: any[],
  safetyPrefs?: any
) => {
  const data: any = { emergencyContacts: contacts };
  if (safetyPrefs !== undefined) data.safetyPrefs = safetyPrefs;

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: { emergencyContacts: true, safetyPrefs: true },
  });
  return {
    contacts: (user.emergencyContacts as any[]) || [],
    safetyPrefs: (user.safetyPrefs as any) || {},
  };
};

/* ============================================
    REFERRAL CODE
============================================ */
const generateReferralCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "VOGY";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const getUserReferralCode = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true, name: true },
  });
  if (!user) throw new Error("User not found");

  // If no referral code yet, generate one
  if (!user.referralCode) {
    let code = generateReferralCode();
    let attempts = 0;
    while (attempts < 10) {
      const exists = await prisma.user.findFirst({ where: { referralCode: code } });
      if (!exists) break;
      code = generateReferralCode();
      attempts++;
    }
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { referralCode: code },
      select: { referralCode: true, name: true },
    });
    return updated;
  }
  return user;
};

export const applyReferralCode = async (userId: string, referralCode: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");
  if (user.referredBy) throw new Error("You have already used a referral code");

  // Find referrer
  const referrer = await prisma.user.findFirst({
    where: { referralCode: referralCode.toUpperCase() },
  });
  if (!referrer) throw new Error("Invalid referral code");
  if (referrer.id === userId) throw new Error("You cannot refer yourself");

  await prisma.user.update({
    where: { id: userId },
    data: { referredBy: referralCode.toUpperCase() },
  });

  return { message: "Referral code applied successfully!" };
};
