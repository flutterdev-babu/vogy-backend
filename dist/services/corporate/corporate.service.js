"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCorporate = exports.getCorporateRides = exports.updateCorporateByAdmin = exports.updateCorporateCreditLimit = exports.updateCorporateStatus = exports.getCorporateById = exports.getAllCorporates = void 0;
const prisma_1 = require("../../config/prisma");
/* ============================================
    GET ALL CORPORATES
============================================ */
const getAllCorporates = async (filters) => {
    const where = {};
    if (filters?.status) {
        where.status = filters.status;
    }
    if (filters?.agentId) {
        where.agentId = filters.agentId;
    }
    if (filters?.search) {
        where.OR = [
            { companyName: { contains: filters.search, mode: "insensitive" } },
            { contactPerson: { contains: filters.search, mode: "insensitive" } },
            { phone: { contains: filters.search } },
            { email: { contains: filters.search, mode: "insensitive" } },
        ];
    }
    const corporates = await prisma_1.prisma.corporate.findMany({
        where,
        select: {
            id: true,
            customId: true,
            companyName: true,
            contactPerson: true,
            phone: true,
            email: true,
            address: true,
            gstNumber: true,
            status: true,
            creditLimit: true,
            creditUsed: true,
            creditBalance: true,
            agent: {
                select: {
                    id: true,
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
            createdAt: true,
            updatedAt: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    return corporates;
};
exports.getAllCorporates = getAllCorporates;
/* ============================================
    GET CORPORATE BY ID
============================================ */
const getCorporateById = async (corporateId) => {
    const corporate = await prisma_1.prisma.corporate.findUnique({
        where: { id: corporateId },
        include: {
            agent: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
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
exports.getCorporateById = getCorporateById;
/* ============================================
    UPDATE CORPORATE STATUS (Admin)
============================================ */
const updateCorporateStatus = async (corporateId, status) => {
    const corporate = await prisma_1.prisma.corporate.update({
        where: { id: corporateId },
        data: { status },
        select: {
            id: true,
            companyName: true,
            status: true,
            updatedAt: true,
        },
    });
    return corporate;
};
exports.updateCorporateStatus = updateCorporateStatus;
/* ============================================
    UPDATE CORPORATE CREDIT LIMIT
============================================ */
const updateCorporateCreditLimit = async (corporateId, creditLimit) => {
    const corporate = await prisma_1.prisma.corporate.findUnique({
        where: { id: corporateId },
    });
    if (!corporate)
        throw new Error("Corporate not found");
    // Calculate new credit balance
    const newCreditBalance = creditLimit - corporate.creditUsed;
    const updatedCorporate = await prisma_1.prisma.corporate.update({
        where: { id: corporateId },
        data: {
            creditLimit,
            creditBalance: newCreditBalance > 0 ? newCreditBalance : 0,
        },
        select: {
            id: true,
            companyName: true,
            creditLimit: true,
            creditUsed: true,
            creditBalance: true,
            updatedAt: true,
        },
    });
    return updatedCorporate;
};
exports.updateCorporateCreditLimit = updateCorporateCreditLimit;
/* ============================================
    UPDATE CORPORATE BY ADMIN
============================================ */
const updateCorporateByAdmin = async (corporateId, data) => {
    // Validate agentId if provided
    if (data.agentId) {
        const agent = await prisma_1.prisma.agent.findUnique({
            where: { id: data.agentId },
        });
        if (!agent)
            throw new Error("Invalid agent ID");
    }
    // Calculate credit balance if credit limit is updated
    let creditBalance;
    if (data.creditLimit !== undefined) {
        const corporate = await prisma_1.prisma.corporate.findUnique({
            where: { id: corporateId },
        });
        if (corporate) {
            creditBalance = data.creditLimit - corporate.creditUsed;
            if (creditBalance < 0)
                creditBalance = 0;
        }
    }
    const corporate = await prisma_1.prisma.corporate.update({
        where: { id: corporateId },
        data: {
            ...(data.companyName && { companyName: data.companyName }),
            ...(data.contactPerson && { contactPerson: data.contactPerson }),
            ...(data.address !== undefined && { address: data.address }),
            ...(data.gstNumber !== undefined && { gstNumber: data.gstNumber }),
            ...(data.status && { status: data.status }),
            ...(data.creditLimit !== undefined && { creditLimit: data.creditLimit }),
            ...(creditBalance !== undefined && { creditBalance }),
            ...(data.agentId !== undefined && { agentId: data.agentId }),
        },
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
    // Remove password from response
    const { password, ...corporateWithoutPassword } = corporate;
    return corporateWithoutPassword;
};
exports.updateCorporateByAdmin = updateCorporateByAdmin;
/* ============================================
    GET CORPORATE RIDES
============================================ */
const getCorporateRides = async (corporateId, filters) => {
    const where = { corporateId };
    if (filters?.status) {
        where.status = filters.status;
    }
    if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate)
            where.createdAt.gte = filters.startDate;
        if (filters.endDate)
            where.createdAt.lte = filters.endDate;
    }
    const rides = await prisma_1.prisma.ride.findMany({
        where,
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
    DELETE CORPORATE
============================================ */
const deleteCorporate = async (corporateId) => {
    // Check if corporate has rides
    const rideCount = await prisma_1.prisma.ride.count({
        where: { corporateId },
    });
    if (rideCount > 0) {
        throw new Error("Cannot delete corporate with existing rides. Consider suspending instead.");
    }
    // Check if corporate has billings
    const billingCount = await prisma_1.prisma.corporateBilling.count({
        where: { corporateId },
    });
    if (billingCount > 0) {
        throw new Error("Cannot delete corporate with existing billings.");
    }
    await prisma_1.prisma.corporate.delete({
        where: { id: corporateId },
    });
    return { message: "Corporate deleted successfully" };
};
exports.deleteCorporate = deleteCorporate;
