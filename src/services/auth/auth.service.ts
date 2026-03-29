import { prisma } from "../../config/prisma";
import crypto from "crypto";
import twilio from "twilio";
import { hashPassword, comparePassword } from "../../utils/hash";
import { generateUnique4DigitOtp } from "../../utils/generateUniqueOtp";
import { normalizePhone, validatePhoneNumber } from "../../utils/phoneValidation";
import { signToken } from "../../utils/jwt";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const TWILIO_PHONE = process.env.TWILIO_PHONE!;

const generateOtp = () => crypto.randomInt(100000, 999999).toString();

const otpExpiry = () => new Date(Date.now() + 5 * 60 * 1000);

export const registerUser = async (data: any) => {
  // Normalize phone number (E.164)
  const phone = normalizePhone(data.phone);

  const exists = await prisma.user.findUnique({
    where: { phone },
  });

  if (exists) {
    // If the user exists but has no password, they likely registered via OTP only.
    // Allow them to "register" their email and password now to enable dual login.
    if (!exists.password) {
      const uniqueOtp = exists.uniqueOtp || (await generateUnique4DigitOtp());
      const hashedPassword = data.password ? await hashPassword(data.password) : null;

      const updatedUser = await prisma.user.update({
        where: { id: exists.id },
        data: {
          name: data.name || exists.name,
          email: data.email || exists.email,
          password: hashedPassword,
          uniqueOtp: uniqueOtp,
        },
      });
      return updatedUser;
    }

    throw new Error(
      "This phone number is already registered. Please go to the Login page to access your account."
    );
  }

  // Generate unique 4-digit OTP for new user
  const uniqueOtp = await generateUnique4DigitOtp();

  // Hash password if provided
  const hashedPassword = data.password ? await hashPassword(data.password) : null;

  const user = await prisma.user.create({
    data: {
      name: data.name,
      phone: phone,
      email: data.email || null,
      password: hashedPassword,
      profileImage: data.profileImage || null,
      uniqueOtp: uniqueOtp,
    },
  });

  return user;
};

// Note: Partner registration is handled in partner.auth.service.ts
// The old registerRider function has been removed - use Partner auth instead

export const sendOtp = async (role: "USER" | "PARTNER", phone: string) => {
  // Normalize phone number (E.164)
  const normalizedPhone = normalizePhone(phone);

  // Verify phone number is registered
  let exists = false;
  if (role === "USER") {
    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });
    exists = !!user;
  } else if (role === "PARTNER") {
    const partner = await prisma.partner.findUnique({
      where: { phone: normalizedPhone },
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
      phone: normalizedPhone,
      role,
      code: otp,
      expiresAt: otpExpiry(),
    },
  });

  // Bypass Twilio for development if needed (e.g., account suspended)
  /*
  await twilioClient.messages.create({
    body: `Your login OTP is: ${otp}`,
    from: TWILIO_PHONE,
    to: phone,
  });
  */

  console.log(`[DEV] OTP for ${phone} (${role}): ${otp}`);

  return { message: "OTP sent successfully (Development Mode)" };
};

export const verifyOtp = async (
  role: "USER" | "PARTNER",
  phone: string,
  code: string
) => {
  // Normalize phone number (E.164)
  const normalizedPhone = normalizePhone(phone);

  const otpRecord = await prisma.otpCode.findFirst({
    where: { phone: normalizedPhone, role, code },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) throw new Error("Invalid OTP");
  if (otpRecord.expiresAt < new Date()) throw new Error("OTP expired");

  // Verify phone number is registered (for login, user/partner must exist)
  if (role === "USER") {
    const user = await prisma.user.findUnique({
      where: { phone },
    });
    if (!user) throw new Error("User not found. Please register first.");

    // Generate JWT
    const token = signToken({ id: user.id, role });

    // Remove OTP after use
    await prisma.otpCode.deleteMany({ where: { phone: normalizedPhone } });

    return {
      message: "Login successful",
      token,
      user,
    };
  } else {
    // role === "PARTNER"
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

    if (!partner) throw new Error("Partner not found. Please register first.");

    // Check if partner is suspended
    if (partner.status === "SUSPENDED") {
      throw new Error("Your account has been suspended. Please contact support.");
    }

    // Generate JWT
    const token = signToken({ id: partner.id, role });

    // Remove OTP after use
    await prisma.otpCode.deleteMany({ where: { phone: normalizedPhone } });

    const { password, ...partnerWithoutPassword } = partner;

    return {
      message: "Login successful",
      token,
      partner: partnerWithoutPassword,
    };
  }
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

/* ============================================
    USER LOGIN (EMAIL/PASSWORD)
============================================ */
export const loginUser = async (email: string, password: string) => {
  // Find user by email
  const user = await prisma.user.findFirst({
    where: { email },
  });

  if (!user) {
    throw new Error("No account found with this email. Please register first or use OTP login with your phone number.");
  }

  if (!user.password) {
    throw new Error("This account was created via OTP and does not have a password. Please use OTP Login to sign in.");
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) throw new Error("Incorrect password. Please try again or use OTP Login.");

  // Generate JWT
  const token = signToken({ id: user.id, role: "USER" });

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  return {
    message: "Login successful",
    token,
    user: userWithoutPassword,
  };
};
