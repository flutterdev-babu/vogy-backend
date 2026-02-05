"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePartner = exports.getAvailablePartners = exports.getPartnerAnalytics = exports.getPartnerRides = exports.unassignPartnerFromVehicle = exports.assignPartnerToVehicle = exports.updatePartnerByAdmin = exports.updatePartnerStatus = exports.getPartnerById = exports.getAllPartners = void 0;
const prisma_1 = require("../../config/prisma");
/* ============================================
    GET ALL PARTNERS
============================================ */
const getAllPartners = async (filters) => {
    const where = {};
    if (filters?.status) {
        where.status = filters.status;
    }
    if (filters?.vendorId) {
        where.vehicle = {
            vendorId: filters.vendorId,
        };
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
            aadharNumber: true,
            licenseNumber: true,
            status: true,
            isOnline: true,
            currentLat: true,
            currentLng: true,
            rating: true,
            totalEarnings: true,
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
    const partner = await prisma_1.prisma.partner.findUnique({
        where: { id: partnerId },
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
const updatePartnerStatus = async (partnerId, status) => {
    const partner = await prisma_1.prisma.partner.update({
        where: { id: partnerId },
        data: { status },
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
    UPDATE PARTNER BY ADMIN
============================================ */
const updatePartnerByAdmin = async (partnerId, data) => {
    const partner = await prisma_1.prisma.partner.update({
        where: { id: partnerId },
        data: {
            ...(data.name && { name: data.name }),
            ...(data.email !== undefined && { email: data.email }),
            ...(data.aadharNumber !== undefined && { aadharNumber: data.aadharNumber }),
            ...(data.licenseNumber !== undefined && { licenseNumber: data.licenseNumber }),
            ...(data.licenseImage !== undefined && { licenseImage: data.licenseImage }),
            ...(data.status && { status: data.status }),
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
        status: "APPROVED",
        isOnline: true,
        vehicleId: { not: null },
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
const deletePartner = async (partnerId) => {
    // Check if partner has rides
    const rideCount = await prisma_1.prisma.ride.count({
        where: { partnerId },
    });
    if (rideCount > 0) {
        throw new Error("Cannot delete partner with existing rides. Consider suspending instead.");
    }
    await prisma_1.prisma.partner.delete({
        where: { id: partnerId },
    });
    return { message: "Partner deleted successfully" };
};
exports.deletePartner = deletePartner;
