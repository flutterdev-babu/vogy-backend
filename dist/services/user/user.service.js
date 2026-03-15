"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyReferralCode = exports.getUserReferralCode = exports.updateEmergencyContacts = exports.getEmergencyContacts = exports.updateSavedPlaces = exports.getSavedPlaces = exports.getUserSpendSummary = exports.getActiveRide = exports.getUserRideSummary = exports.getUserUniqueOtp = exports.updateUserUniqueOtp = exports.updateUserProfile = exports.getUserProfile = void 0;
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
            uniqueOtp: true,
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
/* ============================================
    SAVED PLACES
============================================ */
const getSavedPlaces = async (userId) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: { savedPlaces: true },
    });
    if (!user)
        throw new Error("User not found");
    return user.savedPlaces || [];
};
exports.getSavedPlaces = getSavedPlaces;
const updateSavedPlaces = async (userId, places) => {
    const user = await prisma_1.prisma.user.update({
        where: { id: userId },
        data: { savedPlaces: places },
        select: { savedPlaces: true },
    });
    return user.savedPlaces || [];
};
exports.updateSavedPlaces = updateSavedPlaces;
/* ============================================
    EMERGENCY CONTACTS
============================================ */
const getEmergencyContacts = async (userId) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: { emergencyContacts: true, safetyPrefs: true },
    });
    if (!user)
        throw new Error("User not found");
    return {
        contacts: user.emergencyContacts || [],
        safetyPrefs: user.safetyPrefs || {},
    };
};
exports.getEmergencyContacts = getEmergencyContacts;
const updateEmergencyContacts = async (userId, contacts, safetyPrefs) => {
    const data = { emergencyContacts: contacts };
    if (safetyPrefs !== undefined)
        data.safetyPrefs = safetyPrefs;
    const user = await prisma_1.prisma.user.update({
        where: { id: userId },
        data,
        select: { emergencyContacts: true, safetyPrefs: true },
    });
    return {
        contacts: user.emergencyContacts || [],
        safetyPrefs: user.safetyPrefs || {},
    };
};
exports.updateEmergencyContacts = updateEmergencyContacts;
/* ============================================
    REFERRAL CODE
============================================ */
const generateReferralCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "VOGY";
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};
const getUserReferralCode = async (userId) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: { referralCode: true, name: true },
    });
    if (!user)
        throw new Error("User not found");
    // If no referral code yet, generate one
    if (!user.referralCode) {
        let code = generateReferralCode();
        let attempts = 0;
        while (attempts < 10) {
            const exists = await prisma_1.prisma.user.findFirst({ where: { referralCode: code } });
            if (!exists)
                break;
            code = generateReferralCode();
            attempts++;
        }
        const updated = await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { referralCode: code },
            select: { referralCode: true, name: true },
        });
        return updated;
    }
    return user;
};
exports.getUserReferralCode = getUserReferralCode;
const applyReferralCode = async (userId, referralCode) => {
    const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user)
        throw new Error("User not found");
    if (user.referredBy)
        throw new Error("You have already used a referral code");
    // Find referrer
    const referrer = await prisma_1.prisma.user.findFirst({
        where: { referralCode: referralCode.toUpperCase() },
    });
    if (!referrer)
        throw new Error("Invalid referral code");
    if (referrer.id === userId)
        throw new Error("You cannot refer yourself");
    await prisma_1.prisma.user.update({
        where: { id: userId },
        data: { referredBy: referralCode.toUpperCase() },
    });
    return { message: "Referral code applied successfully!" };
};
exports.applyReferralCode = applyReferralCode;
