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
