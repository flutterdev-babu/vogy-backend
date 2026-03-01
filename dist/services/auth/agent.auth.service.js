"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgentAnalytics = exports.getAgentRides = exports.getAgentCorporates = exports.getAgentVendors = exports.updateAgentProfile = exports.getAgentProfile = exports.loginAgent = exports.registerAgent = void 0;
const prisma_1 = require("../../config/prisma");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const hash_1 = require("../../utils/hash");
const phoneValidation_1 = require("../../utils/phoneValidation");
const city_service_1 = require("../city/city.service");
const JWT_SECRET = process.env.JWT_SECRET || "secret_jwt";
/* ============================================
    AGENT REGISTRATION
============================================ */
const registerAgent = async (data) => {
    // Validate phone number format (E.164)
    (0, phoneValidation_1.validatePhoneNumber)(data.phone);
    // Check if agent already exists
    const existsByPhone = await prisma_1.prisma.agent.findUnique({
        where: { phone: data.phone },
    });
    if (existsByPhone)
        throw new Error("Agent with this phone already exists");
    if (data.email) {
        const existsByEmail = await prisma_1.prisma.agent.findUnique({
            where: { email: data.email },
        });
        if (existsByEmail)
            throw new Error("Agent with this email already exists");
    }
    // Hash password
    const hashedPassword = await (0, hash_1.hashPassword)(data.password);
    // Generate custom ID if cityCodeId provided
    let customId = null;
    if (data.cityCodeId) {
        const cityCode = await prisma_1.prisma.cityCode.findUnique({
            where: { id: data.cityCodeId },
        });
        if (!cityCode)
            throw new Error("Invalid city code ID");
        customId = await (0, city_service_1.generateEntityCustomId)(cityCode.code, "AGENT");
    }
    // Create agent
    const agent = await prisma_1.prisma.agent.create({
        data: {
            customId,
            name: data.name,
            phone: data.phone,
            email: data.email || null,
            password: hashedPassword,
            profileImage: data.profileImage || null,
        },
    });
    // Remove password from response
    const { password, ...agentWithoutPassword } = agent;
    return agentWithoutPassword;
};
exports.registerAgent = registerAgent;
/* ============================================
    AGENT LOGIN
============================================ */
const loginAgent = async (phone, password) => {
    // Validate phone number format (E.164)
    (0, phoneValidation_1.validatePhoneNumber)(phone);
    // Find agent by phone
    const agent = await prisma_1.prisma.agent.findUnique({
        where: { phone },
    });
    if (!agent)
        throw new Error("Invalid phone or password");
    // Verify password
    const isPasswordValid = await (0, hash_1.comparePassword)(password, agent.password);
    if (!isPasswordValid)
        throw new Error("Invalid phone or password");
    // Generate JWT
    const token = jsonwebtoken_1.default.sign({ id: agent.id, role: "AGENT" }, JWT_SECRET, {
        expiresIn: "7d",
    });
    // Remove password from response
    const { password: _, ...agentWithoutPassword } = agent;
    return {
        message: "Login successful",
        token,
        agent: agentWithoutPassword,
    };
};
exports.loginAgent = loginAgent;
/* ============================================
    GET AGENT PROFILE
============================================ */
const getAgentProfile = async (agentId) => {
    const agent = await prisma_1.prisma.agent.findUnique({
        where: { id: agentId },
        include: {
            cityCodes: {
                select: {
                    id: true,
                    code: true,
                    cityName: true,
                    isActive: true,
                },
            },
            _count: {
                select: {
                    vendors: true,
                    corporates: true,
                    rides: true,
                    cityCodes: true,
                },
            },
            coupons: {
                select: {
                    id: true,
                    couponCode: true,
                    discountValue: true,
                    isActive: true,
                },
            },
        },
    });
    if (!agent)
        throw new Error("Agent not found");
    // Remove password from response
    const { password, ...agentWithoutPassword } = agent;
    return agentWithoutPassword;
};
exports.getAgentProfile = getAgentProfile;
/* ============================================
    UPDATE AGENT PROFILE
============================================ */
const updateAgentProfile = async (agentId, data) => {
    // Check if email is unique if being updated
    if (data.email) {
        const existingAgent = await prisma_1.prisma.agent.findFirst({
            where: {
                email: data.email,
                NOT: { id: agentId },
            },
        });
        if (existingAgent)
            throw new Error("Email already in use by another agent");
    }
    // Handle lazy CustomId generation if cityCodeId is provided
    let newCustomId = undefined;
    if (data.cityCodeId) {
        const currentAgent = await prisma_1.prisma.agent.findUnique({
            where: { id: agentId },
            select: { customId: true }
        });
        // Only generate if they don't already have one
        if (currentAgent && !currentAgent.customId) {
            const cityCode = await prisma_1.prisma.cityCode.findUnique({
                where: { id: data.cityCodeId },
                select: { code: true }
            });
            if (cityCode) {
                newCustomId = await (0, city_service_1.generateEntityCustomId)(cityCode.code, "AGENT");
            }
            else {
                throw new Error("Invalid city code ID provided");
            }
        }
    }
    const agent = await prisma_1.prisma.agent.update({
        where: { id: agentId },
        data: {
            ...(data.name && { name: data.name }),
            ...(data.email && { email: data.email }),
            ...(data.profileImage !== undefined && { profileImage: data.profileImage }),
            ...(data.cityCodeId !== undefined && { cityCodeId: data.cityCodeId }),
            ...(newCustomId && { customId: newCustomId }),
        },
    });
    // Remove password from response
    const { password, ...agentWithoutPassword } = agent;
    return agentWithoutPassword;
};
exports.updateAgentProfile = updateAgentProfile;
/* ============================================
    GET AGENT VENDORS
============================================ */
const getAgentVendors = async (agentId) => {
    const vendors = await prisma_1.prisma.vendor.findMany({
        where: { agentId },
        select: {
            id: true,
            name: true,
            companyName: true,
            phone: true,
            email: true,
            status: true,
            customId: true,
            _count: {
                select: {
                    vehicles: true,
                    rides: true,
                },
            },
            createdAt: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    return vendors;
};
exports.getAgentVendors = getAgentVendors;
/* ============================================
    GET AGENT CORPORATES
============================================ */
const getAgentCorporates = async (agentId) => {
    const corporates = await prisma_1.prisma.corporate.findMany({
        where: { agentId },
        select: {
            id: true,
            customId: true,
            companyName: true,
            contactPerson: true,
            phone: true,
            email: true,
            status: true,
            creditLimit: true,
            creditUsed: true,
            creditBalance: true,
            _count: {
                select: {
                    rides: true,
                },
            },
            createdAt: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    return corporates;
};
exports.getAgentCorporates = getAgentCorporates;
/* ============================================
    GET AGENT RIDES
============================================ */
const getAgentRides = async (agentId) => {
    const rides = await prisma_1.prisma.ride.findMany({
        where: { agentId },
        include: {
            vendor: {
                select: {
                    id: true,
                    name: true,
                    companyName: true,
                },
            },
            partner: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                },
            },
            corporate: {
                select: {
                    id: true,
                    companyName: true,
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
exports.getAgentRides = getAgentRides;
/* ============================================
    GET AGENT ANALYTICS
============================================ */
const getAgentAnalytics = async (agentId) => {
    // Get total counts
    const [vendorCount, corporateCount, totalRides, completedRides] = await Promise.all([
        prisma_1.prisma.vendor.count({ where: { agentId } }),
        prisma_1.prisma.corporate.count({ where: { agentId } }),
        prisma_1.prisma.ride.count({ where: { agentId } }),
        prisma_1.prisma.ride.count({ where: { agentId, status: "COMPLETED" } }),
    ]);
    // Get top vendors by rides
    const topVendors = await prisma_1.prisma.vendor.findMany({
        where: { agentId },
        select: {
            id: true,
            name: true,
            companyName: true,
            _count: {
                select: {
                    rides: true,
                },
            },
        },
        orderBy: {
            rides: {
                _count: "desc",
            },
        },
        take: 5,
    });
    // Get top corporates by rides
    const topCorporates = await prisma_1.prisma.corporate.findMany({
        where: { agentId },
        select: {
            id: true,
            companyName: true,
            _count: {
                select: {
                    rides: true,
                },
            },
        },
        orderBy: {
            rides: {
                _count: "desc",
            },
        },
        take: 5,
    });
    // Get total revenue from agent rides
    const revenueData = await prisma_1.prisma.ride.aggregate({
        where: { agentId, status: "COMPLETED" },
        _sum: {
            totalFare: true,
        },
    });
    return {
        totalVendors: vendorCount,
        totalCorporates: corporateCount,
        totalRides,
        completedRides,
        totalRevenue: revenueData._sum.totalFare || 0,
        topVendors: topVendors.map((v) => ({
            id: v.id,
            name: v.name,
            companyName: v.companyName,
            rideCount: v._count.rides,
        })),
        topCorporates: topCorporates.map((c) => ({
            id: c.id,
            companyName: c.companyName,
            rideCount: c._count.rides,
        })),
    };
};
exports.getAgentAnalytics = getAgentAnalytics;
