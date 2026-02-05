"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCorporateBillingSummary = exports.getCorporatePaymentHistory = exports.getCorporateBillingHistory = exports.getCorporateRides = exports.updateCorporateProfile = exports.getCorporateProfile = exports.loginCorporate = exports.registerCorporate = void 0;
const prisma_1 = require("../../config/prisma");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const hash_1 = require("../../utils/hash");
const city_service_1 = require("../city/city.service");
const phoneValidation_1 = require("../../utils/phoneValidation");
const JWT_SECRET = process.env.JWT_SECRET || "secret_jwt";
/* ============================================
    CORPORATE REGISTRATION
============================================ */
const registerCorporate = async (data) => {
    // Validate phone number format (E.164)
    (0, phoneValidation_1.validatePhoneNumber)(data.phone);
    // Check if corporate already exists
    const existsByPhone = await prisma_1.prisma.corporate.findUnique({
        where: { phone: data.phone },
    });
    if (existsByPhone)
        throw new Error("Corporate with this phone already exists");
    const existsByEmail = await prisma_1.prisma.corporate.findUnique({
        where: { email: data.email },
    });
    if (existsByEmail)
        throw new Error("Corporate with this email already exists");
    // Validate agentId if provided
    if (data.agentId) {
        const agent = await prisma_1.prisma.agent.findUnique({
            where: { id: data.agentId },
        });
        if (!agent)
            throw new Error("Invalid agent ID");
    }
    // Generate custom ID if cityCodeId provided
    let customId = null;
    if (data.cityCodeId) {
        const cityCode = await prisma_1.prisma.cityCode.findUnique({
            where: { id: data.cityCodeId },
        });
        if (!cityCode)
            throw new Error("Invalid city code ID");
        customId = await (0, city_service_1.generateEntityCustomId)(cityCode.code, "CORPORATE");
    }
    // Hash password
    const hashedPassword = await (0, hash_1.hashPassword)(data.password);
    // Create corporate
    const corporate = await prisma_1.prisma.corporate.create({
        data: {
            customId,
            companyName: data.companyName,
            contactPerson: data.contactPerson,
            phone: data.phone,
            email: data.email,
            password: hashedPassword,
            address: data.address || null,
            gstNumber: data.gstNumber || null,
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
exports.registerCorporate = registerCorporate;
/* ============================================
    CORPORATE LOGIN
============================================ */
const loginCorporate = async (email, password) => {
    // Find corporate by email
    const corporate = await prisma_1.prisma.corporate.findUnique({
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
    if (!corporate)
        throw new Error("Invalid email or password");
    // Check if corporate is suspended
    if (corporate.status === "SUSPENDED") {
        throw new Error("Your account has been suspended. Please contact support.");
    }
    // Verify password
    const isPasswordValid = await (0, hash_1.comparePassword)(password, corporate.password);
    if (!isPasswordValid)
        throw new Error("Invalid email or password");
    // Generate JWT
    const token = jsonwebtoken_1.default.sign({ id: corporate.id, role: "CORPORATE" }, JWT_SECRET, {
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
exports.loginCorporate = loginCorporate;
/* ============================================
    GET CORPORATE PROFILE
============================================ */
const getCorporateProfile = async (corporateId) => {
    const corporate = await prisma_1.prisma.corporate.findUnique({
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
    if (!corporate)
        throw new Error("Corporate not found");
    // Remove password from response
    const { password, ...corporateWithoutPassword } = corporate;
    return corporateWithoutPassword;
};
exports.getCorporateProfile = getCorporateProfile;
/* ============================================
    UPDATE CORPORATE PROFILE
============================================ */
const updateCorporateProfile = async (corporateId, data) => {
    const corporate = await prisma_1.prisma.corporate.update({
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
exports.updateCorporateProfile = updateCorporateProfile;
/* ============================================
    GET CORPORATE RIDES
============================================ */
const getCorporateRides = async (corporateId) => {
    const rides = await prisma_1.prisma.ride.findMany({
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
exports.getCorporateRides = getCorporateRides;
/* ============================================
    GET CORPORATE BILLING HISTORY
============================================ */
const getCorporateBillingHistory = async (corporateId) => {
    const billings = await prisma_1.prisma.corporateBilling.findMany({
        where: { corporateId },
        orderBy: {
            createdAt: "desc",
        },
    });
    return billings;
};
exports.getCorporateBillingHistory = getCorporateBillingHistory;
/* ============================================
    GET CORPORATE PAYMENT HISTORY
============================================ */
const getCorporatePaymentHistory = async (corporateId) => {
    const payments = await prisma_1.prisma.corporatePayment.findMany({
        where: { corporateId },
        orderBy: {
            createdAt: "desc",
        },
    });
    return payments;
};
exports.getCorporatePaymentHistory = getCorporatePaymentHistory;
/* ============================================
    GET CORPORATE BILLING SUMMARY
============================================ */
const getCorporateBillingSummary = async (corporateId) => {
    const corporate = await prisma_1.prisma.corporate.findUnique({
        where: { id: corporateId },
        select: {
            id: true,
            companyName: true,
            creditLimit: true,
            creditUsed: true,
            creditBalance: true,
        },
    });
    if (!corporate)
        throw new Error("Corporate not found");
    // Get total billed and paid amounts
    const billingStats = await prisma_1.prisma.corporateBilling.aggregate({
        where: { corporateId },
        _sum: {
            totalAmount: true,
            paidAmount: true,
        },
    });
    // Get outstanding billings
    const outstandingBillings = await prisma_1.prisma.corporateBilling.findMany({
        where: {
            corporateId,
            status: { in: ["PENDING", "PARTIAL"] },
        },
        orderBy: {
            billingPeriodEnd: "asc",
        },
    });
    // Get total rides count and fare
    const rideStats = await prisma_1.prisma.ride.aggregate({
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
exports.getCorporateBillingSummary = getCorporateBillingSummary;
