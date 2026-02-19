import { prisma } from "../../config/prisma";
import { generateUnique4DigitOtp } from "../../utils/generateUniqueOtp";
import { emitRiderAssigned, emitManualRideCreated } from "../socket/socket.service";
import * as vendorAuthService from "../auth/vendor.auth.service";
import * as partnerAuthService from "../auth/partner.auth.service";
import { generateEntityCustomId } from "../city/city.service";
import { validatePhoneNumber } from "../../utils/phoneValidation";
import { hashPassword } from "../../utils/hash";

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
    PARTNER MANAGEMENT
============================================ */

export const getAllPartners = async () => {
  const partners = await prisma.partner.findMany({
    select: {
      id: true,
      customId: true,
      name: true,
      phone: true,
      email: true,
      profileImage: true,
      isOnline: true,
      rating: true,
      totalEarnings: true,
      hasOwnVehicle: true,
      ownVehicleNumber: true,
      ownVehicleModel: true,
      createdAt: true,
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

  return partners;
};

export const getPartnerById = async (partnerId: string) => {
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    include: {
      vehicle: {
        include: {
          vehicleType: true,
          vendor: true,
        },
      },
      ownVehicleType: true,
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

  if (!partner) {
    throw new Error("Partner not found");
  }

  return partner;
};

/* ============================================
    SCHEDULED RIDE MANAGEMENT
============================================ */

export const getScheduledRides = async () => {
  const rides = await prisma.ride.findMany({
    where: {
      status: "SCHEDULED",
      isManualBooking: true,
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
    orderBy: { scheduledDateTime: "asc" },
  });

  return rides;
};

export const assignPartnerToRide = async (
  rideId: string,
  partnerId: string,
  adminId: string
) => {
  // Verify partner exists
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    include: {
      vehicle: true
    }
  });

  if (!partner) {
    throw new Error("Partner not found");
  }

  // Verify ride exists and is scheduled
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
  });

  if (!ride) {
    throw new Error("Ride not found");
  }

  if (ride.status !== "SCHEDULED" && ride.status !== "UPCOMING") {
    throw new Error("Ride is already assigned or in progress");
  }

  if (ride.partnerId) {
    throw new Error("Ride already has a partner assigned");
  }

  // Assign partner to ride
  const updatedRide = await prisma.ride.update({
    where: { id: rideId },
    data: {
      partnerId: partnerId,
      assignedByAdminId: adminId,
      status: "ACCEPTED",
      acceptedAt: new Date(),
      // If partner has an assigned vehicle, link it
      ...(partner.vehicleId && { vehicleId: partner.vehicleId }),
      // If partner has an assigned vehicle, use its vendor
      ...(partner.vehicle?.vendorId && { vendorId: partner.vehicle.vendorId }),
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
      partner: {
        select: {
          id: true,
          customId: true,
          name: true,
          phone: true,
          profileImage: true,
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
      vehicleType: true,
    },
  });

  // Emit socket event to notify user and partner
  // Note: Function renamed or logic updated to emitRiderAssigned with Partner data
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
  partnerId?: string;
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
      ...(filters?.partnerId && { partnerId: filters.partnerId }),
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
      partner: {
        select: {
          id: true,
          customId: true,
          name: true,
          phone: true,
          email: true,
        },
      },
      vehicleType: true,
      vehicle: {
        select: {
          id: true,
          customId: true,
          registrationNumber: true,
          vehicleModel: true,
        },
      },
      vendor: {
        select: {
          id: true,
          customId: true,
          name: true,
          companyName: true,
        },
      },
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
      partner: {
        select: {
          id: true,
          customId: true,
          name: true,
          phone: true,
          email: true,
        },
      },
      vehicleType: true,
      vehicle: {
        select: {
          id: true,
          customId: true,
          registrationNumber: true,
          vehicleModel: true,
          color: true,
        },
      },
      vendor: {
        select: {
          id: true,
          customId: true,
          name: true,
          companyName: true,
          phone: true,
        },
      },
    },
  });

  if (!ride) {
    throw new Error("Ride not found");
  }

  return ride;
};

export const updateRideStatusByAdmin = async (rideId: string, status: any) => {
  const ride = await prisma.ride.update({
    where: { id: rideId },
    data: { status },
    include: {
      user: true,
      partner: true,
    }
  });
  return ride;
};

export const getRideOtpByAdmin = async (rideId: string) => {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    select: { userOtp: true }
  });
  if (!ride) throw new Error("Ride not found");
  return ride.userOtp;
};

/* ============================================
    ATTACHMENT VERIFICATION
============================================ */

export const verifyAttachmentByAdmin = async (attachmentId: string, status: "APPROVED" | "REJECTED") => {
  const attachment = await prisma.attachment.update({
    where: { id: attachmentId },
    data: { status },
    include: {
      partner: true,
      vehicle: true,
    }
  });

  // If approved, update partner status to APPROVED as well
  if (status === "APPROVED") {
    await prisma.partner.update({
      where: { id: attachment.partnerId },
      data: { status: "APPROVED" }
    });
  }

  return attachment;
};


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

/* ============================================
    VENDOR MANAGEMENT (Moved to Admin)
============================================ */

export const getAllVendors = async (search?: string) => {
  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { companyName: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
    ];
  }

  return await prisma.vendor.findMany({
    where,
    include: {
      _count: {
        select: {
          vehicles: true,
          partners: true,
          rides: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getVendorById = async (id: string) => {
  const vendor = await prisma.vendor.findUnique({
    where: { id },
    include: {
      vehicles: true,
      partners: true,
      attachments: {
        include: {
          partner: true,
          vehicle: true,
        },
      },
    },
  });
  if (!vendor) throw new Error("Vendor not found");
  return vendor;
};

export const updateVendor = async (id: string, data: any) => {
  return await prisma.vendor.update({
    where: { id },
    data,
  });
};

/* ============================================
    CORPORATE MANAGEMENT (Moved to Admin)
============================================ */

export const getAllCorporates = async (search?: string) => {
  const where: any = {};
  if (search) {
    where.OR = [
      { companyName: { contains: search, mode: "insensitive" } },
      { contactPerson: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
    ];
  }

  return await prisma.corporate.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
};

export const getCorporateById = async (id: string) => {
  const corporate = await prisma.corporate.findUnique({
    where: { id },
    include: {
      rides: true,
      billings: true,
      payments: true,
    },
  });
  if (!corporate) throw new Error("Corporate not found");
  return corporate;
};

export const updateCorporate = async (id: string, data: any) => {
  return await prisma.corporate.update({
    where: { id },
    data,
  });
};

/* ============================================
    CITY CODE MANAGEMENT (Moved to Admin)
============================================ */

export const getAllCityCodes = async () => {
  return await prisma.cityCode.findMany({
    include: {
      pricing: {
        include: {
          vehicleType: true,
        },
      },
    },
    orderBy: { cityName: "asc" },
  });
};

export const createCityCode = async (data: any) => {
  return await prisma.cityCode.create({
    data,
  });
};

export const updateCityCode = async (id: string, data: any) => {
  return await prisma.cityCode.update({
    where: { id },
    data,
  });
};

/* ============================================
    ATTACHMENT MANAGEMENT
============================================ */

export const createAttachment = async (data: {
  vendorCustomId: string;
  partnerCustomId: string;
  vehicleCustomId: string;
}) => {
  // Validate or lookup vendor
  const vendor = await prisma.vendor.findUnique({
    where: { customId: data.vendorCustomId },
  });
  if (!vendor) throw new Error("Invalid vendor custom ID");

  // Validate or lookup partner
  const partner = await prisma.partner.findUnique({
    where: { customId: data.partnerCustomId },
  });
  if (!partner) throw new Error("Invalid partner custom ID");

  // Validate or lookup vehicle
  const vehicle = await prisma.vehicle.findUnique({
    where: { customId: data.vehicleCustomId },
  });
  if (!vehicle) throw new Error("Invalid vehicle custom ID");

  // Check if attachment already exists
  const existing = await prisma.attachment.findFirst({
    where: {
      vendorId: vendor.id,
      partnerId: partner.id,
      vehicleId: vehicle.id,
    },
  });

  if (existing) {
    throw new Error("This attachment already exists");
  }

  // Create attachment
  const attachment = await prisma.attachment.create({
    data: {
      vendorId: vendor.id,
      partnerId: partner.id,
      vehicleId: vehicle.id,
    },
    include: {
      vendor: true,
      partner: true,
      vehicle: true,
    },
  });

  return attachment;
};

export const getAllAttachments = async () => {
  return await prisma.attachment.findMany({
    include: {
      vendor: true,
      partner: true,
      vehicle: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

export const toggleAttachmentStatus = async (id: string, isActive: boolean) => {
  return await prisma.attachment.update({
    where: { id },
    data: { isActive },
  });
};

export const deleteAttachment = async (id: string) => {
  return await prisma.attachment.delete({
    where: { id },
  });
};

/* ============================================
    ADMIN ENTITY CREATION
============================================ */

export const createVendorByAdmin = async (data: any) => {
  return await vendorAuthService.registerVendor(data);
};

export const createPartnerByAdmin = async (data: any) => {
  return await partnerAuthService.registerPartner(data);
};

export const createManualRideByAdmin = async (
  adminId: string,
  data: {
    userId?: string;
    userPhone?: string;
    userName?: string;
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
    cityCodeId: string;
    agentCode?: string;
    corporateId?: string;
    paymentMode?: "CASH" | "CREDIT" | "UPI" | "CARD" | "ONLINE";
    rideType?: "AIRPORT" | "LOCAL" | "OUTSTATION" | "RENTAL";
    altMobile?: string;
  }
) => {
  // 1. Handle User (Find or Create)
  let user;
  if (data.userId) {
    user = await prisma.user.findUnique({ where: { id: data.userId } });
  } else if (data.userPhone) {
    user = await prisma.user.findUnique({ where: { phone: data.userPhone } });
    if (!user) {
      if (!data.userName) throw new Error("User name is required for new user creation");
      const uniqueOtp = await generateUnique4DigitOtp();
      user = await prisma.user.create({
        data: {
          name: data.userName,
          phone: data.userPhone,
          uniqueOtp,
        },
      });
    }
  }

  if (!user) throw new Error("User identification failed");

  // 1b. Handle Agent Code
  let agentId = null;
  if (data.agentCode) {
    const agent = await prisma.agent.findUnique({
      where: { agentCode: data.agentCode },
    });
    if (agent) {
      agentId = agent.id;
    }
  }

  // 2. Fare Calculation (Similar to ride.service.ts)
  const vehicleType = await prisma.vehicleType.findUnique({
    where: { id: data.vehicleTypeId },
  });

  if (!vehicleType) throw new Error("Vehicle type not found");

  // Check city pricing first
  const cityPricing = await prisma.cityPricing.findUnique({
    where: {
      cityCodeId_vehicleTypeId: {
        cityCodeId: data.cityCodeId,
        vehicleTypeId: data.vehicleTypeId,
      },
    },
  });

  let baseFare, perKmPrice, totalFare;
  if (cityPricing) {
    baseFare = cityPricing.baseFare;
    perKmPrice = cityPricing.perKmAfterBase;
    const billableKm = Math.max(0, data.distanceKm - cityPricing.baseKm);
    totalFare = baseFare + (billableKm * perKmPrice);
  } else {
    // Fallback to global config
    const pricingConfig = await prisma.pricingConfig.findFirst({
      where: { isActive: true },
    });
    if (!pricingConfig) throw new Error("Pricing configuration not found");
    baseFare = vehicleType.baseFare || pricingConfig.baseFare;
    perKmPrice = vehicleType.pricePerKm;
    totalFare = baseFare + (perKmPrice * data.distanceKm);
  }

  // 3. Generate Custom ID
  const cityCodeEntry = await prisma.cityCode.findUnique({
    where: { id: data.cityCodeId },
  });
  if (!cityCodeEntry) throw new Error("Invalid city code ID");
  const customId = await generateEntityCustomId(cityCodeEntry.code, "RIDE");

  // 4. Create Ride
  const ride = await prisma.ride.create({
    data: {
      userId: user.id,
      vehicleTypeId: data.vehicleTypeId,
      pickupLat: data.pickupLat,
      pickupLng: data.pickupLng,
      pickupAddress: data.pickupAddress,
      dropLat: data.dropLat,
      dropLng: data.dropLng,
      dropAddress: data.dropAddress,
      distanceKm: data.distanceKm,
      baseFare,
      perKmPrice,
      totalFare,
      status: "SCHEDULED",
      isManualBooking: true,
      scheduledDateTime: new Date(data.scheduledDateTime),
      bookingNotes: data.bookingNotes || null,
      cityCodeId: data.cityCodeId,
      customId,
      assignedByAdminId: adminId,
      agentId,
      agentCode: data.agentCode || null,
      corporateId: data.corporateId || null,
      paymentMode: data.paymentMode || "CASH",
      rideType: data.rideType || "LOCAL",
      altMobile: data.altMobile || null,
    },
    include: {
      user: true,
      vehicleType: true,
    },
  });

  // 5. Notify
  emitManualRideCreated(ride);

  return ride;
};

/* ============================================
    ADMIN DASHBOARD (Global overview)
============================================ */
export const getAdminDashboard = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    totalVendors,
    totalPartners,
    totalVehicles,
    totalRides,
    totalAgents,
    totalCorporates,
    completedRides,
    activeRides,
    todayRides,
    todayNewUsers,
    revenue,
    todayRevenue,
    onlinePartners,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.vendor.count(),
    prisma.partner.count(),
    prisma.vehicle.count(),
    prisma.ride.count(),
    prisma.agent.count(),
    prisma.corporate.count(),
    prisma.ride.count({ where: { status: "COMPLETED" } }),
    prisma.ride.count({
      where: {
        status: { in: ["ACCEPTED", "ASSIGNED", "STARTED", "ARRIVED", "ONGOING"] },
      },
    }),
    prisma.ride.count({ where: { createdAt: { gte: today } } }),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.ride.aggregate({
      where: { status: "COMPLETED" },
      _sum: { totalFare: true, riderEarnings: true, commission: true },
    }),
    prisma.ride.aggregate({
      where: { status: "COMPLETED", createdAt: { gte: today } },
      _sum: { totalFare: true, commission: true },
    }),
    prisma.partner.count({ where: { isOnline: true } }),
  ]);

  return {
    entities: {
      users: totalUsers,
      vendors: totalVendors,
      partners: totalPartners,
      vehicles: totalVehicles,
      agents: totalAgents,
      corporates: totalCorporates,
      onlinePartners,
    },
    rides: {
      total: totalRides,
      completed: completedRides,
      active: activeRides,
      today: todayRides,
    },
    revenue: {
      total: revenue._sum.totalFare || 0,
      partnerEarnings: revenue._sum.riderEarnings || 0,
      commission: revenue._sum.commission || 0,
      todayRevenue: todayRevenue._sum.totalFare || 0,
      todayCommission: todayRevenue._sum.commission || 0,
    },
    todayNewUsers,
  };
};

/* ============================================
    ADMIN REVENUE ANALYTICS
============================================ */
export const getRevenueAnalytics = async () => {
  // By payment mode
  const byPaymentMode = await prisma.ride.groupBy({
    by: ["paymentMode"],
    where: { status: "COMPLETED" },
    _count: true,
    _sum: { totalFare: true, commission: true },
  });

  // Last 30 days daily
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentRides = await prisma.ride.findMany({
    where: {
      status: "COMPLETED",
      createdAt: { gte: thirtyDaysAgo },
    },
    select: {
      totalFare: true,
      commission: true,
      riderEarnings: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const dailyRevenue: Record<string, { revenue: number; commission: number; rides: number }> = {};
  recentRides.forEach((ride) => {
    const dateKey = ride.createdAt.toISOString().split("T")[0];
    if (!dailyRevenue[dateKey]) {
      dailyRevenue[dateKey] = { revenue: 0, commission: 0, rides: 0 };
    }
    dailyRevenue[dateKey].revenue += ride.totalFare || 0;
    dailyRevenue[dateKey].commission += ride.commission || 0;
    dailyRevenue[dateKey].rides += 1;
  });

  return {
    byPaymentMode: byPaymentMode.map((pm) => ({
      mode: pm.paymentMode,
      count: pm._count,
      revenue: pm._sum.totalFare || 0,
      commission: pm._sum.commission || 0,
    })),
    dailyRevenue: Object.entries(dailyRevenue).map(([date, data]) => ({
      date,
      ...data,
    })),
  };
};

/* ============================================
    ADMIN RIDE ANALYTICS
============================================ */
export const getRideAnalytics = async () => {
  // Status distribution
  const statusDistribution = await prisma.ride.groupBy({
    by: ["status"],
    _count: true,
  });

  // By vehicle type
  const byVehicleType = await prisma.ride.groupBy({
    by: ["vehicleTypeId"],
    where: { vehicleTypeId: { not: null } },
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

  // Manual vs app bookings
  const [manualBookings, appBookings] = await Promise.all([
    prisma.ride.count({ where: { isManualBooking: true } }),
    prisma.ride.count({ where: { isManualBooking: false } }),
  ]);

  return {
    statusDistribution: statusDistribution.map((s) => ({
      status: s.status,
      count: s._count,
    })),
    byVehicleType: byVehicleType.map((vt) => ({
      vehicleTypeId: vt.vehicleTypeId,
      vehicleType: vehicleTypeMap.get(vt.vehicleTypeId || "") || null,
      count: vt._count,
      revenue: vt._sum.totalFare || 0,
    })),
    bookingType: {
      manual: manualBookings,
      app: appBookings,
    },
  };
};

/* ============================================
    ADMIN ENTITY STATUS OVERVIEW
============================================ */
export const getEntityStatusOverview = async () => {
  const [vendorStatus, partnerStatus, corporateStatus] = await Promise.all([
    prisma.vendor.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.partner.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.corporate.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  return {
    vendors: vendorStatus.map((s) => ({ status: s.status, count: s._count })),
    partners: partnerStatus.map((s) => ({ status: s.status, count: s._count })),
    corporates: corporateStatus.map((s) => ({ status: s.status, count: s._count })),
  };
};

/* ============================================
    ADMIN RECENT ACTIVITY
============================================ */
export const getRecentActivity = async (limit: number = 20) => {
  const [recentRides, recentVendors, recentPartners, recentUsers] = await Promise.all([
    prisma.ride.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        customId: true,
        status: true,
        totalFare: true,
        createdAt: true,
        user: { select: { id: true, name: true } },
        partner: { select: { id: true, customId: true, name: true } },
      },
    }),
    prisma.vendor.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        customId: true,
        name: true,
        companyName: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.partner.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        customId: true,
        name: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        phone: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    recentRides,
    recentVendors,
    recentPartners,
    recentUsers,
  };
};

