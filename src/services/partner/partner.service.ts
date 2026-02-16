import { prisma } from "../../config/prisma";
import { PartnerStatus } from "@prisma/client";

/* ============================================
    GET ALL PARTNERS
============================================ */
export const getAllPartners = async (filters?: {
  status?: PartnerStatus;
  vendorId?: string;
  isOnline?: boolean;
  search?: string;
}) => {
  const where: any = {};

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.vendorId) {
    where.vehicle = {
      vendorId: filters.vendorId,
    };
  }

  if (filters?.isOnline !== undefined) {
    where.isOnline = filters.isOnline;
  }

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { phone: { contains: filters.search } },
      { email: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const partners = await prisma.partner.findMany({
    where,
    select: {
      id: true,
      customId: true,
      name: true,
      phone: true,
      email: true,
      profileImage: true,
      aadharNumber: true,
      licenseNumber: true,
      status: true,
      isOnline: true,
      currentLat: true,
      currentLng: true,
      rating: true,
      totalEarnings: true,
      hasOwnVehicle: true,
      ownVehicleNumber: true,
      ownVehicleModel: true,
      ownVehicleTypeId: true,
      ownVehicleType: {
        select: {
          id: true,
          name: true,
          displayName: true,
          category: true,
        }
      },
      vehicle: {
        select: {
          id: true,
          registrationNumber: true,
          vehicleModel: true,
          vendor: {
            select: {
              id: true,
              customId: true,
              name: true,
              companyName: true,
            },
          },
          vehicleType: {
            select: {
              id: true,
              name: true,
              displayName: true,
              category: true,
            },
          },
        },
      },
      _count: {
        select: {
          rides: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return partners;
};

/* ============================================
    GET PARTNER BY ID
============================================ */
export const getPartnerById = async (partnerId: string) => {
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    include: {
      vehicle: {
        include: {
          vendor: {
            select: {
              id: true,
              customId: true,
              name: true,
              companyName: true,
              phone: true,
            },
          },
          vehicleType: {
            select: {
              id: true,
              name: true,
              displayName: true,
              category: true,
              pricePerKm: true,
            },
          },
        },
      },
      ownVehicleType: true,
      cityCode: true,
      _count: {
        select: {
          rides: true,
        },
      },
    },
  });

  if (!partner) throw new Error("Partner not found");

  // Remove password from response
  const { password, ...partnerWithoutPassword } = partner;
  return partnerWithoutPassword;
};

/* ============================================
    UPDATE PARTNER STATUS (Admin)
============================================ */
export const updatePartnerStatus = async (partnerId: string, status: PartnerStatus) => {
  const partner = await prisma.partner.update({
    where: { id: partnerId },
    data: { status },
    select: {
      id: true,
      name: true,
      phone: true,
      status: true,
      customId: true,
      updatedAt: true,
    },
  });

  return partner;
};

/* ============================================
    UPDATE PARTNER BY ADMIN
============================================ */
export const updatePartnerByAdmin = async (
  partnerId: string,
  data: {
    name?: string;
    email?: string;
    aadharNumber?: string;
    licenseNumber?: string;
    licenseImage?: string;
    status?: PartnerStatus;
  }
) => {
  const partner = await prisma.partner.update({
    where: { id: partnerId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.aadharNumber !== undefined && { aadharNumber: data.aadharNumber }),
      ...(data.licenseNumber !== undefined && { licenseNumber: data.licenseNumber }),
      ...(data.licenseImage !== undefined && { licenseImage: data.licenseImage }),
      ...(data.status && { status: data.status }),
    },
    include: {
      vehicle: {
        include: {
          vendor: {
            select: {
              id: true,
              customId: true, // ADDED
              name: true,
              companyName: true,
            },
          },
          vehicleType: {
            select: {
              id: true,
              name: true,
              displayName: true,
            },
          },
        },
      },
    },
  });

  // Remove password from response
  const { password, ...partnerWithoutPassword } = partner;
  return partnerWithoutPassword;
};

/* ============================================
    ASSIGN PARTNER TO VEHICLE
============================================ */
export const assignPartnerToVehicle = async (partnerId: string, vehicleId: string) => {
  // Check if partner exists
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
  });
  if (!partner) throw new Error("Partner not found");

  // Check if vehicle exists
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: {
      partner: true,
    },
  });
  if (!vehicle) throw new Error("Vehicle not found");

  // Check if vehicle is already assigned to another partner
  if (vehicle.partner && vehicle.partner.id !== partnerId) {
    throw new Error("Vehicle is already assigned to another partner");
  }

  // Check if partner is already assigned to another vehicle
  if (partner.vehicleId && partner.vehicleId !== vehicleId) {
    throw new Error("Partner is already assigned to another vehicle. Unassign first.");
  }

  // Assign partner to vehicle
  const updatedPartner = await prisma.partner.update({
    where: { id: partnerId },
    data: { vehicleId },
    include: {
      vehicle: {
        include: {
          vendor: {
            select: {
              id: true,
              customId: true, // ADDED
              name: true,
              companyName: true,
            },
          },
          vehicleType: {
            select: {
              id: true,
              name: true,
              displayName: true,
            },
          },
        },
      },
    },
  });

  // Remove password from response
  const { password, ...partnerWithoutPassword } = updatedPartner;
  return partnerWithoutPassword;
};

/* ============================================
    UNASSIGN PARTNER FROM VEHICLE
============================================ */
export const unassignPartnerFromVehicle = async (partnerId: string) => {
  const partner = await prisma.partner.update({
    where: { id: partnerId },
    data: { vehicleId: null },
    select: {
      id: true,
      name: true,
      phone: true,
      vehicleId: true,
    },
  });

  return partner;
};

/* ============================================
    GET PARTNER RIDES
============================================ */
export const getPartnerRides = async (partnerId: string, filters?: {
  status?: string;
  startDate?: Date;
  endDate?: Date;
}) => {
  const where: any = { partnerId };

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  const rides = await prisma.ride.findMany({
    where,
    include: {
      vendor: {
        select: {
          id: true,
          customId: true,
          name: true,
          companyName: true,
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
        select: {
          id: true,
          name: true,
          displayName: true,
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
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return rides;
};

/* ============================================
    GET PARTNER ANALYTICS
============================================ */
export const getPartnerAnalytics = async (partnerId: string) => {
  // Get ride counts
  const [totalRides, completedRides, cancelledRides] = await Promise.all([
    prisma.ride.count({ where: { partnerId } }),
    prisma.ride.count({ where: { partnerId, status: "COMPLETED" } }),
    prisma.ride.count({ where: { partnerId, status: "CANCELLED" } }),
  ]);

  // Get earnings
  const earningsData = await prisma.ride.aggregate({
    where: { partnerId, status: "COMPLETED" },
    _sum: {
      riderEarnings: true,
      totalFare: true,
    },
  });

  // Get partner details
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    select: {
      rating: true,
      totalEarnings: true,
    },
  });

  return {
    rides: {
      total: totalRides,
      completed: completedRides,
      cancelled: cancelledRides,
      completionRate: totalRides > 0 ? ((completedRides / totalRides) * 100).toFixed(2) : 0,
    },
    earnings: {
      sessionEarnings: earningsData._sum.riderEarnings || 0,
      totalFare: earningsData._sum.totalFare || 0,
      totalEarnings: partner?.totalEarnings || 0,
    },
    rating: partner?.rating || 5,
  };
};

/* ============================================
    GET AVAILABLE PARTNERS
============================================ */
export const getAvailablePartners = async (vehicleTypeId?: string) => {
  const where: any = {
    status: "APPROVED",
    isOnline: true,
    vehicleId: { not: null },
  };

  if (vehicleTypeId) {
    where.vehicle = {
      vehicleTypeId,
      isAvailable: true,
    };
  }

  const partners = await prisma.partner.findMany({
    where,
    select: {
      id: true,
      name: true,
      phone: true,
      currentLat: true,
      currentLng: true,
      rating: true,
      vehicle: {
        select: {
          id: true,
          registrationNumber: true,
          vehicleModel: true,
          vehicleType: {
            select: {
              id: true,
              name: true,
              displayName: true,
              category: true,
            },
          },
        },
      },
    },
  });

  return partners;
};

/* ============================================
    DELETE PARTNER
============================================ */
export const deletePartner = async (partnerId: string) => {
  // Check if partner has rides
  const rideCount = await prisma.ride.count({
    where: { partnerId },
  });

  if (rideCount > 0) {
    throw new Error("Cannot delete partner with existing rides. Consider suspending instead.");
  }

  await prisma.partner.delete({
    where: { id: partnerId },
  });

  return { message: "Partner deleted successfully" };
};

/* ============================================
    PARTNER DASHBOARD (Partner's own view)
============================================ */
export const getPartnerDashboard = async (partnerId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalRides,
    completedRides,
    cancelledRides,
    activeRides,
    todayRides,
    earningsData,
    todayEarnings,
    partner,
  ] = await Promise.all([
    prisma.ride.count({ where: { partnerId } }),
    prisma.ride.count({ where: { partnerId, status: "COMPLETED" } }),
    prisma.ride.count({ where: { partnerId, status: "CANCELLED" } }),
    prisma.ride.count({
      where: {
        partnerId,
        status: { in: ["ACCEPTED", "ASSIGNED", "STARTED", "ARRIVED", "ONGOING"] },
      },
    }),
    prisma.ride.count({
      where: { partnerId, createdAt: { gte: today } },
    }),
    prisma.ride.aggregate({
      where: { partnerId, status: "COMPLETED" },
      _sum: { totalFare: true, riderEarnings: true },
    }),
    prisma.ride.aggregate({
      where: { partnerId, status: "COMPLETED", createdAt: { gte: today } },
      _sum: { riderEarnings: true, totalFare: true },
    }),
    prisma.partner.findUnique({
      where: { id: partnerId },
      select: {
        isOnline: true,
        rating: true,
        totalEarnings: true,
        vehicle: {
          select: {
            id: true,
            customId: true,
            registrationNumber: true,
            vehicleModel: true,
            vehicleType: {
              select: { displayName: true, category: true },
            },
          },
        },
      },
    }),
  ]);

  return {
    status: {
      isOnline: partner?.isOnline || false,
      rating: partner?.rating || 5,
    },
    rides: {
      total: totalRides,
      completed: completedRides,
      cancelled: cancelledRides,
      active: activeRides,
      today: todayRides,
      completionRate: totalRides > 0 ? ((completedRides / totalRides) * 100).toFixed(2) : "0",
    },
    earnings: {
      total: partner?.totalEarnings || 0,
      sessionEarnings: earningsData._sum.riderEarnings || 0,
      totalFare: earningsData._sum.totalFare || 0,
      todayEarnings: todayEarnings._sum.riderEarnings || 0,
      todayFare: todayEarnings._sum.totalFare || 0,
    },
    assignedVehicle: partner?.vehicle || null,
  };
};

/* ============================================
    GET PARTNER VEHICLE INFO
============================================ */
export const getPartnerVehicleInfo = async (partnerId: string) => {
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    select: {
      vehicleId: true,
      hasOwnVehicle: true,
      ownVehicleNumber: true,
      ownVehicleModel: true,
      ownVehicleType: {
        select: {
          id: true,
          name: true,
          displayName: true,
          category: true,
        },
      },
      vehicle: {
        include: {
          vendor: {
            select: {
              id: true,
              customId: true,
              name: true,
              companyName: true,
              phone: true,
            },
          },
          vehicleType: {
            select: {
              id: true,
              name: true,
              displayName: true,
              category: true,
              pricePerKm: true,
            },
          },
        },
      },
    },
  });

  if (!partner) throw new Error("Partner not found");

  return {
    hasOwnVehicle: partner.hasOwnVehicle,
    ownVehicle: partner.hasOwnVehicle
      ? {
          number: partner.ownVehicleNumber,
          model: partner.ownVehicleModel,
          vehicleType: partner.ownVehicleType,
        }
      : null,
    assignedVehicle: partner.vehicle || null,
  };
};

/* ============================================
    GET PARTNER RIDE BY ID (Scoped to partner)
============================================ */
export const getPartnerRideById = async (partnerId: string, rideId: string) => {
  const ride = await prisma.ride.findFirst({
    where: {
      id: rideId,
      partnerId: partnerId,
    },
    include: {
      vendor: {
        select: {
          id: true,
          customId: true,
          name: true,
          companyName: true,
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
      user: {
        select: { id: true, name: true, phone: true },
      },
      corporate: {
        select: { id: true, companyName: true },
      },
    },
  });

  if (!ride) throw new Error("Ride not found or does not belong to this partner");
  return ride;
};

/* ============================================
    GET PARTNER EARNINGS SUMMARY
============================================ */
export const getPartnerEarnings = async (partnerId: string) => {
  // Overall earnings
  const totalEarnings = await prisma.ride.aggregate({
    where: { partnerId, status: "COMPLETED" },
    _sum: { totalFare: true, riderEarnings: true },
    _count: true,
  });

  // By payment mode
  const byPaymentMode = await prisma.ride.groupBy({
    by: ["paymentMode"],
    where: { partnerId, status: "COMPLETED" },
    _count: true,
    _sum: { riderEarnings: true },
  });

  // Last 30 days daily breakdown
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentRides = await prisma.ride.findMany({
    where: {
      partnerId,
      status: "COMPLETED",
      createdAt: { gte: thirtyDaysAgo },
    },
    select: {
      totalFare: true,
      riderEarnings: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Group by date
  const dailyBreakdown: Record<string, { earnings: number; rides: number }> = {};
  recentRides.forEach((ride) => {
    const dateKey = ride.createdAt.toISOString().split("T")[0];
    if (!dailyBreakdown[dateKey]) {
      dailyBreakdown[dateKey] = { earnings: 0, rides: 0 };
    }
    dailyBreakdown[dateKey].earnings += ride.riderEarnings || 0;
    dailyBreakdown[dateKey].rides += 1;
  });

  return {
    total: {
      earnings: totalEarnings._sum.riderEarnings || 0,
      totalFare: totalEarnings._sum.totalFare || 0,
      completedRides: totalEarnings._count,
    },
    byPaymentMode: byPaymentMode.map((pm) => ({
      mode: pm.paymentMode,
      count: pm._count,
      earnings: pm._sum.riderEarnings || 0,
    })),
    dailyBreakdown: Object.entries(dailyBreakdown).map(([date, data]) => ({
      date,
      ...data,
    })),
  };
};
