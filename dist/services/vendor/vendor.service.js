"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVendor = exports.getVendorAnalytics = exports.getVendorRides = exports.getVendorVehicles = exports.updateVendorByAdmin = exports.updateVendorStatus = exports.getVendorById = exports.getAllVendors = void 0;
const prisma_1 = require("../../config/prisma");
/* ============================================
    GET ALL VENDORS
============================================ */
const getAllVendors = async (filters) => {
    const where = {};
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
            profileImage: true,
            status: true,
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
    const vendor = await prisma_1.prisma.vendor.findUnique({
        where: { id: vendorId },
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
const updateVendorStatus = async (vendorId, status) => {
    const vendor = await prisma_1.prisma.vendor.update({
        where: { id: vendorId },
        data: { status },
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
    const vendor = await prisma_1.prisma.vendor.update({
        where: { id: vendorId },
        data: {
            ...(data.name && { name: data.name }),
            ...(data.companyName && { companyName: data.companyName }),
            ...(data.email !== undefined && { email: data.email }),
            ...(data.address !== undefined && { address: data.address }),
            ...(data.status && { status: data.status }),
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
const deleteVendor = async (vendorId) => {
    // Check if vendor has vehicles
    const vehicleCount = await prisma_1.prisma.vehicle.count({
        where: { vendorId },
    });
    if (vehicleCount > 0) {
        throw new Error("Cannot delete vendor with existing vehicles. Please remove vehicles first.");
    }
    // Check if vendor has rides
    const rideCount = await prisma_1.prisma.ride.count({
        where: { vendorId },
    });
    if (rideCount > 0) {
        throw new Error("Cannot delete vendor with existing rides. Consider suspending instead.");
    }
    await prisma_1.prisma.vendor.delete({
        where: { id: vendorId },
    });
    return { message: "Vendor deleted successfully" };
};
exports.deleteVendor = deleteVendor;
