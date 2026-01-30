import { prisma } from "../../config/prisma";
import { VendorStatus } from "@prisma/client";

/* ============================================
    GET ALL VENDORS
============================================ */
export const getAllVendors = async (filters?: {
  status?: VendorStatus;
  agentId?: string;
  search?: string;
}) => {
  const where: any = {};

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
      name: true,
      companyName: true,
      phone: true,
      email: true,
      address: true,
      profileImage: true,
      status: true,
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
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
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
export const updateVendorStatus = async (vendorId: string, status: VendorStatus) => {
  const vendor = await prisma.vendor.update({
    where: { id: vendorId },
    data: { status },
    select: {
      id: true,
      name: true,
      companyName: true,
      phone: true,
      status: true,
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
    status?: VendorStatus;
    agentId?: string | null;
  }
) => {
  // Validate agentId if provided
  if (data.agentId) {
    const agent = await prisma.agent.findUnique({
      where: { id: data.agentId },
    });
    if (!agent) throw new Error("Invalid agent ID");
  }

  const vendor = await prisma.vendor.update({
    where: { id: vendorId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.companyName && { companyName: data.companyName }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.status && { status: data.status }),
      ...(data.agentId !== undefined && { agentId: data.agentId }),
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
  const where: any = { vendorId };

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
          name: true,
          phone: true,
        },
      },
      vehicle: {
        select: {
          id: true,
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
export const deleteVendor = async (vendorId: string) => {
  // Check if vendor has vehicles
  const vehicleCount = await prisma.vehicle.count({
    where: { vendorId },
  });

  if (vehicleCount > 0) {
    throw new Error("Cannot delete vendor with existing vehicles. Please remove vehicles first.");
  }

  // Check if vendor has rides
  const rideCount = await prisma.ride.count({
    where: { vendorId },
  });

  if (rideCount > 0) {
    throw new Error("Cannot delete vendor with existing rides. Consider suspending instead.");
  }

  await prisma.vendor.delete({
    where: { id: vendorId },
  });

  return { message: "Vendor deleted successfully" };
};
