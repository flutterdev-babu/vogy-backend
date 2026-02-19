import { prisma } from "../../config/prisma";
import crypto from "crypto";
import twilio from "twilio";
import { hashPassword, comparePassword } from "../../utils/hash";
import { generateUnique4DigitOtp } from "../../utils/generateUniqueOtp";
import { validatePhoneNumber } from "../../utils/phoneValidation";
import { signToken } from "../../utils/jwt";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const TWILIO_PHONE = process.env.TWILIO_PHONE!;

const generateOtp = () => crypto.randomInt(100000, 999999).toString();

const otpExpiry = () => new Date(Date.now() + 5 * 60 * 1000);

export const registerUser = async (data: any) => {
  // Validate phone number format (E.164)
  validatePhoneNumber(data.phone);

  const exists = await prisma.user.findUnique({
    where: { phone: data.phone },
  });

  if (exists) throw new Error("User already exists");

  // Generate unique 4-digit OTP for user
  const uniqueOtp = await generateUnique4DigitOtp();

  const user = await prisma.user.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      profileImage: data.profileImage || null,
      uniqueOtp: uniqueOtp,
    },
  });

  return user;
};

// Note: Partner registration is handled in partner.auth.service.ts
// The old registerRider function has been removed - use Partner auth instead

export const sendOtp = async (role: "USER" | "PARTNER", phone: string) => {
  // Validate phone number format (E.164)
  validatePhoneNumber(phone);

  // Verify phone number is registered
  let exists = false;
  if (role === "USER") {
    const user = await prisma.user.findUnique({
      where: { phone },
    });
    exists = !!user;
  } else if (role === "PARTNER") {
    const partner = await prisma.partner.findUnique({
      where: { phone },
    });
    exists = !!partner;
  }

  if (!exists) {
    throw new Error(
      `Phone number is not registered. Please register first as a ${role}.`
    );
  }

  const otp = generateOtp();

  await prisma.otpCode.create({
    data: {
      phone,
      role,
      code: otp,
      expiresAt: otpExpiry(),
    },
  });

  await twilioClient.messages.create({
    body: `Your login OTP is: ${otp}`,
    from: TWILIO_PHONE,
    to: phone,
  });

  return { message: "OTP sent successfully" };
};

export const verifyOtp = async (
  role: "USER" | "PARTNER",
  phone: string,
  code: string
) => {
  // Validate phone number format (E.164)
  validatePhoneNumber(phone);

  const otpRecord = await prisma.otpCode.findFirst({
    where: { phone, role, code },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) throw new Error("Invalid OTP");
  if (otpRecord.expiresAt < new Date()) throw new Error("OTP expired");

  // Verify phone number is registered (for login, user/partner must exist)
  let user;
  if (role === "USER") {
    user = await prisma.user.findUnique({
      where: { phone },
    });
    if (!user) throw new Error("User not found. Please register first.");
  } else {
    user = await prisma.partner.findUnique({
      where: { phone },
      include: {
        vehicle: {
          select: {
            id: true,
            customId: true,
            registrationNumber: true,
            vehicleModel: true,
          },
        },
      },
    });
    if (!user) throw new Error("Partner not found. Please register first.");
  }

  // Generate JWT
  const token = signToken({ id: user.id, role });

  // Remove OTP after use
  await prisma.otpCode.deleteMany({ where: { phone } });

  return {
    message: "Login successful",
    token,
    user,
  };
};

/* ============================================
    ADMIN REGISTRATION
============================================ */
export const registerAdmin = async (data: {
  name: string;
  email: string;
  password: string;
  role?: "SUPERADMIN" | "SUBADMIN";
}) => {
  // Check if admin already exists
  const exists = await prisma.admin.findUnique({
    where: { email: data.email },
  });

  if (exists) throw new Error("Admin with this email already exists");

  // Hash password
  const hashedPassword = await hashPassword(data.password);

  // Create admin
  const admin = await prisma.admin.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role || "SUBADMIN",
    },
  });

  // Remove password from response
  const { password, ...adminWithoutPassword } = admin;

  return adminWithoutPassword;
};

/* ============================================
    ADMIN LOGIN
============================================ */
export const loginAdmin = async (email: string, password: string) => {
  // Find admin by email
  const admin = await prisma.admin.findUnique({
    where: { email },
  });

  if (!admin) throw new Error("Invalid email or password");

  // Verify password
  const isPasswordValid = await comparePassword(password, admin.password);

  if (!isPasswordValid) throw new Error("Invalid email or password");

  // Generate JWT
  const token = signToken({ id: admin.id, role: "ADMIN" });

  // Remove password from response
  const { password: _, ...adminWithoutPassword } = admin;

  return {
    message: "Login successful",
    token,
    admin: adminWithoutPassword,
  };
};
