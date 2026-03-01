"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAgentCoupon = exports.updateAgentCoupon = exports.getAgentCouponById = exports.getAllAgentCoupons = exports.createAgentCoupon = void 0;
const prisma_1 = require("../../config/prisma");
const createAgentCoupon = async (data) => {
    // Check if coupon code already exists
    const existingCoupon = await prisma_1.prisma.agentCoupon.findUnique({
        where: { couponCode: data.couponCode },
    });
    if (existingCoupon) {
        throw new Error("Coupon code already exists");
    }
    // Check if agent exists by their assigned agentCode which acts as the coupon code
    const agent = await prisma_1.prisma.agent.findUnique({
        where: { agentCode: data.couponCode },
    });
    if (!agent) {
        throw new Error("No agent found with this designated coupon code. Please ensure the agentCode is updated first via the Agent profile.");
    }
    return await prisma_1.prisma.agentCoupon.create({
        data: {
            agentId: agent.id,
            couponCode: data.couponCode,
            description: data.description || null,
            discountValue: data.discountValue,
            minBookingAmount: data.minBookingAmount,
            maxDiscountAmount: data.maxDiscountAmount,
            validFrom: data.validFrom,
            validTo: data.validTo,
        },
        include: {
            agent: {
                select: {
                    id: true,
                    name: true,
                    customId: true,
                    phone: true,
                },
            },
        },
    });
};
exports.createAgentCoupon = createAgentCoupon;
const getAllAgentCoupons = async (filters) => {
    const where = {};
    if (filters?.agentId) {
        where.agentId = filters.agentId;
    }
    if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive;
    }
    return await prisma_1.prisma.agentCoupon.findMany({
        where,
        include: {
            agent: {
                select: {
                    id: true,
                    name: true,
                    customId: true,
                    phone: true,
                },
            },
        }
    });
};
exports.getAllAgentCoupons = getAllAgentCoupons;
const getAgentCouponById = async (id) => {
    const coupon = await prisma_1.prisma.agentCoupon.findUnique({
        where: { id },
        include: {
            agent: {
                select: {
                    id: true,
                    name: true,
                    customId: true,
                    phone: true,
                },
            },
        }
    });
    if (!coupon) {
        throw new Error("Coupon not found");
    }
    return coupon;
};
exports.getAgentCouponById = getAgentCouponById;
const updateAgentCoupon = async (id, data) => {
    return await prisma_1.prisma.agentCoupon.update({
        where: { id },
        data,
        include: {
            agent: {
                select: {
                    id: true,
                    name: true,
                    customId: true,
                    phone: true,
                },
            },
        }
    });
};
exports.updateAgentCoupon = updateAgentCoupon;
const deleteAgentCoupon = async (id) => {
    return await prisma_1.prisma.agentCoupon.delete({
        where: { id },
    });
};
exports.deleteAgentCoupon = deleteAgentCoupon;
