"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVendorEarnings = exports.getVendorRideById = exports.getVendorAttachments = exports.getVendorDashboard = exports.deleteVendor = exports.getVendorAnalytics = exports.getVendorRides = exports.getVendorVehicles = exports.updateVendorByAdmin = exports.updateVendorVerification = exports.updateVendorStatus = exports.getVendorById = exports.getAllVendors = void 0;
const prisma_1 = require("../../config/prisma");
/* ============================================
    GET ALL VENDORS
============================================ */
const getAllVendors = async (filters) => {
    const where = {
        isDeleted: filters?.includeDeleted ? undefined : { not: true },
    };
    if (filters?.type) {
        where.type = filters.type;
    }
    if (filters?.vendorId) {
        where.OR = [
            { id: filters.vendorId },
            { customId: filters.vendorId }
        ];
    }
    if (filters?.cityCodeId) {
        where.cityCodeId = filters.cityCodeId;
    }
    if (filters?.status) {
        where.status = filters.status;
    }
    if (filters?.agentId) {
        where.agentId = filters.agentId;
    }
    if (filters?.search) {
        where.OR = [
            { name: { contains: filters.search, mode: "insensitive" } },
            { companyName: { contains: filters.search, mode: "insensitive" } },
            { phone: { contains: filters.search } },
            { email: { contains: filters.search, mode: "insensitive" } },
        ];
    }
    const vendors = await prisma_1.prisma.vendor.findMany({
        where,
        select: {
            id: true,
            customId: true,
            name: true,
            companyName: true,
            phone: true,
            email: true,
            address: true,
            status: true,
            verificationStatus: true,
            gstNumber: true,
            panNumber: true,
            agent: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                },
            },
            _count: {
                select: {
                    vehicles: true,
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
    return vendors;
};
exports.getAllVendors = getAllVendors;
/* ============================================
    GET VENDOR BY ID
============================================ */
const getVendorById = async (vendorId) => {
    const vendor = await prisma_1.prisma.vendor.findFirst({
        where: { id: vendorId, isDeleted: false },
        include: {
            agent: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
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
                            pricePerKm: true,
                        },
                    },
                    partner: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                            status: true,
                            isOnline: true,
                        },
                    },
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
exports.getVendorById = getVendorById;
/* ============================================
    UPDATE VENDOR STATUS (Admin)
============================================ */
const updateVendorStatus = async (vendorId, status, adminId) => {
    const vendor = await prisma_1.prisma.vendor.update({
        where: { id: vendorId },
        data: {
            status,
            ...(adminId && { updatedByAdminId: adminId })
        },
        select: {
            id: true,
            name: true,
            companyName: true,
            phone: true,
            status: true,
            customId: true,
            updatedAt: true,
        },
    });
    return vendor;
};
exports.updateVendorStatus = updateVendorStatus;
/* ============================================
    UPDATE VENDOR VERIFICATION (Admin)
============================================ */
const updateVendorVerification = async (vendorId, verificationStatus, adminId) => {
    const vendor = await prisma_1.prisma.vendor.update({
        where: { id: vendorId },
        data: {
            verificationStatus,
            ...(adminId && { updatedByAdminId: adminId })
        },
        select: {
            id: true,
            name: true,
            companyName: true,
            verificationStatus: true,
            customId: true,
            updatedAt: true,
        },
    });
    return vendor;
};
exports.updateVendorVerification = updateVendorVerification;
/* ============================================
    UPDATE VENDOR BY ADMIN
============================================ */
const updateVendorByAdmin = async (vendorId, data) => {
    // Validate agentId if provided
    if (data.agentId) {
        const agent = await prisma_1.prisma.agent.findUnique({
            where: { id: data.agentId },
        });
        if (!agent)
            throw new Error("Invalid agent ID");
    }
    const { updatedByAdminId, ...updateData } = data;
    const vendor = await prisma_1.prisma.vendor.update({
        where: { id: vendorId },
        data: {
            ...updateData,
            ...(updatedByAdminId && { updatedByAdminId }),
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
    const { password, ...vendorWithoutPassword } = vendor;
    return vendorWithoutPassword;
};
exports.updateVendorByAdmin = updateVendorByAdmin;
/* ============================================
    GET VENDOR VEHICLES
============================================ */
const getVendorVehicles = async (vendorId) => {
    const vehicles = await prisma_1.prisma.vehicle.findMany({
        where: { vendorId },
        include: {
            vehicleType: {
                select: {
                    id: true,
                    name: true,
                    displayName: true,
                    category: true,
                    pricePerKm: true,
                },
            },
            partner: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    status: true,
                    isOnline: true,
                },
            },
            _count: {
                select: {
                    rides: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    return vehicles;
};
exports.getVendorVehicles = getVendorVehicles;
/* ============================================
    GET VENDOR RIDES
============================================ */
const getVendorRides = async (vendorId, filters) => {
    const where = {
        OR: [
            { vendorId: vendorId },
            {
                partner: {
                    vehicle: {
                        vendorId: vendorId
                    }
                }
            }
        ]
    };
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
exports.getVendorRides = getVendorRides;
/* ============================================
    GET VENDOR ANALYTICS
============================================ */
const getVendorAnalytics = async (vendorId) => {
    // Get vehicle counts
    const [totalVehicles, availableVehicles] = await Promise.all([
        prisma_1.prisma.vehicle.count({ where: { vendorId } }),
        prisma_1.prisma.vehicle.count({ where: { vendorId, isAvailable: true } }),
    ]);
    // Get ride counts
    const [totalRides, completedRides, cancelledRides, pendingRides] = await Promise.all([
        prisma_1.prisma.ride.count({ where: { vendorId } }),
        prisma_1.prisma.ride.count({ where: { vendorId, status: "COMPLETED" } }),
        prisma_1.prisma.ride.count({ where: { vendorId, status: "CANCELLED" } }),
        prisma_1.prisma.ride.count({ where: { vendorId, status: "PENDING" } }),
    ]);
    // Get revenue stats
    const revenueData = await prisma_1.prisma.ride.aggregate({
        where: { vendorId, status: "COMPLETED" },
        _sum: {
            totalFare: true,
            riderEarnings: true,
            commission: true,
        },
    });
    // Get partner counts
    const partnerCount = await prisma_1.prisma.partner.count({
        where: {
            vehicle: {
                vendorId,
            },
        },
    });
    // Get rides by payment mode
    const ridesByPaymentMode = await prisma_1.prisma.ride.groupBy({
        by: ["paymentMode"],
        where: { vendorId, status: "COMPLETED" },
        _count: true,
        _sum: {
            totalFare: true,
        },
    });
    return {
        vehicles: {
            total: totalVehicles,
            available: availableVehicles,
            inUse: totalVehicles - availableVehicles,
        },
        partners: partnerCount,
        rides: {
            total: totalRides,
            completed: completedRides,
            cancelled: cancelledRides,
            pending: pendingRides,
        },
        revenue: {
            total: revenueData._sum.totalFare || 0,
            earnings: revenueData._sum.riderEarnings || 0,
            commission: revenueData._sum.commission || 0,
        },
        ridesByPaymentMode,
    };
};
exports.getVendorAnalytics = getVendorAnalytics;
/* ============================================
    DELETE VENDOR
============================================ */
const deleteVendor = async (vendorId, adminId) => {
    // Soft delete
    await prisma_1.prisma.vendor.update({
        where: { id: vendorId },
        data: {
            isDeleted: true,
            status: "BANNED",
            ...(adminId && { updatedByAdminId: adminId })
        },
    });
    return { message: "Vendor soft-deleted successfully" };
};
exports.deleteVendor = deleteVendor;
/* ============================================
    VENDOR DASHBOARD (Vendor's own view)
============================================ */
const getVendorDashboard = async (vendorId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [totalVehicles, availableVehicles, totalPartners, onlinePartners, totalRides, completedRides, cancelledRides, activeRides, todayRides, revenueData,] = await Promise.all([
        prisma_1.prisma.vehicle.count({ where: { vendorId } }),
        prisma_1.prisma.vehicle.count({ where: { vendorId, isAvailable: true } }),
        prisma_1.prisma.partner.count({ where: { vendorId } }),
        prisma_1.prisma.partner.count({ where: { vendorId, isOnline: true } }),
        prisma_1.prisma.ride.count({ where: { vendorId } }),
        prisma_1.prisma.ride.count({ where: { vendorId, status: "COMPLETED" } }),
        prisma_1.prisma.ride.count({ where: { vendorId, status: "CANCELLED" } }),
        prisma_1.prisma.ride.count({
            where: {
                vendorId,
                status: { in: ["ACCEPTED", "ASSIGNED", "STARTED", "ARRIVED", "ONGOING"] },
            },
        }),
        prisma_1.prisma.ride.count({
            where: { vendorId, createdAt: { gte: today } },
        }),
        prisma_1.prisma.ride.aggregate({
            where: { vendorId, status: "COMPLETED" },
            _sum: { totalFare: true, riderEarnings: true, commission: true },
        }),
    ]);
    // Today's revenue
    const todayRevenue = await prisma_1.prisma.ride.aggregate({
        where: { vendorId, status: "COMPLETED", createdAt: { gte: today } },
        _sum: { totalFare: true },
    });
    return {
        vehicles: {
            total: totalVehicles,
            available: availableVehicles,
            inUse: totalVehicles - availableVehicles,
        },
        partners: {
            total: totalPartners,
            online: onlinePartners,
            offline: totalPartners - onlinePartners,
        },
        rides: {
            total: totalRides,
            completed: completedRides,
            cancelled: cancelledRides,
            active: activeRides,
            today: todayRides,
        },
        revenue: {
            total: revenueData._sum.totalFare || 0,
            earnings: revenueData._sum.riderEarnings || 0,
            commission: revenueData._sum.commission || 0,
            today: todayRevenue._sum.totalFare || 0,
        },
    };
};
exports.getVendorDashboard = getVendorDashboard;
/* ============================================
    GET VENDOR ATTACHMENTS (Vendor's own)
============================================ */
const getVendorAttachments = async (vendorId) => {
    return await prisma_1.prisma.attachment.findMany({
        where: {
            referenceId: vendorId,
            referenceType: "VENDOR"
        },
        orderBy: { createdAt: "desc" },
    });
};
exports.getVendorAttachments = getVendorAttachments;
/* ============================================
    GET VENDOR RIDE BY ID (Scoped to vendor)
============================================ */
const getVendorRideById = async (vendorId, rideId) => {
    const ride = await prisma_1.prisma.ride.findFirst({
        where: {
            id: rideId,
            vendorId: vendorId,
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
        throw new Error("Ride not found or does not belong to this vendor");
    return ride;
};
exports.getVendorRideById = getVendorRideById;
/* ============================================
    GET VENDOR EARNINGS SUMMARY
============================================ */
const getVendorEarnings = async (vendorId, period) => {
    // Overall earnings
    const totalEarnings = await prisma_1.prisma.ride.aggregate({
        where: { vendorId, status: "COMPLETED" },
        _sum: { totalFare: true, riderEarnings: true, commission: true },
        _count: true,
    });
    // By payment mode
    const byPaymentMode = await prisma_1.prisma.ride.groupBy({
        by: ["paymentMode"],
        where: { vendorId, status: "COMPLETED" },
        _count: true,
        _sum: { totalFare: true },
    });
    // Last 30 days daily breakdown
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentRides = await prisma_1.prisma.ride.findMany({
        where: {
            vendorId,
            status: "COMPLETED",
            createdAt: { gte: thirtyDaysAgo },
        },
        select: {
            totalFare: true,
            riderEarnings: true,
            commission: true,
            createdAt: true,
        },
        orderBy: { createdAt: "asc" },
    });
    // Group by date
    const dailyBreakdown = {};
    recentRides.forEach((ride) => {
        const dateKey = ride.createdAt.toISOString().split("T")[0];
        if (!dailyBreakdown[dateKey]) {
            dailyBreakdown[dateKey] = { revenue: 0, rides: 0 };
        }
        dailyBreakdown[dateKey].revenue += ride.totalFare || 0;
        dailyBreakdown[dateKey].rides += 1;
    });
    return {
        total: {
            revenue: totalEarnings._sum.totalFare || 0,
            partnerEarnings: totalEarnings._sum.riderEarnings || 0,
            commission: totalEarnings._sum.commission || 0,
            completedRides: totalEarnings._count,
        },
        byPaymentMode: byPaymentMode.map((pm) => ({
            mode: pm.paymentMode,
            count: pm._count,
            amount: pm._sum.totalFare || 0,
        })),
        dailyBreakdown: Object.entries(dailyBreakdown).map(([date, data]) => ({
            date,
            ...data,
        })),
    };
};
exports.getVendorEarnings = getVendorEarnings;
