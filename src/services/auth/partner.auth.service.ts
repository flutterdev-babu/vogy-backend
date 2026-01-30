import { prisma } from "../../config/prisma";
import jwt from "jsonwebtoken";
import { hashPassword, comparePassword } from "../../utils/hash";
import { generateEntityCustomId } from "../city/city.service";

const JWT_SECRET = process.env.JWT_SECRET || "secret_jwt";

/* ============================================
    PARTNER REGISTRATION
============================================ */
export const registerPartner = async (data: {
  name: string;
  phone: string;
  email?: string;
  password: string;
  profileImage?: string;
  aadharNumber?: string;
  licenseNumber?: string;
  licenseImage?: string;
  cityCodeId?: string;  // For custom ID generation
}) => {
  // Check if partner already exists
  const existsByPhone = await prisma.partner.findUnique({
    where: { phone: data.phone },
  });

  if (existsByPhone) throw new Error("Partner with this phone already exists");

  // Check if phone already exists as a Rider (prevent dual registration)
  const existsAsRider = await prisma.rider.findUnique({
    where: { phone: data.phone },
  });

  if (existsAsRider) {
    throw new Error("This phone number is already registered as a Rider. The same person cannot register as both Partner and Rider.");
  }

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

  // Hash password
  const hashedPassword = await hashPassword(data.password);

  // Create partner
  const partner = await prisma.partner.create({
    data: {
      customId,
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      password: hashedPassword,
      profileImage: data.profileImage || null,
      aadharNumber: data.aadharNumber || null,
      licenseNumber: data.licenseNumber || null,
      licenseImage: data.licenseImage || null,
      cityCodeId: data.cityCodeId || null,
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
export const loginPartner = async (phone: string, password: string) => {
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
              name: true,
              companyName: true,
            },
          },
        },
      },
    },
  });

  if (!partner) throw new Error("Invalid phone or password");

  // Check if partner is suspended
  if (partner.status === "SUSPENDED") {
    throw new Error("Your account has been suspended. Please contact support.");
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, partner.password);
  if (!isPasswordValid) throw new Error("Invalid phone or password");

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
              name: true,
              companyName: true,
              phone: true,
            },
          },
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
    aadharNumber?: string;
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
      ...(data.aadharNumber !== undefined && { aadharNumber: data.aadharNumber }),
      ...(data.licenseNumber !== undefined && { licenseNumber: data.licenseNumber }),
      ...(data.licenseImage !== undefined && { licenseImage: data.licenseImage }),
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
