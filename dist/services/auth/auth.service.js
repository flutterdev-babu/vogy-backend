"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginAdmin = exports.registerAdmin = exports.verifyOtp = exports.sendOtp = exports.registerUser = void 0;
const prisma_1 = require("../../config/prisma");
const crypto_1 = __importDefault(require("crypto"));
const twilio_1 = __importDefault(require("twilio"));
const hash_1 = require("../../utils/hash");
const generateUniqueOtp_1 = require("../../utils/generateUniqueOtp");
const phoneValidation_1 = require("../../utils/phoneValidation");
const jwt_1 = require("../../utils/jwt");
const twilioClient = (0, twilio_1.default)(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const TWILIO_PHONE = process.env.TWILIO_PHONE;
const generateOtp = () => crypto_1.default.randomInt(100000, 999999).toString();
const otpExpiry = () => new Date(Date.now() + 5 * 60 * 1000);
const registerUser = async (data) => {
    // Validate phone number format (E.164)
    (0, phoneValidation_1.validatePhoneNumber)(data.phone);
    const exists = await prisma_1.prisma.user.findUnique({
        where: { phone: data.phone },
    });
    if (exists)
        throw new Error("User already exists");
    // Generate unique 4-digit OTP for user
    const uniqueOtp = await (0, generateUniqueOtp_1.generateUnique4DigitOtp)();
    const user = await prisma_1.prisma.user.create({
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
exports.registerUser = registerUser;
// Note: Partner registration is handled in partner.auth.service.ts
// The old registerRider function has been removed - use Partner auth instead
const sendOtp = async (role, phone) => {
    // Validate phone number format (E.164)
    (0, phoneValidation_1.validatePhoneNumber)(phone);
    // Verify phone number is registered
    let exists = false;
    if (role === "USER") {
        const user = await prisma_1.prisma.user.findUnique({
            where: { phone },
        });
        exists = !!user;
    }
    else if (role === "PARTNER") {
        const partner = await prisma_1.prisma.partner.findUnique({
            where: { phone },
        });
        exists = !!partner;
    }
    if (!exists) {
        throw new Error(`Phone number is not registered. Please register first as a ${role}.`);
    }
    const otp = generateOtp();
    await prisma_1.prisma.otpCode.create({
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
exports.sendOtp = sendOtp;
const verifyOtp = async (role, phone, code) => {
    // Validate phone number format (E.164)
    (0, phoneValidation_1.validatePhoneNumber)(phone);
    const otpRecord = await prisma_1.prisma.otpCode.findFirst({
        where: { phone, role, code },
        orderBy: { createdAt: "desc" },
    });
    if (!otpRecord)
        throw new Error("Invalid OTP");
    if (otpRecord.expiresAt < new Date())
        throw new Error("OTP expired");
    // Verify phone number is registered (for login, user/partner must exist)
    let user;
    if (role === "USER") {
        user = await prisma_1.prisma.user.findUnique({
            where: { phone },
        });
        if (!user)
            throw new Error("User not found. Please register first.");
    }
    else {
        user = await prisma_1.prisma.partner.findUnique({
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
        if (!user)
            throw new Error("Partner not found. Please register first.");
    }
    // Generate JWT
    const token = (0, jwt_1.signToken)({ id: user.id, role });
    // Remove OTP after use
    await prisma_1.prisma.otpCode.deleteMany({ where: { phone } });
    return {
        message: "Login successful",
        token,
        user,
    };
};
exports.verifyOtp = verifyOtp;
/* ============================================
    ADMIN REGISTRATION
============================================ */
const registerAdmin = async (data) => {
    // Check if admin already exists
    const exists = await prisma_1.prisma.admin.findUnique({
        where: { email: data.email },
    });
    if (exists)
        throw new Error("Admin with this email already exists");
    // Hash password
    const hashedPassword = await (0, hash_1.hashPassword)(data.password);
    // Create admin
    const admin = await prisma_1.prisma.admin.create({
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
exports.registerAdmin = registerAdmin;
/* ============================================
    ADMIN LOGIN
============================================ */
const loginAdmin = async (email, password) => {
    // Find admin by email
    const admin = await prisma_1.prisma.admin.findUnique({
        where: { email },
    });
    if (!admin)
        throw new Error("Invalid email or password");
    // Verify password
    const isPasswordValid = await (0, hash_1.comparePassword)(password, admin.password);
    if (!isPasswordValid)
        throw new Error("Invalid email or password");
    // Generate JWT
    const token = (0, jwt_1.signToken)({ id: admin.id, role: "ADMIN" });
    // Remove password from response
    const { password: _, ...adminWithoutPassword } = admin;
    return {
        message: "Login successful",
        token,
        admin: adminWithoutPassword,
    };
};
exports.loginAdmin = loginAdmin;
