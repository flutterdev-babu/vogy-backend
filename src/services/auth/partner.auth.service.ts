import { prisma } from "../../config/prisma";
import jwt from "jsonwebtoken";
import { hashPassword, comparePassword } from "../../utils/hash";
import { generateEntityCustomId } from "../city/city.service";
import { validatePhoneNumber } from "../../utils/phoneValidation";

const JWT_SECRET = process.env.JWT_SECRET || "secret_jwt";

/* ============================================
    PARTNER REGISTRATION
============================================ */
export const registerPartner = async (data: {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  password: string;
  profileImage?: string;
  cityCodeId?: string;  // For custom ID generation
  dateOfBirth?: string;  // ISO date string
  gender?: "MALE" | "FEMALE" | "OTHER";
  localAddress?: string;
  permanentAddress?: string;
  vendorId?: string;
  vendorCustomId?: string; // Optional: for linking by custom ID
  licenseNumber?: string;
  licenseImage?: string;
  hasLicense: boolean;
}) => {
  // Validate phone number format (E.164)
  validatePhoneNumber(data.phone);

  // Validate license if hasLicense is true
  if (data.hasLicense) {
    if (!data.licenseNumber) throw new Error("License number is required");
    if (!data.licenseImage) throw new Error("License image is required");
  } else {
    throw new Error("Partner must have a valid license to register");
  }

  // Check if partner already exists
  const existsByPhone = await prisma.partner.findUnique({
    where: { phone: data.phone },
  });

  if (existsByPhone) throw new Error("Partner with this phone already exists");

  // Note: Rider model has been removed - all drivers are now Partners

  if (data.email) {
    const existsByEmail = await prisma.partner.findUnique({
      where: { email: data.email },
    });
    if (existsByEmail) throw new Error("Partner with this email already exists");
  }

  // Generate custom ID if cityCodeId provided
  let customId = null;
  if (data.cityCodeId) {
    const cityCode = await prisma.cityCode.findUnique({
      where: { id: data.cityCodeId },
    });
    if (!cityCode) throw new Error("Invalid city code ID");
    customId = await generateEntityCustomId(cityCode.code, "PARTNER");
  }

  // Handle Vendor linking
  let linkedVendorId = data.vendorId || null;
  if (data.vendorCustomId && !linkedVendorId) {
    const vendor = await prisma.vendor.findUnique({
      where: { customId: data.vendorCustomId },
    });
    if (!vendor) throw new Error("Invalid vendor custom ID");
    linkedVendorId = vendor.id;
  }

  // Hash password
  const hashedPassword = await hashPassword(data.password);

  // Create partner
  const partner = await prisma.partner.create({
    data: {
      customId,
      firstName: data.firstName,
      lastName: data.lastName,
      name: `${data.firstName} ${data.lastName}`,
      phone: data.phone,
      email: data.email || null,
      password: hashedPassword,
      profileImage: data.profileImage || null,
      cityCodeId: data.cityCodeId || null,
      // New personal info fields
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      gender: data.gender || null,
      localAddress: data.localAddress || null,
      permanentAddress: data.permanentAddress || null,
      licenseNumber: data.licenseNumber || null,
      licenseImage: data.licenseImage || null,
      hasLicense: data.hasLicense,
      vendorId: linkedVendorId,
    },
    include: {
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
  const { password, ...partnerWithoutPassword } = partner;
  return partnerWithoutPassword;
};

/* ============================================
    PARTNER LOGIN
============================================ */
export const loginPartner = async (phone: string, password?: string, otp?: string) => {
  // Validate phone number format (E.164)
  validatePhoneNumber(phone);

  if (!password && !otp) {
    throw new Error("Password or OTP is required for login");
  }

  // Find partner by phone
  const partner = await prisma.partner.findUnique({
    where: { phone },
    include: {
      vehicle: {
        include: {
          vehicleType: {
            select: {
              id: true,
              name: true,
              displayName: true,
              category: true,
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
      },
    },
  });

  if (!partner) throw new Error("Invalid phone number");

  // Check if partner is suspended
  if (partner.status === "SUSPENDED") {
    throw new Error("Your account has been suspended. Please contact support.");
  }

  if (otp) {
    // Verify OTP logic
    const otpRecord = await prisma.otpCode.findFirst({
      where: { phone, role: "PARTNER", code: otp },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) throw new Error("Invalid OTP");
    if (otpRecord.expiresAt < new Date()) throw new Error("OTP expired");

    // Remove OTP after successful use
    await prisma.otpCode.deleteMany({ where: { phone, role: "PARTNER" } });
  } else if (password) {
    // Verify password logic
    const isPasswordValid = await comparePassword(password, partner.password);
    if (!isPasswordValid) throw new Error("Invalid phone or password");
  }

  // Generate JWT
  const token = jwt.sign({ id: partner.id, role: "PARTNER" }, JWT_SECRET, {
    expiresIn: "7d",
  });

  // Remove password from response
  const { password: _, ...partnerWithoutPassword } = partner;

  return {
    message: "Login successful",
    token,
    partner: partnerWithoutPassword,
  };
};

/* ============================================
    GET PARTNER PROFILE
============================================ */
export const getPartnerProfile = async (partnerId: string) => {
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    include: {
      cityCode: {
        select: {
          id: true,
          code: true,
          cityName: true,
        },
      },
      vehicle: {
        include: {
          vehicleType: {
            select: {
              id: true,
              name: true,
              displayName: true,
              category: true,
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
      },
      vendor: {
        select: {
          id: true,
          customId: true,
          name: true,
          companyName: true,
        },
      },
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
    UPDATE PARTNER PROFILE
============================================ */
export const updatePartnerProfile = async (
  partnerId: string,
  data: {
    name?: string;
    email?: string;
    profileImage?: string;
    dateOfBirth?: string;
    gender?: "MALE" | "FEMALE" | "OTHER";
    localAddress?: string;
    permanentAddress?: string;
    accountHolderName?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    licenseNumber?: string;
    licenseImage?: string;
  }
) => {
  // Check if email is unique if being updated
  if (data.email) {
    const existingPartner = await prisma.partner.findFirst({
      where: {
        email: data.email,
        NOT: { id: partnerId },
      },
    });
    if (existingPartner) throw new Error("Email already in use by another partner");
  }

  const partner = await prisma.partner.update({
    where: { id: partnerId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.email && { email: data.email }),
      ...(data.profileImage !== undefined && { profileImage: data.profileImage }),
      ...(data.dateOfBirth && { dateOfBirth: new Date(data.dateOfBirth) }),
      ...(data.gender && { gender: data.gender }),
      ...(data.localAddress && { localAddress: data.localAddress }),
      ...(data.permanentAddress && { permanentAddress: data.permanentAddress }),
      ...(data.accountHolderName && { accountHolderName: data.accountHolderName }),
      ...(data.bankName && { bankName: data.bankName }),
      ...(data.accountNumber && { accountNumber: data.accountNumber }),
      ...(data.ifscCode && { ifscCode: data.ifscCode }),
      ...(data.licenseNumber && { licenseNumber: data.licenseNumber }),
      ...(data.licenseImage && { licenseImage: data.licenseImage }),
    },
    include: {
      vehicle: {
        include: {
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

  // Remove password from response
  const { password, ...partnerWithoutPassword } = partner;
  return partnerWithoutPassword;
};

/* ============================================
    UPDATE PARTNER LOCATION
============================================ */
export const updatePartnerLocation = async (
  partnerId: string,
  lat: number,
  lng: number
) => {
  const partner = await prisma.partner.update({
    where: { id: partnerId },
    data: {
      currentLat: lat,
      currentLng: lng,
    },
    select: {
      id: true,
      name: true,
      currentLat: true,
      currentLng: true,
      isOnline: true,
    },
  });

  return partner;
};

/* ============================================
    TOGGLE PARTNER ONLINE STATUS
============================================ */
export const togglePartnerOnline = async (partnerId: string, isOnline: boolean) => {
  const partner = await prisma.partner.update({
    where: { id: partnerId },
    data: {
      isOnline,
    },
    select: {
      id: true,
      name: true,
      isOnline: true,
      currentLat: true,
      currentLng: true,
    },
  });

  return partner;
};
