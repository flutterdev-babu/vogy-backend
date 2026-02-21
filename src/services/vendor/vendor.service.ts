import { prisma } from "../../config/prisma";
import { EntityStatus, VerificationStatus } from "@prisma/client";

/* ============================================
    GET ALL VENDORS
============================================ */
export const getAllVendors = async (filters?: {
  status?: EntityStatus;
  verificationStatus?: VerificationStatus;
  agentId?: string;
  search?: string;
  includeDeleted?: boolean;
  cityCodeId?: string;
  vendorId?: string; // Support filtering by ID or CustomID
  type?: "INDIVIDUAL" | "BUSINESS";
}) => {
  const where: any = {
    isDeleted: filters?.includeDeleted ? undefined : { not: true },
  };

  if (filters?.type) {
    where.type = filters.type;
  }

  if (filters?.vendorId) {
    where.OR = [
      { id: filters.vendorId },
      { customId: filters.vendorId }
    ];
  }

  if (filters?.cityCodeId) {
    where.cityCodeId = filters.cityCodeId;
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.agentId) {
    where.agentId = filters.agentId;
  }

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { companyName: { contains: filters.search, mode: "insensitive" } },
      { phone: { contains: filters.search } },
      { email: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const vendors = await prisma.vendor.findMany({
    where,
    select: {
      id: true,
      customId: true,
      name: true,
      companyName: true,
      phone: true,
      email: true,
      address: true,
      status: true,
      verificationStatus: true,
      gstNumber: true,
      panNumber: true,
      agent: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      _count: {
        select: {
          vehicles: true,
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

  return vendors;
};

/* ============================================
    GET VENDOR BY ID
============================================ */
export const getVendorById = async (vendorId: string) => {
  const vendor = await prisma.vendor.findFirst({
    where: { id: vendorId, isDeleted: false },
    include: {
      agent: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
      vehicles: {
        include: {
          vehicleType: {
            select: {
              id: true,
              name: true,
              displayName: true,
              category: true,
              pricePerKm: true,
            },
          },
          partner: {
            select: {
              id: true,
              name: true,
              phone: true,
              status: true,
              isOnline: true,
            },
          },
        },
      },
      _count: {
        select: {
          rides: true,
          vehicles: true,
        },
      },
    },
  });

  if (!vendor) throw new Error("Vendor not found");

  // Remove password from response
  const { password, ...vendorWithoutPassword } = vendor;
  return vendorWithoutPassword;
};

/* ============================================
    UPDATE VENDOR STATUS (Admin)
============================================ */
export const updateVendorStatus = async (vendorId: string, status: EntityStatus, adminId?: string) => {
  const vendor = await prisma.vendor.update({
    where: { id: vendorId },
    data: { 
      status,
      ...(adminId && { updatedByAdminId: adminId })
    },
    select: {
      id: true,
      name: true,
      companyName: true,
      phone: true,
      status: true,
      customId: true,
      updatedAt: true,
    },
  });

  return vendor;
};

/* ============================================
    UPDATE VENDOR VERIFICATION (Admin)
============================================ */
export const updateVendorVerification = async (vendorId: string, verificationStatus: VerificationStatus, adminId?: string) => {
  const vendor = await prisma.vendor.update({
    where: { id: vendorId },
    data: { 
      verificationStatus,
      ...(adminId && { updatedByAdminId: adminId })
    },
    select: {
      id: true,
      name: true,
      companyName: true,
      verificationStatus: true,
      customId: true,
      updatedAt: true,
    },
  });

  return vendor;
};

/* ============================================
    UPDATE VENDOR BY ADMIN
============================================ */
export const updateVendorByAdmin = async (
  vendorId: string,
  data: {
    name?: string;
    companyName?: string;
    email?: string;
    address?: string;
    status?: EntityStatus;
    verificationStatus?: VerificationStatus;
    agentId?: string | null;
    
    // Additional contact details
    gstNumber?: string;
    panNumber?: string;
    ccMobile?: string;
    primaryNumber?: string;
    secondaryNumber?: string;
    ownerContact?: string;
    officeLandline?: string;
    officeAddress?: string;
    accountNumber?: string;
    
    updatedByAdminId?: string;
  }
) => {
  // Validate agentId if provided
  if (data.agentId) {
    const agent = await prisma.agent.findUnique({
      where: { id: data.agentId },
    });
    if (!agent) throw new Error("Invalid agent ID");
  }

  const { updatedByAdminId, ...updateData } = data;

  const vendor = await prisma.vendor.update({
    where: { id: vendorId },
    data: {
      ...updateData,
      ...(updatedByAdminId && { updatedByAdminId }),
    },
    include: {
      agent: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  });

  // Remove password from response
  const { password, ...vendorWithoutPassword } = vendor;
  return vendorWithoutPassword;
};

/* ============================================
    GET VENDOR VEHICLES
============================================ */
export const getVendorVehicles = async (vendorId: string) => {
  const vehicles = await prisma.vehicle.findMany({
    where: { vendorId },
    include: {
      vehicleType: {
        select: {
          id: true,
          name: true,
          displayName: true,
          category: true,
          pricePerKm: true,
        },
      },
      partner: {
        select: {
          id: true,
          name: true,
          phone: true,
          status: true,
          isOnline: true,
        },
      },
      _count: {
        select: {
          rides: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return vehicles;
};

/* ============================================
    GET VENDOR RIDES
============================================ */
export const getVendorRides = async (vendorId: string, filters?: {
  status?: string;
  startDate?: Date;
  endDate?: Date;
}) => {
  const where: any = {
    OR: [
      { vendorId: vendorId },
      { 
        partner: {
          vehicle: {
            vendorId: vendorId
          }
        }
      }
    ]
  };

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
      partner: {
        select: {
          id: true,
          customId: true,
          name: true,
          phone: true,
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
    GET VENDOR ANALYTICS
============================================ */
export const getVendorAnalytics = async (vendorId: string) => {
  // Get vehicle counts
  const [totalVehicles, availableVehicles] = await Promise.all([
    prisma.vehicle.count({ where: { vendorId } }),
    prisma.vehicle.count({ where: { vendorId, isAvailable: true } }),
  ]);

  // Get ride counts
  const [totalRides, completedRides, cancelledRides, pendingRides] = await Promise.all([
    prisma.ride.count({ where: { vendorId } }),
    prisma.ride.count({ where: { vendorId, status: "COMPLETED" } }),
    prisma.ride.count({ where: { vendorId, status: "CANCELLED" } }),
    prisma.ride.count({ where: { vendorId, status: "PENDING" } }),
  ]);

  // Get revenue stats
  const revenueData = await prisma.ride.aggregate({
    where: { vendorId, status: "COMPLETED" },
    _sum: {
      totalFare: true,
      riderEarnings: true,
      commission: true,
    },
  });

  // Get partner counts
  const partnerCount = await prisma.partner.count({
    where: {
      vehicle: {
        vendorId,
      },
    },
  });

  // Get rides by payment mode
  const ridesByPaymentMode = await prisma.ride.groupBy({
    by: ["paymentMode"],
    where: { vendorId, status: "COMPLETED" },
    _count: true,
    _sum: {
      totalFare: true,
    },
  });

  return {
    vehicles: {
      total: totalVehicles,
      available: availableVehicles,
      inUse: totalVehicles - availableVehicles,
    },
    partners: partnerCount,
    rides: {
      total: totalRides,
      completed: completedRides,
      cancelled: cancelledRides,
      pending: pendingRides,
    },
    revenue: {
      total: revenueData._sum.totalFare || 0,
      earnings: revenueData._sum.riderEarnings || 0,
      commission: revenueData._sum.commission || 0,
    },
    ridesByPaymentMode,
  };
};

/* ============================================
    DELETE VENDOR
============================================ */
export const deleteVendor = async (vendorId: string, adminId?: string) => {
  // Soft delete
  await prisma.vendor.update({
    where: { id: vendorId },
    data: { 
      isDeleted: true,
      status: "BANNED",
      ...(adminId && { updatedByAdminId: adminId })
    },
  });

  return { message: "Vendor soft-deleted successfully" };
};

/* ============================================
    VENDOR DASHBOARD (Vendor's own view)
============================================ */
export const getVendorDashboard = async (vendorId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalVehicles,
    availableVehicles,
    totalPartners,
    onlinePartners,
    totalRides,
    completedRides,
    cancelledRides,
    activeRides,
    todayRides,
    revenueData,
  ] = await Promise.all([
    prisma.vehicle.count({ where: { vendorId } }),
    prisma.vehicle.count({ where: { vendorId, isAvailable: true } }),
    prisma.partner.count({ where: { vendorId } }),
    prisma.partner.count({ where: { vendorId, isOnline: true } }),
    prisma.ride.count({ where: { vendorId } }),
    prisma.ride.count({ where: { vendorId, status: "COMPLETED" } }),
    prisma.ride.count({ where: { vendorId, status: "CANCELLED" } }),
    prisma.ride.count({
      where: {
        vendorId,
        status: { in: ["ACCEPTED", "ASSIGNED", "STARTED", "ARRIVED", "ONGOING"] },
      },
    }),
    prisma.ride.count({
      where: { vendorId, createdAt: { gte: today } },
    }),
    prisma.ride.aggregate({
      where: { vendorId, status: "COMPLETED" },
      _sum: { totalFare: true, riderEarnings: true, commission: true },
    }),
  ]);

  // Today's revenue
  const todayRevenue = await prisma.ride.aggregate({
    where: { vendorId, status: "COMPLETED", createdAt: { gte: today } },
    _sum: { totalFare: true },
  });

  return {
    vehicles: {
      total: totalVehicles,
      available: availableVehicles,
      inUse: totalVehicles - availableVehicles,
    },
    partners: {
      total: totalPartners,
      online: onlinePartners,
      offline: totalPartners - onlinePartners,
    },
    rides: {
      total: totalRides,
      completed: completedRides,
      cancelled: cancelledRides,
      active: activeRides,
      today: todayRides,
    },
    revenue: {
      total: revenueData._sum.totalFare || 0,
      earnings: revenueData._sum.riderEarnings || 0,
      commission: revenueData._sum.commission || 0,
      today: todayRevenue._sum.totalFare || 0,
    },
  };
};

/* ============================================
    GET VENDOR ATTACHMENTS (Vendor's own)
============================================ */
export const getVendorAttachments = async (vendorId: string) => {
  return await prisma.attachment.findMany({
    where: { 
      referenceId: vendorId,
      referenceType: "VENDOR" 
    },
    orderBy: { createdAt: "desc" },
  });
};

/* ============================================
    GET VENDOR RIDE BY ID (Scoped to vendor)
============================================ */
export const getVendorRideById = async (vendorId: string, rideId: string) => {
  const ride = await prisma.ride.findFirst({
    where: {
      id: rideId,
      vendorId: vendorId,
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

  if (!ride) throw new Error("Ride not found or does not belong to this vendor");
  return ride;
};

/* ============================================
    GET VENDOR EARNINGS SUMMARY
============================================ */
export const getVendorEarnings = async (vendorId: string, period?: string) => {
  // Overall earnings
  const totalEarnings = await prisma.ride.aggregate({
    where: { vendorId, status: "COMPLETED" },
    _sum: { totalFare: true, riderEarnings: true, commission: true },
    _count: true,
  });

  // By payment mode
  const byPaymentMode = await prisma.ride.groupBy({
    by: ["paymentMode"],
    where: { vendorId, status: "COMPLETED" },
    _count: true,
    _sum: { totalFare: true },
  });

  // Last 30 days daily breakdown
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentRides = await prisma.ride.findMany({
    where: {
      vendorId,
      status: "COMPLETED",
      createdAt: { gte: thirtyDaysAgo },
    },
    select: {
      totalFare: true,
      riderEarnings: true,
      commission: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Group by date
  const dailyBreakdown: Record<string, { revenue: number; rides: number }> = {};
  recentRides.forEach((ride) => {
    const dateKey = ride.createdAt.toISOString().split("T")[0];
    if (!dailyBreakdown[dateKey]) {
      dailyBreakdown[dateKey] = { revenue: 0, rides: 0 };
    }
    dailyBreakdown[dateKey].revenue += ride.totalFare || 0;
    dailyBreakdown[dateKey].rides += 1;
  });

  return {
    total: {
      revenue: totalEarnings._sum.totalFare || 0,
      partnerEarnings: totalEarnings._sum.riderEarnings || 0,
      commission: totalEarnings._sum.commission || 0,
      completedRides: totalEarnings._count,
    },
    byPaymentMode: byPaymentMode.map((pm) => ({
      mode: pm.paymentMode,
      count: pm._count,
      amount: pm._sum.totalFare || 0,
    })),
    dailyBreakdown: Object.entries(dailyBreakdown).map(([date, data]) => ({
      date,
      ...data,
    })),
  };
};
