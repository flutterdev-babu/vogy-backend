"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserSpendSummary = exports.getActiveRide = exports.getUserRideSummary = exports.getUserUniqueOtp = exports.updateUserUniqueOtp = exports.updateUserProfile = exports.getUserProfile = void 0;
const prisma_1 = require("../../config/prisma");
const generateUniqueOtp_1 = require("../../utils/generateUniqueOtp");
/* ============================================
    GET USER PROFILE
============================================ */
const getUserProfile = async (userId) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            profileImage: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    if (!user) {
        throw new Error("User not found");
    }
    return user;
};
exports.getUserProfile = getUserProfile;
/* ============================================
    UPDATE USER PROFILE
============================================ */
const updateUserProfile = async (userId, data) => {
    // Check if user exists
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        throw new Error("User not found");
    }
    // Check if email is being updated and if it's already taken by another user
    if (data.email && data.email !== user.email) {
        const emailExists = await prisma_1.prisma.user.findUnique({
            where: { email: data.email },
        });
        if (emailExists) {
            throw new Error("Email is already registered");
        }
    }
    // Update user profile
    const updatedUser = await prisma_1.prisma.user.update({
        where: { id: userId },
        data: {
            ...(data.name && { name: data.name }),
            ...(data.email !== undefined && { email: data.email || null }),
            ...(data.profileImage !== undefined && {
                profileImage: data.profileImage || null,
            }),
        },
        select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            profileImage: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    return updatedUser;
};
exports.updateUserProfile = updateUserProfile;
/* ============================================
    UPDATE USER UNIQUE OTP
============================================ */
const updateUserUniqueOtp = async (userId) => {
    // Check if user exists
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        throw new Error("User not found");
    }
    // Generate new unique OTP
    const newUniqueOtp = await (0, generateUniqueOtp_1.generateUnique4DigitOtp)();
    // Update user's unique OTP
    const updatedUser = await prisma_1.prisma.user.update({
        where: { id: userId },
        data: {
            uniqueOtp: newUniqueOtp,
        },
        select: {
            id: true,
            name: true,
            phone: true,
            uniqueOtp: true,
            updatedAt: true,
        },
    });
    return updatedUser;
};
exports.updateUserUniqueOtp = updateUserUniqueOtp;
/* ============================================
    GET USER UNIQUE OTP (for user to see their OTP)
============================================ */
const getUserUniqueOtp = async (userId) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            phone: true,
            uniqueOtp: true,
        },
    });
    if (!user) {
        throw new Error("User not found");
    }
    return user;
};
exports.getUserUniqueOtp = getUserUniqueOtp;
/* ============================================
    GET USER RIDE SUMMARY / STATS
============================================ */
const getUserRideSummary = async (userId) => {
    const [totalRides, completedRides, cancelledRides, spending] = await Promise.all([
        prisma_1.prisma.ride.count({ where: { userId } }),
        prisma_1.prisma.ride.count({ where: { userId, status: "COMPLETED" } }),
        prisma_1.prisma.ride.count({ where: { userId, status: "CANCELLED" } }),
        prisma_1.prisma.ride.aggregate({
            where: { userId, status: "COMPLETED" },
            _sum: { totalFare: true },
            _avg: { totalFare: true },
        }),
    ]);
    return {
        totalRides,
        completedRides,
        cancelledRides,
        inProgress: totalRides - completedRides - cancelledRides,
        totalSpent: spending._sum.totalFare || 0,
        averageFare: spending._avg.totalFare ? parseFloat(spending._avg.totalFare.toFixed(2)) : 0,
    };
};
exports.getUserRideSummary = getUserRideSummary;
/* ============================================
    GET USER ACTIVE RIDE
============================================ */
const getActiveRide = async (userId) => {
    const ride = await prisma_1.prisma.ride.findFirst({
        where: {
            userId,
            status: {
                in: ["UPCOMING", "ACCEPTED", "ASSIGNED", "STARTED", "ARRIVED", "ONGOING"],
            },
        },
        include: {
            partner: {
                select: {
                    id: true,
                    customId: true,
                    name: true,
                    phone: true,
                    profileImage: true,
                    rating: true,
                    currentLat: true,
                    currentLng: true,
                    isOnline: true,
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
                select: { id: true, name: true, displayName: true, category: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });
    return ride || null;
};
exports.getActiveRide = getActiveRide;
/* ============================================
    GET USER SPEND SUMMARY
============================================ */
const getUserSpendSummary = async (userId) => {
    // By payment mode
    const byPaymentMode = await prisma_1.prisma.ride.groupBy({
        by: ["paymentMode"],
        where: { userId, status: "COMPLETED" },
        _count: true,
        _sum: { totalFare: true },
    });
    // By vehicle type
    const byVehicleType = await prisma_1.prisma.ride.groupBy({
        by: ["vehicleTypeId"],
        where: { userId, status: "COMPLETED", vehicleTypeId: { not: null } },
        _count: true,
        _sum: { totalFare: true },
    });
    // Fetch vehicle type names
    const vehicleTypeIds = byVehicleType.map((vt) => vt.vehicleTypeId).filter(Boolean);
    const vehicleTypes = await prisma_1.prisma.vehicleType.findMany({
        where: { id: { in: vehicleTypeIds } },
        select: { id: true, displayName: true, category: true },
    });
    const vehicleTypeMap = new Map(vehicleTypes.map((vt) => [vt.id, vt]));
    // Last 30 days monthly
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentRides = await prisma_1.prisma.ride.findMany({
        where: {
            userId,
            status: "COMPLETED",
            createdAt: { gte: thirtyDaysAgo },
        },
        select: {
            totalFare: true,
            createdAt: true,
        },
        orderBy: { createdAt: "asc" },
    });
    const dailySpend = {};
    recentRides.forEach((ride) => {
        const dateKey = ride.createdAt.toISOString().split("T")[0];
        if (!dailySpend[dateKey]) {
            dailySpend[dateKey] = { spent: 0, rides: 0 };
        }
        dailySpend[dateKey].spent += ride.totalFare || 0;
        dailySpend[dateKey].rides += 1;
    });
    return {
        byPaymentMode: byPaymentMode.map((pm) => ({
            mode: pm.paymentMode,
            count: pm._count,
            amount: pm._sum.totalFare || 0,
        })),
        byVehicleType: byVehicleType.map((vt) => ({
            vehicleTypeId: vt.vehicleTypeId,
            vehicleType: vehicleTypeMap.get(vt.vehicleTypeId || "") || null,
            count: vt._count,
            amount: vt._sum.totalFare || 0,
        })),
        dailySpend: Object.entries(dailySpend).map(([date, data]) => ({
            date,
            ...data,
        })),
    };
};
exports.getUserSpendSummary = getUserSpendSummary;
