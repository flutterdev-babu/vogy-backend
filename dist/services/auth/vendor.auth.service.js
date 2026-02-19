"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateVendorProfile = exports.getVendorProfile = exports.loginVendor = exports.registerVendor = void 0;
const prisma_1 = require("../../config/prisma");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const hash_1 = require("../../utils/hash");
const city_service_1 = require("../city/city.service");
const phoneValidation_1 = require("../../utils/phoneValidation");
const JWT_SECRET = process.env.JWT_SECRET || "secret_jwt";
/* ============================================
    VENDOR REGISTRATION
============================================ */
const registerVendor = async (data) => {
    // Validate phone number format (E.164)
    (0, phoneValidation_1.validatePhoneNumber)(data.phone);
    // Check if vendor already exists
    const existsByPhone = await prisma_1.prisma.vendor.findUnique({
        where: { phone: data.phone },
    });
    if (existsByPhone)
        throw new Error("Vendor with this phone already exists");
    if (data.email) {
        const existsByEmail = await prisma_1.prisma.vendor.findUnique({
            where: { email: data.email },
        });
        if (existsByEmail)
            throw new Error("Vendor with this email already exists");
    }
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
        customId = await (0, city_service_1.generateEntityCustomId)(cityCode.code, "VENDOR");
    }
    // Hash password
    const hashedPassword = await (0, hash_1.hashPassword)(data.password);
    // Create vendor
    const vendor = await prisma_1.prisma.vendor.create({
        data: {
            customId,
            name: data.name,
            companyName: data.companyName,
            phone: data.phone,
            email: data.email || null,
            password: hashedPassword,
            address: data.address || null,
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
            type: data.type || "BUSINESS",
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
exports.registerVendor = registerVendor;
/* ============================================
    VENDOR LOGIN
============================================ */
const loginVendor = async (phone, password) => {
    // Validate phone number format (E.164)
    (0, phoneValidation_1.validatePhoneNumber)(phone);
    // Find vendor by phone
    const vendor = await prisma_1.prisma.vendor.findUnique({
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
    if (!vendor)
        throw new Error("Invalid phone or password");
    // Check if vendor is suspended
    if (vendor.status === "SUSPENDED") {
        throw new Error("Your account has been suspended. Please contact support.");
    }
    // Verify password
    const isPasswordValid = await (0, hash_1.comparePassword)(password, vendor.password);
    if (!isPasswordValid)
        throw new Error("Invalid phone or password");
    // Generate JWT
    const token = jsonwebtoken_1.default.sign({ id: vendor.id, role: "VENDOR" }, JWT_SECRET, {
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
exports.loginVendor = loginVendor;
/* ============================================
    GET VENDOR PROFILE
============================================ */
const getVendorProfile = async (vendorId) => {
    const vendor = await prisma_1.prisma.vendor.findUnique({
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
            partners: {
                select: {
                    id: true,
                    customId: true,
                    name: true,
                    phone: true,
                    status: true,
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
    if (!vendor)
        throw new Error("Vendor not found");
    // Remove password from response
    const { password, ...vendorWithoutPassword } = vendor;
    return vendorWithoutPassword;
};
exports.getVendorProfile = getVendorProfile;
/* ============================================
    UPDATE VENDOR PROFILE
============================================ */
const updateVendorProfile = async (vendorId, data) => {
    // Check if email is unique if being updated
    if (data.email) {
        const existingVendor = await prisma_1.prisma.vendor.findFirst({
            where: {
                email: data.email,
                NOT: { id: vendorId },
            },
        });
        if (existingVendor)
            throw new Error("Email already in use by another vendor");
    }
    const vendor = await prisma_1.prisma.vendor.update({
        where: { id: vendorId },
        data: {
            ...(data.name && { name: data.name }),
            ...(data.companyName && { companyName: data.companyName }),
            ...(data.email && { email: data.email }),
            ...(data.address !== undefined && { address: data.address }),
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
exports.updateVendorProfile = updateVendorProfile;
