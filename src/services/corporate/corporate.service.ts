import { prisma } from "../../config/prisma";
import { EntityStatus, PaymentMode, PaymentStatus } from "@prisma/client";

/* ============================================
    GET ALL CORPORATES
============================================ */
export const getAllCorporates = async (filters?: {
  status?: EntityStatus;
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
      { companyName: { contains: filters.search, mode: "insensitive" } },
      { contactPerson: { contains: filters.search, mode: "insensitive" } },
      { phone: { contains: filters.search } },
      { email: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const corporates = await prisma.corporate.findMany({
    where,
    select: {
      id: true,
      customId: true,
      companyName: true,
      contactPerson: true,
      phone: true,
      email: true,
      address: true,
      gstNumber: true,
      status: true,
      creditLimit: true,
      creditUsed: true,
      creditBalance: true,
      agent: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      _count: {
        select: {
          rides: true,
          billings: true,
          payments: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return corporates;
};

/* ============================================
    GET CORPORATE BY ID
============================================ */
export const getCorporateById = async (corporateId: string) => {
  const corporate = await prisma.corporate.findUnique({
    where: { id: corporateId },
    include: {
      agent: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
      _count: {
        select: {
          rides: true,
          billings: true,
          payments: true,
        },
      },
    },
  });

  if (!corporate) throw new Error("Corporate not found");

  // Remove password from response
  const { password, ...corporateWithoutPassword } = corporate;
  return corporateWithoutPassword;
};

/* ============================================
    UPDATE CORPORATE STATUS (Admin)
============================================ */
export const updateCorporateStatus = async (corporateId: string, status: EntityStatus) => {
  const corporate = await prisma.corporate.update({
    where: { id: corporateId },
    data: { status },
    select: {
      id: true,
      companyName: true,
      status: true,
      updatedAt: true,
    },
  });

  return corporate;
};

/* ============================================
    UPDATE CORPORATE CREDIT LIMIT
============================================ */
export const updateCorporateCreditLimit = async (corporateId: string, creditLimit: number) => {
  const corporate = await prisma.corporate.findUnique({
    where: { id: corporateId },
  });

  if (!corporate) throw new Error("Corporate not found");

  // Calculate new credit balance
  const newCreditBalance = creditLimit - corporate.creditUsed;

  const updatedCorporate = await prisma.corporate.update({
    where: { id: corporateId },
    data: {
      creditLimit,
      creditBalance: newCreditBalance > 0 ? newCreditBalance : 0,
    },
    select: {
      id: true,
      companyName: true,
      creditLimit: true,
      creditUsed: true,
      creditBalance: true,
      updatedAt: true,
    },
  });

  return updatedCorporate;
};

/* ============================================
    UPDATE CORPORATE BY ADMIN
============================================ */
export const updateCorporateByAdmin = async (
  corporateId: string,
  data: {
    companyName?: string;
    contactPerson?: string;
    address?: string;
    gstNumber?: string;
    status?: EntityStatus;
    creditLimit?: number;
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

  // Calculate credit balance if credit limit is updated
  let creditBalance;
  if (data.creditLimit !== undefined) {
    const corporate = await prisma.corporate.findUnique({
      where: { id: corporateId },
    });
    if (corporate) {
      creditBalance = data.creditLimit - corporate.creditUsed;
      if (creditBalance < 0) creditBalance = 0;
    }
  }

  const corporate = await prisma.corporate.update({
    where: { id: corporateId },
    data: {
      ...(data.companyName && { companyName: data.companyName }),
      ...(data.contactPerson && { contactPerson: data.contactPerson }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.gstNumber !== undefined && { gstNumber: data.gstNumber }),
      ...(data.status && { status: data.status }),
      ...(data.creditLimit !== undefined && { creditLimit: data.creditLimit }),
      ...(creditBalance !== undefined && { creditBalance }),
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
  const { password, ...corporateWithoutPassword } = corporate;
  return corporateWithoutPassword;
};

/* ============================================
    GET CORPORATE RIDES
============================================ */
export const getCorporateRides = async (corporateId: string, filters?: {
  status?: string;
  startDate?: Date;
  endDate?: Date;
}) => {
  const where: any = { corporateId };

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
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return rides;
};

/* ============================================
    GET DASHBOARD STATS
============================================ */
export const getDashboardStats = async (corporateId: string) => {
  const corporate = await prisma.corporate.findUnique({
    where: { id: corporateId },
    select: { creditLimit: true, creditUsed: true }
  });

  const employeeCount = await prisma.corporateEmployee.count({
    where: { corporateId }
  });

  const activeRides = await prisma.ride.count({
    where: { 
      corporateId,
      status: { in: ["ASSIGNED", "STARTED", "ARRIVED", "ONGOING"] }
    }
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthlyRides = await prisma.ride.aggregate({
    where: {
      corporateId,
      createdAt: { gte: startOfMonth }
    },
    _sum: { totalFare: true }
  });

  const pendingReports = await prisma.corporateBilling.count({
    where: {
      corporateId,
      status: "PENDING"
    }
  });

  return {
    employeeCount,
    activeRides,
    monthlySpend: monthlyRides._sum.totalFare || 0,
    pendingReports,
    creditLimit: corporate?.creditLimit || 0,
    creditUsed: corporate?.creditUsed || 0
  };
};

/* ============================================
    BOOK RIDE FOR EMPLOYEE
============================================ */
export const bookCorporateRide = async (corporateId: string, data: {
  employeeId: string;
  vehicleTypeId: string;
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  dropLat: number;
  dropLng: number;
  dropAddress: string;
  distanceKm: number;
  scheduledDateTime?: Date;
  cityCodeId: string;
  guestName?: string;
  guestPhone?: string;
  bookingNotes?: string;
}) => {
  // Validate Employee
  const employee = await prisma.corporateEmployee.findFirst({
    where: { id: data.employeeId, corporateId }
  });
  if (!employee) throw new Error("Employee not found");

  // Validate Corporate Credit
  const corporate = await prisma.corporate.findUnique({
    where: { id: corporateId }
  });
  if (!corporate) throw new Error("Corporate not found");

  const cityCodeEntry = await prisma.cityCode.findUnique({ where: { id: data.cityCodeId }});
  if (!cityCodeEntry) throw new Error("Invalid city code");

  // Pricing (simplified for corporate booking)
  const vehicleType = await prisma.vehicleType.findUnique({ where: { id: data.vehicleTypeId } });
  if (!vehicleType) throw new Error("Vehicle type not found");

  const pricingConfig = await prisma.pricingConfig.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });
  if (!pricingConfig) throw new Error("Pricing configuration missing");

  let baseFare = vehicleType.baseFare || pricingConfig.baseFare || 20;
  let perKmPrice = vehicleType.pricePerKm || 10;
  let totalFare = Math.round(baseFare + (data.distanceKm * perKmPrice));

  if (corporate.status === "ACTIVE" && (corporate.creditUsed + totalFare) > corporate.creditLimit) {
    // throw new Error("Insufficient credit limit"); // Optional logic
  }

  const { generateEntityCustomId } = await import("../city/city.service");
  const customId = await generateEntityCustomId(cityCodeEntry.code, "RIDE");

  const ride = await prisma.ride.create({
    data: {
      corporateId,
      corporateEmployeeId: employee.id,
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
      status: "UPCOMING",
      isManualBooking: true,
      scheduledDateTime: data.scheduledDateTime || new Date(),
      cityCodeId: data.cityCodeId,
      customId,
      paymentMode: "CREDIT",
      riderEarnings: Math.round((totalFare * pricingConfig.riderPercentage) / 100),
      commission: Math.round((totalFare * pricingConfig.appCommission) / 100),
      bookingNotes: data.bookingNotes ? (data.guestName ? `Guest: ${data.guestName} (${data.guestPhone}) | Notes: ${data.bookingNotes}` : data.bookingNotes) : (data.guestName ? `Guest: ${data.guestName} (${data.guestPhone})` : null)
    }
  });

  // Update corporate credit used
  await prisma.corporate.update({
    where: { id: corporateId },
    data: {
      creditUsed: { increment: totalFare },
      creditBalance: { decrement: totalFare }
    }
  });

  return ride;
};

/* ============================================
    DELETE CORPORATE
============================================ */
export const deleteCorporate = async (corporateId: string) => {
  // Check if corporate has rides
  const rideCount = await prisma.ride.count({
    where: { corporateId },
  });

  if (rideCount > 0) {
    throw new Error("Cannot delete corporate with existing rides. Consider suspending instead.");
  }

  // Check if corporate has billings
  const billingCount = await prisma.corporateBilling.count({
    where: { corporateId },
  });

  if (billingCount > 0) {
    throw new Error("Cannot delete corporate with existing billings.");
  }

  await prisma.corporate.delete({
    where: { id: corporateId },
  });

  return { message: "Corporate deleted successfully" };
};

/* ============================================
    EMPLOYEE MANAGEMENT
============================================ */

export const getCorporateEmployees = async (corporateId: string) => {
  return await prisma.corporateEmployee.findMany({
    where: { corporateId },
    orderBy: { createdAt: "desc" },
  });
};

export const addCorporateEmployee = async (corporateId: string, data: {
  name: string;
  email: string;
  department?: string;
  spendingLimit?: number;
}) => {
  return await prisma.corporateEmployee.create({
    data: {
      corporateId,
      name: data.name,
      email: data.email,
      department: data.department,
      spendingLimit: data.spendingLimit || 0,
    },
  });
};

export const deleteCorporateEmployee = async (employeeId: string, corporateId: string) => {
  return await prisma.corporateEmployee.delete({
    where: { 
      id: employeeId,
      corporateId: corporateId // Security: Ensure it belongs to this corporate
    },
  });
};
