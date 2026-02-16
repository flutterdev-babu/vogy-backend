"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = exports.getAllUsers = exports.deleteAgent = exports.updateAgentByAdmin = exports.unassignCorporateFromAgent = exports.unassignVendorFromAgent = exports.registerCorporateUnderAgent = exports.registerVendorUnderAgent = exports.getAgentById = exports.getAllAgents = void 0;
const prisma_1 = require("../../config/prisma");
/* ============================================
    GET ALL AGENTS
============================================ */
const getAllAgents = async (search) => {
    const where = {};
    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
            { email: { contains: search, mode: "insensitive" } },
        ];
    }
    const agents = await prisma_1.prisma.agent.findMany({
        where,
        select: {
            id: true,
            customId: true,
            name: true,
            phone: true,
            email: true,
            profileImage: true,
            _count: {
                select: {
                    vendors: true,
                    corporates: true,
                    rides: true,
                },
            },
            createdAt: true,
            updatedAt: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    return agents;
};
exports.getAllAgents = getAllAgents;
/* ============================================
    GET AGENT BY ID
============================================ */
const getAgentById = async (agentId) => {
    const agent = await prisma_1.prisma.agent.findUnique({
        where: { id: agentId },
        include: {
            vendors: {
                select: {
                    id: true,
                    customId: true,
                    name: true,
                    companyName: true,
                    phone: true,
                    status: true,
                    _count: {
                        select: {
                            rides: true,
                            vehicles: true,
                        },
                    },
                },
            },
            corporates: {
                select: {
                    id: true,
                    customId: true,
                    companyName: true,
                    contactPerson: true,
                    phone: true,
                    status: true,
                    creditLimit: true,
                    creditBalance: true,
                    _count: {
                        select: {
                            rides: true,
                        },
                    },
                },
            },
            _count: {
                select: {
                    vendors: true,
                    corporates: true,
                    rides: true,
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
exports.getAgentById = getAgentById;
/* ============================================
    REGISTER VENDOR UNDER AGENT
============================================ */
const registerVendorUnderAgent = async (vendorId, agentId) => {
    // Validate agent
    const agent = await prisma_1.prisma.agent.findUnique({
        where: { id: agentId },
    });
    if (!agent)
        throw new Error("Agent not found");
    // Validate vendor
    const vendor = await prisma_1.prisma.vendor.findUnique({
        where: { id: vendorId },
    });
    if (!vendor)
        throw new Error("Vendor not found");
    // Update vendor with agent
    const updatedVendor = await prisma_1.prisma.vendor.update({
        where: { id: vendorId },
        data: { agentId },
        select: {
            id: true,
            name: true,
            companyName: true,
            phone: true,
            status: true,
            customId: true,
            agent: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                },
            },
        },
    });
    return updatedVendor;
};
exports.registerVendorUnderAgent = registerVendorUnderAgent;
/* ============================================
    REGISTER CORPORATE UNDER AGENT
============================================ */
const registerCorporateUnderAgent = async (corporateId, agentId) => {
    // Validate agent
    const agent = await prisma_1.prisma.agent.findUnique({
        where: { id: agentId },
    });
    if (!agent)
        throw new Error("Agent not found");
    // Validate corporate
    const corporate = await prisma_1.prisma.corporate.findUnique({
        where: { id: corporateId },
    });
    if (!corporate)
        throw new Error("Corporate not found");
    // Update corporate with agent
    const updatedCorporate = await prisma_1.prisma.corporate.update({
        where: { id: corporateId },
        data: { agentId },
        select: {
            id: true,
            companyName: true,
            contactPerson: true,
            phone: true,
            status: true,
            customId: true,
            agent: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                },
            },
        },
    });
    return updatedCorporate;
};
exports.registerCorporateUnderAgent = registerCorporateUnderAgent;
/* ============================================
    UNASSIGN FROM AGENT
============================================ */
const unassignVendorFromAgent = async (vendorId) => {
    const vendor = await prisma_1.prisma.vendor.update({
        where: { id: vendorId },
        data: { agentId: null },
        select: {
            id: true,
            name: true,
            companyName: true,
            agentId: true,
        },
    });
    return vendor;
};
exports.unassignVendorFromAgent = unassignVendorFromAgent;
const unassignCorporateFromAgent = async (corporateId) => {
    const corporate = await prisma_1.prisma.corporate.update({
        where: { id: corporateId },
        data: { agentId: null },
        select: {
            id: true,
            companyName: true,
            agentId: true,
        },
    });
    return corporate;
};
exports.unassignCorporateFromAgent = unassignCorporateFromAgent;
/* ============================================
    UPDATE AGENT BY ADMIN
============================================ */
const updateAgentByAdmin = async (agentId, data) => {
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
    const agent = await prisma_1.prisma.agent.update({
        where: { id: agentId },
        data: {
            ...(data.name && { name: data.name }),
            ...(data.email !== undefined && { email: data.email }),
            ...(data.profileImage !== undefined && { profileImage: data.profileImage }),
        },
    });
    // Remove password from response
    const { password, ...agentWithoutPassword } = agent;
    return agentWithoutPassword;
};
exports.updateAgentByAdmin = updateAgentByAdmin;
/* ============================================
    DELETE AGENT
============================================ */
const deleteAgent = async (agentId) => {
    // Check if agent has vendors
    const vendorCount = await prisma_1.prisma.vendor.count({
        where: { agentId },
    });
    if (vendorCount > 0) {
        throw new Error("Cannot delete agent with assigned vendors. Unassign vendors first.");
    }
    // Check if agent has corporates
    const corporateCount = await prisma_1.prisma.corporate.count({
        where: { agentId },
    });
    if (corporateCount > 0) {
        throw new Error("Cannot delete agent with assigned corporates. Unassign corporates first.");
    }
    await prisma_1.prisma.agent.delete({
        where: { id: agentId },
    });
    return { message: "Agent deleted successfully" };
};
exports.deleteAgent = deleteAgent;
/* ============================================
    GET ALL USERS (For Agent)
============================================ */
const getAllUsers = async (search) => {
    const where = {};
    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
            { email: { contains: search, mode: "insensitive" } },
        ];
    }
    const users = await prisma_1.prisma.user.findMany({
        where,
        select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            profileImage: true,
            _count: {
                select: {
                    rides: true,
                },
            },
            createdAt: true,
            updatedAt: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    return users;
};
exports.getAllUsers = getAllUsers;
/* ============================================
    CREATE USER (For Agent)
============================================ */
const createUser = async (data) => {
    // Check if user already exists by phone
    const existingByPhone = await prisma_1.prisma.user.findUnique({
        where: { phone: data.phone },
    });
    if (existingByPhone) {
        throw new Error("User with this phone already exists");
    }
    // Check if email exists
    if (data.email) {
        const existingByEmail = await prisma_1.prisma.user.findUnique({
            where: { email: data.email },
        });
        if (existingByEmail) {
            throw new Error("User with this email already exists");
        }
    }
    // Generate unique OTP for the user
    const { generateUnique4DigitOtp } = require("../../utils/generateUniqueOtp");
    const uniqueOtp = await generateUnique4DigitOtp();
    const user = await prisma_1.prisma.user.create({
        data: {
            name: data.name,
            phone: data.phone,
            email: data.email || null,
            profileImage: data.profileImage || null,
            uniqueOtp: uniqueOtp,
        },
        select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            profileImage: true,
            createdAt: true,
        },
    });
    return user;
};
exports.createUser = createUser;
