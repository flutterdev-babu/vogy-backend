"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPartnerEarnings = exports.getPartnerRideById = exports.getPartnerVehicleInfo = exports.getPartnerDashboard = exports.deletePartner = exports.getAvailablePartners = exports.getPartnerAnalytics = exports.getPartnerRides = exports.unassignPartnerFromVehicle = exports.assignPartnerToVehicle = exports.updatePartnerByAdmin = exports.updatePartnerVerification = exports.updatePartnerStatus = exports.getPartnerById = exports.getAllPartners = void 0;
const prisma_1 = require("../../config/prisma");
/* ============================================
    GET ALL PARTNERS
============================================ */
const getAllPartners = async (filters) => {
    const where = {
        isDeleted: filters?.includeDeleted ? undefined : { not: true },
    };
    if (filters?.cityCodeId) {
        where.cityCodeId = filters.cityCodeId;
    }
    if (filters?.status) {
        where.status = filters.status;
    }
    if (filters?.verificationStatus) {
        where.verificationStatus = filters.verificationStatus;
    }
    if (filters?.vendorId) {
        where.vendorId = filters.vendorId;
    }
    if (filters?.isOnline !== undefined) {
        where.isOnline = filters.isOnline;
    }
    if (filters?.search) {
        where.OR = [
            { name: { contains: filters.search, mode: "insensitive" } },
            { phone: { contains: filters.search } },
            { email: { contains: filters.search, mode: "insensitive" } },
        ];
    }
    const partners = await prisma_1.prisma.partner.findMany({
        where,
        select: {
            id: true,
            customId: true,
            name: true,
            phone: true,
            email: true,
            profileImage: true,
            licenseNumber: true,
            licenseImage: true,
            hasLicense: true,
            status: true,
            verificationStatus: true,
            isOnline: true,
            currentLat: true,
            currentLng: true,
            rating: true,
            totalEarnings: true,
            panNumber: true,
            aadhaarNumber: true,
            hasOwnVehicle: true,
            ownVehicleNumber: true,
            ownVehicleModel: true,
            ownVehicleTypeId: true,
            ownVehicleType: {
                select: {
                    id: true,
                    name: true,
                    displayName: true,
                    category: true,
                }
            },
            vehicle: {
                select: {
                    id: true,
                    registrationNumber: true,
                    vehicleModel: true,
                    vendor: {
                        select: {
                            id: true,
                            customId: true,
                            name: true,
                            companyName: true,
                        },
                    },
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
    return partners;
};
exports.getAllPartners = getAllPartners;
/* ============================================
    GET PARTNER BY ID
============================================ */
const getPartnerById = async (partnerId) => {
    const partner = await prisma_1.prisma.partner.findFirst({
        where: { id: partnerId, isDeleted: false },
        include: {
            vehicle: {
                include: {
                    vendor: {
                        select: {
                            id: true,
                            customId: true,
                            name: true,
                            companyName: true,
                            phone: true,
                        },
                    },
                    vehicleType: {
                        select: {
                            id: true,
                            name: true,
                            displayName: true,
                            category: true,
                            pricePerKm: true,
                        },
                    },
                },
            },
            ownVehicleType: true,
            cityCode: true,
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
exports.getPartnerById = getPartnerById;
/* ============================================
    UPDATE PARTNER STATUS (Admin)
============================================ */
const updatePartnerStatus = async (partnerId, status, adminId) => {
    const partner = await prisma_1.prisma.partner.update({
        where: { id: partnerId },
        data: {
            status,
            ...(adminId && { updatedByAdminId: adminId })
        },
        select: {
            id: true,
            name: true,
            phone: true,
            status: true,
            customId: true,
            updatedAt: true,
        },
    });
    return partner;
};
exports.updatePartnerStatus = updatePartnerStatus;
/* ============================================
    UPDATE PARTNER VERIFICATION (Admin)
============================================ */
const updatePartnerVerification = async (partnerId, verificationStatus, adminId) => {
    const partner = await prisma_1.prisma.partner.update({
        where: { id: partnerId },
        data: {
            verificationStatus,
            ...(adminId && { updatedByAdminId: adminId })
        },
        select: {
            id: true,
            name: true,
            phone: true,
            verificationStatus: true,
            updatedAt: true,
        },
    });
    return partner;
};
exports.updatePartnerVerification = updatePartnerVerification;
/* ============================================
    UPDATE PARTNER BY ADMIN
============================================ */
const updatePartnerByAdmin = async (partnerId, data) => {
    const { updatedByAdminId, ...updateData } = data;
    if (data.firstName && data.lastName) {
        updateData.name = `${data.firstName} ${data.lastName}`;
    }
    const partner = await prisma_1.prisma.partner.update({
        where: { id: partnerId },
        data: {
            ...updateData,
            ...(updatedByAdminId && { updatedByAdminId }),
        },
        include: {
            vehicle: {
                include: {
                    vendor: {
                        select: {
                            id: true,
                            customId: true, // ADDED
                            name: true,
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
            },
        },
    });
    // Remove password from response
    const { password, ...partnerWithoutPassword } = partner;
    return partnerWithoutPassword;
};
exports.updatePartnerByAdmin = updatePartnerByAdmin;
/* ============================================
    ASSIGN PARTNER TO VEHICLE
============================================ */
const assignPartnerToVehicle = async (partnerId, vehicleId) => {
    // Check if partner exists
    const partner = await prisma_1.prisma.partner.findUnique({
        where: { id: partnerId },
    });
    if (!partner)
        throw new Error("Partner not found");
    // Check if vehicle exists
    const vehicle = await prisma_1.prisma.vehicle.findUnique({
        where: { id: vehicleId },
        include: {
            partner: true,
        },
    });
    if (!vehicle)
        throw new Error("Vehicle not found");
    // Check if vehicle is already assigned to another partner
    if (vehicle.partner && vehicle.partner.id !== partnerId) {
        throw new Error("Vehicle is already assigned to another partner");
    }
    // Check if partner is already assigned to another vehicle
    if (partner.vehicleId && partner.vehicleId !== vehicleId) {
        throw new Error("Partner is already assigned to another vehicle. Unassign first.");
    }
    // Assign partner to vehicle
    const updatedPartner = await prisma_1.prisma.partner.update({
        where: { id: partnerId },
        data: { vehicleId },
        include: {
            vehicle: {
                include: {
                    vendor: {
                        select: {
                            id: true,
                            customId: true, // ADDED
                            name: true,
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
            },
        },
    });
    // Remove password from response
    const { password, ...partnerWithoutPassword } = updatedPartner;
    return partnerWithoutPassword;
};
exports.assignPartnerToVehicle = assignPartnerToVehicle;
/* ============================================
    UNASSIGN PARTNER FROM VEHICLE
============================================ */
const unassignPartnerFromVehicle = async (partnerId) => {
    const partner = await prisma_1.prisma.partner.update({
        where: { id: partnerId },
        data: { vehicleId: null },
        select: {
            id: true,
            name: true,
            phone: true,
            vehicleId: true,
        },
    });
    return partner;
};
exports.unassignPartnerFromVehicle = unassignPartnerFromVehicle;
/* ============================================
    GET PARTNER RIDES
============================================ */
const getPartnerRides = async (partnerId, filters) => {
    const where = { partnerId };
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
                    category: true,
                    pricePerKm: true,
                    baseFare: true,
                },
            },
            user: {
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
                    contactPerson: true,
                    phone: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    return rides;
};
exports.getPartnerRides = getPartnerRides;
/* ============================================
    GET PARTNER ANALYTICS
============================================ */
const getPartnerAnalytics = async (partnerId) => {
    // Get ride counts
    const [totalRides, completedRides, cancelledRides] = await Promise.all([
        prisma_1.prisma.ride.count({ where: { partnerId } }),
        prisma_1.prisma.ride.count({ where: { partnerId, status: "COMPLETED" } }),
        prisma_1.prisma.ride.count({ where: { partnerId, status: "CANCELLED" } }),
    ]);
    // Get earnings
    const earningsData = await prisma_1.prisma.ride.aggregate({
        where: { partnerId, status: "COMPLETED" },
        _sum: {
            riderEarnings: true,
            totalFare: true,
        },
    });
    // Get partner details
    const partner = await prisma_1.prisma.partner.findUnique({
        where: { id: partnerId },
        select: {
            rating: true,
            totalEarnings: true,
        },
    });
    return {
        rides: {
            total: totalRides,
            completed: completedRides,
            cancelled: cancelledRides,
            completionRate: totalRides > 0 ? ((completedRides / totalRides) * 100).toFixed(2) : 0,
        },
        earnings: {
            sessionEarnings: earningsData._sum.riderEarnings || 0,
            totalFare: earningsData._sum.totalFare || 0,
            totalEarnings: partner?.totalEarnings || 0,
        },
        rating: partner?.rating || 5,
    };
};
exports.getPartnerAnalytics = getPartnerAnalytics;
/* ============================================
    GET AVAILABLE PARTNERS
============================================ */
const getAvailablePartners = async (vehicleTypeId) => {
    const where = {
        status: "ACTIVE",
        verificationStatus: "VERIFIED",
        isOnline: true,
        vehicleId: { not: null },
        attachments: {
            some: {
                verificationStatus: "VERIFIED",
            },
        },
    };
    if (vehicleTypeId) {
        where.vehicle = {
            vehicleTypeId,
            isAvailable: true,
        };
    }
    const partners = await prisma_1.prisma.partner.findMany({
        where,
        select: {
            id: true,
            name: true,
            phone: true,
            currentLat: true,
            currentLng: true,
            rating: true,
            vehicle: {
                select: {
                    id: true,
                    registrationNumber: true,
                    vehicleModel: true,
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
    return partners;
};
exports.getAvailablePartners = getAvailablePartners;
/* ============================================
    DELETE PARTNER
============================================ */
const deletePartner = async (partnerId, adminId) => {
    // Soft delete
    await prisma_1.prisma.partner.update({
        where: { id: partnerId },
        data: {
            isDeleted: true,
            status: "BANNED",
            ...(adminId && { updatedByAdminId: adminId })
        },
    });
    return { message: "Partner soft-deleted successfully" };
};
exports.deletePartner = deletePartner;
/* ============================================
    PARTNER DASHBOARD (Partner's own view)
============================================ */
const getPartnerDashboard = async (partnerId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [totalRides, completedRides, cancelledRides, activeRides, todayRides, earningsData, todayEarnings, partner,] = await Promise.all([
        prisma_1.prisma.ride.count({ where: { partnerId } }),
        prisma_1.prisma.ride.count({ where: { partnerId, status: "COMPLETED" } }),
        prisma_1.prisma.ride.count({ where: { partnerId, status: "CANCELLED" } }),
        prisma_1.prisma.ride.count({
            where: {
                partnerId,
                status: { in: ["ACCEPTED", "ASSIGNED", "STARTED", "ARRIVED", "ONGOING"] },
            },
        }),
        prisma_1.prisma.ride.count({
            where: { partnerId, createdAt: { gte: today } },
        }),
        prisma_1.prisma.ride.aggregate({
            where: { partnerId, status: "COMPLETED" },
            _sum: { totalFare: true, riderEarnings: true },
        }),
        prisma_1.prisma.ride.aggregate({
            where: { partnerId, status: "COMPLETED", createdAt: { gte: today } },
            _sum: { riderEarnings: true, totalFare: true },
        }),
        prisma_1.prisma.partner.findUnique({
            where: { id: partnerId },
            select: {
                isOnline: true,
                rating: true,
                totalEarnings: true,
                vehicle: {
                    select: {
                        id: true,
                        customId: true,
                        registrationNumber: true,
                        vehicleModel: true,
                        vehicleType: {
                            select: { displayName: true, category: true },
                        },
                    },
                },
            },
        }),
    ]);
    return {
        status: {
            isOnline: partner?.isOnline || false,
            rating: partner?.rating || 5,
        },
        rides: {
            total: totalRides,
            completed: completedRides,
            cancelled: cancelledRides,
            active: activeRides,
            today: todayRides,
            completionRate: totalRides > 0 ? ((completedRides / totalRides) * 100).toFixed(2) : "0",
        },
        earnings: {
            total: partner?.totalEarnings || 0,
            sessionEarnings: earningsData._sum.riderEarnings || 0,
            totalFare: earningsData._sum.totalFare || 0,
            todayEarnings: todayEarnings._sum.riderEarnings || 0,
            todayFare: todayEarnings._sum.totalFare || 0,
        },
        assignedVehicle: partner?.vehicle || null,
    };
};
exports.getPartnerDashboard = getPartnerDashboard;
/* ============================================
    GET PARTNER VEHICLE INFO
============================================ */
const getPartnerVehicleInfo = async (partnerId) => {
    const partner = await prisma_1.prisma.partner.findUnique({
        where: { id: partnerId },
        select: {
            vehicleId: true,
            hasOwnVehicle: true,
            ownVehicleNumber: true,
            ownVehicleModel: true,
            ownVehicleType: {
                select: {
                    id: true,
                    name: true,
                    displayName: true,
                    category: true,
                },
            },
            vehicle: {
                include: {
                    vendor: {
                        select: {
                            id: true,
                            customId: true,
                            name: true,
                            companyName: true,
                            phone: true,
                            address: true,
                            email: true,
                        },
                    },
                    vehicleType: {
                        select: {
                            id: true,
                            name: true,
                            displayName: true,
                            category: true,
                            pricePerKm: true,
                            baseFare: true,
                        },
                    },
                    attachments: true,
                },
            },
        },
    });
    if (!partner)
        throw new Error("Partner not found");
    return {
        hasOwnVehicle: partner.hasOwnVehicle,
        ownVehicle: partner.hasOwnVehicle
            ? {
                number: partner.ownVehicleNumber,
                model: partner.ownVehicleModel,
                vehicleType: partner.ownVehicleType,
            }
            : null,
        assignedVehicle: partner.vehicle || null,
    };
};
exports.getPartnerVehicleInfo = getPartnerVehicleInfo;
/* ============================================
    GET PARTNER RIDE BY ID (Scoped to partner)
============================================ */
const getPartnerRideById = async (partnerId, rideId) => {
    const ride = await prisma_1.prisma.ride.findFirst({
        where: {
            id: rideId,
            partnerId: partnerId,
        },
        include: {
            vendor: {
                select: {
                    id: true,
                    customId: true,
                    name: true,
                    companyName: true,
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
            user: {
                select: { id: true, name: true, phone: true },
            },
            corporate: {
                select: { id: true, companyName: true },
            },
        },
    });
    if (!ride)
        throw new Error("Ride not found or does not belong to this partner");
    return ride;
};
exports.getPartnerRideById = getPartnerRideById;
/* ============================================
    GET PARTNER EARNINGS SUMMARY
============================================ */
const getPartnerEarnings = async (partnerId) => {
    // Overall earnings
    const totalEarnings = await prisma_1.prisma.ride.aggregate({
        where: { partnerId, status: "COMPLETED" },
        _sum: { totalFare: true, riderEarnings: true },
        _count: true,
    });
    // By payment mode
    const byPaymentMode = await prisma_1.prisma.ride.groupBy({
        by: ["paymentMode"],
        where: { partnerId, status: "COMPLETED" },
        _count: true,
        _sum: { riderEarnings: true },
    });
    // Last 30 days daily breakdown
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentRides = await prisma_1.prisma.ride.findMany({
        where: {
            partnerId,
            status: "COMPLETED",
            createdAt: { gte: thirtyDaysAgo },
        },
        select: {
            totalFare: true,
            riderEarnings: true,
            createdAt: true,
        },
        orderBy: { createdAt: "asc" },
    });
    // Group by date
    const dailyBreakdown = {};
    recentRides.forEach((ride) => {
        const dateKey = ride.createdAt.toISOString().split("T")[0];
        if (!dailyBreakdown[dateKey]) {
            dailyBreakdown[dateKey] = { earnings: 0, rides: 0 };
        }
        dailyBreakdown[dateKey].earnings += ride.riderEarnings || 0;
        dailyBreakdown[dateKey].rides += 1;
    });
    return {
        total: {
            earnings: totalEarnings._sum.riderEarnings || 0,
            totalFare: totalEarnings._sum.totalFare || 0,
            completedRides: totalEarnings._count,
        },
        byPaymentMode: byPaymentMode.map((pm) => ({
            mode: pm.paymentMode,
            count: pm._count,
            earnings: pm._sum.riderEarnings || 0,
        })),
        dailyBreakdown: Object.entries(dailyBreakdown).map(([date, data]) => ({
            date,
            ...data,
        })),
    };
};
exports.getPartnerEarnings = getPartnerEarnings;
