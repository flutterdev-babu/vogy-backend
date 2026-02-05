"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.togglePartnerOnline = exports.updatePartnerLocation = exports.updatePartnerProfile = exports.getPartnerProfile = exports.loginPartner = exports.registerPartner = void 0;
const prisma_1 = require("../../config/prisma");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const hash_1 = require("../../utils/hash");
const city_service_1 = require("../city/city.service");
const phoneValidation_1 = require("../../utils/phoneValidation");
const JWT_SECRET = process.env.JWT_SECRET || "secret_jwt";
/* ============================================
    PARTNER REGISTRATION
============================================ */
const registerPartner = async (data) => {
    // Validate phone number format (E.164)
    (0, phoneValidation_1.validatePhoneNumber)(data.phone);
    // Check if partner already exists
    const existsByPhone = await prisma_1.prisma.partner.findUnique({
        where: { phone: data.phone },
    });
    if (existsByPhone)
        throw new Error("Partner with this phone already exists");
    // Note: Rider model has been removed - all drivers are now Partners
    if (data.email) {
        const existsByEmail = await prisma_1.prisma.partner.findUnique({
            where: { email: data.email },
        });
        if (existsByEmail)
            throw new Error("Partner with this email already exists");
    }
    // Generate custom ID if cityCodeId provided
    let customId = null;
    if (data.cityCodeId) {
        const cityCode = await prisma_1.prisma.cityCode.findUnique({
            where: { id: data.cityCodeId },
        });
        if (!cityCode)
            throw new Error("Invalid city code ID");
        customId = await (0, city_service_1.generateEntityCustomId)(cityCode.code, "PARTNER");
    }
    // Hash password
    const hashedPassword = await (0, hash_1.hashPassword)(data.password);
    // Create partner
    const partner = await prisma_1.prisma.partner.create({
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
            // New personal info fields
            firstName: data.firstName || null,
            lastName: data.lastName || null,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
            gender: data.gender || null,
            localAddress: data.localAddress || null,
            permanentAddress: data.permanentAddress || null,
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
exports.registerPartner = registerPartner;
/* ============================================
    PARTNER LOGIN
============================================ */
const loginPartner = async (phone, password) => {
    // Validate phone number format (E.164)
    (0, phoneValidation_1.validatePhoneNumber)(phone);
    // Find partner by phone
    const partner = await prisma_1.prisma.partner.findUnique({
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
    if (!partner)
        throw new Error("Invalid phone or password");
    // Check if partner is suspended
    if (partner.status === "SUSPENDED") {
        throw new Error("Your account has been suspended. Please contact support.");
    }
    // Verify password
    const isPasswordValid = await (0, hash_1.comparePassword)(password, partner.password);
    if (!isPasswordValid)
        throw new Error("Invalid phone or password");
    // Generate JWT
    const token = jsonwebtoken_1.default.sign({ id: partner.id, role: "PARTNER" }, JWT_SECRET, {
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
exports.loginPartner = loginPartner;
/* ============================================
    GET PARTNER PROFILE
============================================ */
const getPartnerProfile = async (partnerId) => {
    const partner = await prisma_1.prisma.partner.findUnique({
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
            _count: {
                select: {
                    rides: true,
                },
            },
        },
    });
    if (!partner)
        throw new Error("Partner not found");
    // Remove password from response
    const { password, ...partnerWithoutPassword } = partner;
    return partnerWithoutPassword;
};
exports.getPartnerProfile = getPartnerProfile;
/* ============================================
    UPDATE PARTNER PROFILE
============================================ */
const updatePartnerProfile = async (partnerId, data) => {
    // Check if email is unique if being updated
    if (data.email) {
        const existingPartner = await prisma_1.prisma.partner.findFirst({
            where: {
                email: data.email,
                NOT: { id: partnerId },
            },
        });
        if (existingPartner)
            throw new Error("Email already in use by another partner");
    }
    const partner = await prisma_1.prisma.partner.update({
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
exports.updatePartnerProfile = updatePartnerProfile;
/* ============================================
    UPDATE PARTNER LOCATION
============================================ */
const updatePartnerLocation = async (partnerId, lat, lng) => {
    const partner = await prisma_1.prisma.partner.update({
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
exports.updatePartnerLocation = updatePartnerLocation;
/* ============================================
    TOGGLE PARTNER ONLINE STATUS
============================================ */
const togglePartnerOnline = async (partnerId, isOnline) => {
    const partner = await prisma_1.prisma.partner.update({
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
exports.togglePartnerOnline = togglePartnerOnline;
