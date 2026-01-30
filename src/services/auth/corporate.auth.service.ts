import { prisma } from "../../config/prisma";
import jwt from "jsonwebtoken";
import { hashPassword, comparePassword } from "../../utils/hash";

const JWT_SECRET = process.env.JWT_SECRET || "secret_jwt";

/* ============================================
    CORPORATE REGISTRATION
============================================ */
export const registerCorporate = async (data: {
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  password: string;
  address?: string;
  gstNumber?: string;
  agentId?: string;
}) => {
  // Check if corporate already exists
  const existsByPhone = await prisma.corporate.findUnique({
    where: { phone: data.phone },
  });

  if (existsByPhone) throw new Error("Corporate with this phone already exists");

  const existsByEmail = await prisma.corporate.findUnique({
    where: { email: data.email },
  });

  if (existsByEmail) throw new Error("Corporate with this email already exists");

  // Validate agentId if provided
  if (data.agentId) {
    const agent = await prisma.agent.findUnique({
      where: { id: data.agentId },
    });
    if (!agent) throw new Error("Invalid agent ID");
  }

  // Hash password
  const hashedPassword = await hashPassword(data.password);

  // Create corporate
  const corporate = await prisma.corporate.create({
    data: {
      companyName: data.companyName,
      contactPerson: data.contactPerson,
      phone: data.phone,
      email: data.email,
      password: hashedPassword,
      address: data.address || null,
      gstNumber: data.gstNumber || null,
      agentId: data.agentId || null,
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
    CORPORATE LOGIN
============================================ */
export const loginCorporate = async (email: string, password: string) => {
  // Find corporate by email
  const corporate = await prisma.corporate.findUnique({
    where: { email },
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

  if (!corporate) throw new Error("Invalid email or password");

  // Check if corporate is suspended
  if (corporate.status === "SUSPENDED") {
    throw new Error("Your account has been suspended. Please contact support.");
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, corporate.password);
  if (!isPasswordValid) throw new Error("Invalid email or password");

  // Generate JWT
  const token = jwt.sign({ id: corporate.id, role: "CORPORATE" }, JWT_SECRET, {
    expiresIn: "7d",
  });

  // Remove password from response
  const { password: _, ...corporateWithoutPassword } = corporate;

  return {
    message: "Login successful",
    token,
    corporate: corporateWithoutPassword,
  };
};

/* ============================================
    GET CORPORATE PROFILE
============================================ */
export const getCorporateProfile = async (corporateId: string) => {
  const corporate = await prisma.corporate.findUnique({
    where: { id: corporateId },
    include: {
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
    },
  });

  if (!corporate) throw new Error("Corporate not found");

  // Remove password from response
  const { password, ...corporateWithoutPassword } = corporate;
  return corporateWithoutPassword;
};

/* ============================================
    UPDATE CORPORATE PROFILE
============================================ */
export const updateCorporateProfile = async (
  corporateId: string,
  data: {
    companyName?: string;
    contactPerson?: string;
    address?: string;
    gstNumber?: string;
  }
) => {
  const corporate = await prisma.corporate.update({
    where: { id: corporateId },
    data: {
      ...(data.companyName && { companyName: data.companyName }),
      ...(data.contactPerson && { contactPerson: data.contactPerson }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.gstNumber !== undefined && { gstNumber: data.gstNumber }),
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
export const getCorporateRides = async (corporateId: string) => {
  const rides = await prisma.ride.findMany({
    where: { corporateId },
    include: {
      vendor: {
        select: {
          id: true,
          name: true,
          companyName: true,
        },
      },
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
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return rides;
};

/* ============================================
    GET CORPORATE BILLING HISTORY
============================================ */
export const getCorporateBillingHistory = async (corporateId: string) => {
  const billings = await prisma.corporateBilling.findMany({
    where: { corporateId },
    orderBy: {
      createdAt: "desc",
    },
  });

  return billings;
};

/* ============================================
    GET CORPORATE PAYMENT HISTORY
============================================ */
export const getCorporatePaymentHistory = async (corporateId: string) => {
  const payments = await prisma.corporatePayment.findMany({
    where: { corporateId },
    orderBy: {
      createdAt: "desc",
    },
  });

  return payments;
};

/* ============================================
    GET CORPORATE BILLING SUMMARY
============================================ */
export const getCorporateBillingSummary = async (corporateId: string) => {
  const corporate = await prisma.corporate.findUnique({
    where: { id: corporateId },
    select: {
      id: true,
      companyName: true,
      creditLimit: true,
      creditUsed: true,
      creditBalance: true,
    },
  });

  if (!corporate) throw new Error("Corporate not found");

  // Get total billed and paid amounts
  const billingStats = await prisma.corporateBilling.aggregate({
    where: { corporateId },
    _sum: {
      totalAmount: true,
      paidAmount: true,
    },
  });

  // Get outstanding billings
  const outstandingBillings = await prisma.corporateBilling.findMany({
    where: {
      corporateId,
      status: { in: ["PENDING", "PARTIAL"] },
    },
    orderBy: {
      billingPeriodEnd: "asc",
    },
  });

  // Get total rides count and fare
  const rideStats = await prisma.ride.aggregate({
    where: { corporateId },
    _count: true,
    _sum: {
      totalFare: true,
    },
  });

  return {
    ...corporate,
    totalBilled: billingStats._sum.totalAmount || 0,
    totalPaid: billingStats._sum.paidAmount || 0,
    outstandingAmount: (billingStats._sum.totalAmount || 0) - (billingStats._sum.paidAmount || 0),
    outstandingBillings,
    totalRides: rideStats._count,
    totalRideFare: rideStats._sum.totalFare || 0,
  };
};
