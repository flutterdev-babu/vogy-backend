import { prisma } from "../../config/prisma";
import jwt from "jsonwebtoken";
import { hashPassword, comparePassword } from "../../utils/hash";
import { generateEntityCustomId } from "../city/city.service";
import { validatePhoneNumber } from "../../utils/phoneValidation";

const JWT_SECRET = process.env.JWT_SECRET || "secret_jwt";

/* ============================================
    VENDOR REGISTRATION
============================================ */
export const registerVendor = async (data: {
  name: string;
  companyName: string;
  phone: string;
  email?: string;
  password: string;
  address?: string;
  profileImage?: string;
  agentId?: string;
  cityCodeId?: string;  // For custom ID generation
  // New contact fields
  gstNumber?: string;
  panNumber?: string;
  ccMobile?: string;
  primaryNumber?: string;
  secondaryNumber?: string;
  ownerContact?: string;
  officeLandline?: string;
  officeAddress?: string;
  // Banking details
  accountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  accountHolderName?: string;
}) => {
  // Validate phone number format (E.164)
  validatePhoneNumber(data.phone);

  // Check if vendor already exists
  const existsByPhone = await prisma.vendor.findUnique({
    where: { phone: data.phone },
  });

  if (existsByPhone) throw new Error("Vendor with this phone already exists");

  if (data.email) {
    const existsByEmail = await prisma.vendor.findUnique({
      where: { email: data.email },
    });
    if (existsByEmail) throw new Error("Vendor with this email already exists");
  }

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
    customId = await generateEntityCustomId(cityCode.code, "VENDOR");
  }

  // Hash password
  const hashedPassword = await hashPassword(data.password);

  // Create vendor
  const vendor = await prisma.vendor.create({
    data: {
      customId,
      name: data.name,
      companyName: data.companyName,
      phone: data.phone,
      email: data.email || null,
      password: hashedPassword,
      address: data.address || null,
      profileImage: data.profileImage || null,
      agentId: data.agentId || null,
      cityCodeId: data.cityCodeId || null,
      // New contact fields
      gstNumber: data.gstNumber || null,
      panNumber: data.panNumber || null,
      ccMobile: data.ccMobile || null,
      primaryNumber: data.primaryNumber || null,
      secondaryNumber: data.secondaryNumber || null,
      ownerContact: data.ownerContact || null,
      officeLandline: data.officeLandline || null,
      officeAddress: data.officeAddress || null,
      // Banking details
      accountNumber: data.accountNumber || null,
      bankName: data.bankName || null,
      ifscCode: data.ifscCode || null,
      accountHolderName: data.accountHolderName || null,
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
  const { password, ...vendorWithoutPassword } = vendor;
  return vendorWithoutPassword;
};

/* ============================================
    VENDOR LOGIN
============================================ */
export const loginVendor = async (phone: string, password: string) => {
  // Validate phone number format (E.164)
  validatePhoneNumber(phone);

  // Find vendor by phone
  const vendor = await prisma.vendor.findUnique({
    where: { phone },
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

  if (!vendor) throw new Error("Invalid phone or password");

  // Check if vendor is suspended
  if (vendor.status === "SUSPENDED") {
    throw new Error("Your account has been suspended. Please contact support.");
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, vendor.password);
  if (!isPasswordValid) throw new Error("Invalid phone or password");

  // Generate JWT
  const token = jwt.sign({ id: vendor.id, role: "VENDOR" }, JWT_SECRET, {
    expiresIn: "7d",
  });

  // Remove password from response
  const { password: _, ...vendorWithoutPassword } = vendor;

  return {
    message: "Login successful",
    token,
    vendor: vendorWithoutPassword,
  };
};

/* ============================================
    GET VENDOR PROFILE
============================================ */
export const getVendorProfile = async (vendorId: string) => {
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
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
      vehicles: {
        include: {
          vehicleType: {
            select: {
              id: true,
              name: true,
              displayName: true,
              category: true,
            },
          },
          partner: {
            select: {
              id: true,
              customId: true,
              name: true,
              phone: true,
              status: true,
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
    UPDATE VENDOR PROFILE
============================================ */
export const updateVendorProfile = async (
  vendorId: string,
  data: {
    name?: string;
    companyName?: string;
    email?: string;
    address?: string;
    profileImage?: string;
  }
) => {
  // Check if email is unique if being updated
  if (data.email) {
    const existingVendor = await prisma.vendor.findFirst({
      where: {
        email: data.email,
        NOT: { id: vendorId },
      },
    });
    if (existingVendor) throw new Error("Email already in use by another vendor");
  }

  const vendor = await prisma.vendor.update({
    where: { id: vendorId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.companyName && { companyName: data.companyName }),
      ...(data.email && { email: data.email }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.profileImage !== undefined && { profileImage: data.profileImage }),
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
  const { password, ...vendorWithoutPassword } = vendor;
  return vendorWithoutPassword;
};
