"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgentRides = exports.createUser = exports.getAllUsers = exports.deleteAgent = exports.updateAgentByAdmin = exports.getAgentByCode = exports.getAgentById = exports.getAllAgents = void 0;
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
            _count: {
                select: {
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
    GET AGENT BY CODE
============================================ */
const getAgentByCode = async (agentCode) => {
    const agent = await prisma_1.prisma.agent.findUnique({
        where: { agentCode },
        select: {
            id: true,
            agentCode: true,
            name: true,
        },
    });
    return agent;
};
exports.getAgentByCode = getAgentByCode;
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
    // Check if agentCode is unique
    if (data.agentCode) {
        const existingByCode = await prisma_1.prisma.agent.findFirst({
            where: {
                agentCode: data.agentCode,
                NOT: { id: agentId },
            },
        });
        if (existingByCode)
            throw new Error("Agent code already in use");
    }
    const agent = await prisma_1.prisma.agent.update({
        where: { id: agentId },
        data: {
            ...(data.name && { name: data.name }),
            ...(data.email !== undefined && { email: data.email }),
            ...(data.profileImage !== undefined && { profileImage: data.profileImage }),
            ...(data.agentCode !== undefined && { agentCode: data.agentCode }),
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
/* ============================================
    GET RIDES BY AGENT CODE
============================================ */
const getAgentRides = async (agentCode) => {
    return await prisma_1.prisma.ride.findMany({
        where: { agentCode },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                },
            },
            partner: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                },
            },
            vehicleType: true,
            vehicle: true,
        },
        orderBy: { createdAt: "desc" },
    });
};
exports.getAgentRides = getAgentRides;
