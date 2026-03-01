import { prisma } from "../../config/prisma";
import jwt from "jsonwebtoken";
import { hashPassword, comparePassword } from "../../utils/hash";
import { generateEntityCustomId } from "../city/city.service";
import { validatePhoneNumber } from "../../utils/phoneValidation";

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
  state?: string;
  area?: string;
  headOfficeAddress?: string;
  branchOfficeAddress?: string;
  gstNumber?: string;
  panNumber?: string;
  comments?: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  ownerAadhaar?: string;
  ownerPan?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  primaryContactNumber?: string;
  secondaryContactName?: string;
  secondaryContactNumber?: string;
  secondaryContactEmail?: string;
  financeContactName?: string;
  financeContactNumber?: string;
  financeContactEmail?: string;
  accountHolderName?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchAddress?: string;
  upiLinkedNumber?: string;
  agentId?: string;
  cityCodeId?: string;  // For custom ID generation
}) => {
  // Validate phone number format (E.164)
  validatePhoneNumber(data.phone);

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

  // Generate custom ID if cityCodeId provided
  let customId = null;
  if (data.cityCodeId) {
    const cityCode = await prisma.cityCode.findUnique({
      where: { id: data.cityCodeId },
    });
    if (!cityCode) throw new Error("Invalid city code ID");
    customId = await generateEntityCustomId(cityCode.code, "CORPORATE");
  }

  // Hash password
  const hashedPassword = await hashPassword(data.password);

  // Create corporate
  const corporate = await prisma.corporate.create({
    data: {
      customId,
      companyName: data.companyName,
      contactPerson: data.contactPerson,
      phone: data.phone,
      email: data.email,
      password: hashedPassword,
      address: data.address || null,
      state: data.state || null,
      area: data.area || null,
      headOfficeAddress: data.headOfficeAddress || null,
      branchOfficeAddress: data.branchOfficeAddress || null,
      gstNumber: data.gstNumber || null,
      panNumber: data.panNumber || null,
      comments: data.comments || null,
      ownerName: data.ownerName || null,
      ownerPhone: data.ownerPhone || null,
      ownerEmail: data.ownerEmail || null,
      ownerAadhaar: data.ownerAadhaar || null,
      ownerPan: data.ownerPan || null,
      primaryContactName: data.primaryContactName || null,
      primaryContactEmail: data.primaryContactEmail || null,
      primaryContactNumber: data.primaryContactNumber || null,
      secondaryContactName: data.secondaryContactName || null,
      secondaryContactNumber: data.secondaryContactNumber || null,
      secondaryContactEmail: data.secondaryContactEmail || null,
      financeContactName: data.financeContactName || null,
      financeContactNumber: data.financeContactNumber || null,
      financeContactEmail: data.financeContactEmail || null,
      accountHolderName: data.accountHolderName || null,
      bankName: data.bankName || null,
      accountNumber: data.accountNumber || null,
      ifscCode: data.ifscCode || null,
      branchAddress: data.branchAddress || null,
      upiLinkedNumber: data.upiLinkedNumber || null,
      agentId: data.agentId || null,
      cityCodeId: data.cityCodeId || null,
    },
    include: {
      agent: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      cityCode: {
        select: {
          id: true,
          code: true,
          cityName: true,
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
      cityCode: {
        select: {
          id: true,
          code: true,
          cityName: true,
        },
      },
      agent: {
        select: {
          id: true,
          customId: true,
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
    state?: string;
    area?: string;
    headOfficeAddress?: string;
    branchOfficeAddress?: string;
    gstNumber?: string;
    panNumber?: string;
    comments?: string;
    ownerName?: string;
    ownerPhone?: string;
    ownerEmail?: string;
    ownerAadhaar?: string;
    ownerPan?: string;
    primaryContactName?: string;
    primaryContactEmail?: string;
    primaryContactNumber?: string;
    secondaryContactName?: string;
    secondaryContactNumber?: string;
    secondaryContactEmail?: string;
    financeContactName?: string;
    financeContactNumber?: string;
    financeContactEmail?: string;
    accountHolderName?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    branchAddress?: string;
    upiLinkedNumber?: string;
  }
) => {
  const corporate = await prisma.corporate.update({
    where: { id: corporateId },
    data: {
      ...(data.companyName && { companyName: data.companyName }),
      ...(data.contactPerson && { contactPerson: data.contactPerson }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.state !== undefined && { state: data.state }),
      ...(data.area !== undefined && { area: data.area }),
      ...(data.headOfficeAddress !== undefined && { headOfficeAddress: data.headOfficeAddress }),
      ...(data.branchOfficeAddress !== undefined && { branchOfficeAddress: data.branchOfficeAddress }),
      ...(data.gstNumber !== undefined && { gstNumber: data.gstNumber }),
      ...(data.panNumber !== undefined && { panNumber: data.panNumber }),
      ...(data.comments !== undefined && { comments: data.comments }),
      ...(data.ownerName !== undefined && { ownerName: data.ownerName }),
      ...(data.ownerPhone !== undefined && { ownerPhone: data.ownerPhone }),
      ...(data.ownerEmail !== undefined && { ownerEmail: data.ownerEmail }),
      ...(data.ownerAadhaar !== undefined && { ownerAadhaar: data.ownerAadhaar }),
      ...(data.ownerPan !== undefined && { ownerPan: data.ownerPan }),
      ...(data.primaryContactName !== undefined && { primaryContactName: data.primaryContactName }),
      ...(data.primaryContactEmail !== undefined && { primaryContactEmail: data.primaryContactEmail }),
      ...(data.primaryContactNumber !== undefined && { primaryContactNumber: data.primaryContactNumber }),
      ...(data.secondaryContactName !== undefined && { secondaryContactName: data.secondaryContactName }),
      ...(data.secondaryContactNumber !== undefined && { secondaryContactNumber: data.secondaryContactNumber }),
      ...(data.secondaryContactEmail !== undefined && { secondaryContactEmail: data.secondaryContactEmail }),
      ...(data.financeContactName !== undefined && { financeContactName: data.financeContactName }),
      ...(data.financeContactNumber !== undefined && { financeContactNumber: data.financeContactNumber }),
      ...(data.financeContactEmail !== undefined && { financeContactEmail: data.financeContactEmail }),
      ...(data.accountHolderName !== undefined && { accountHolderName: data.accountHolderName }),
      ...(data.bankName !== undefined && { bankName: data.bankName }),
      ...(data.accountNumber !== undefined && { accountNumber: data.accountNumber }),
      ...(data.ifscCode !== undefined && { ifscCode: data.ifscCode }),
      ...(data.branchAddress !== undefined && { branchAddress: data.branchAddress }),
      ...(data.upiLinkedNumber !== undefined && { upiLinkedNumber: data.upiLinkedNumber }),
    },
    include: {
      agent: {
        select: {
          id: true,
          customId: true,
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
