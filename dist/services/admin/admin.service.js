"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserById = exports.getAllUsers = exports.updateUserUniqueOtpByAdmin = exports.getRideById = exports.getAllRides = exports.assignPartnerToRide = exports.getScheduledRides = exports.getPartnerById = exports.getAllPartners = exports.updatePricingConfig = exports.getPricingConfig = exports.deleteVehicleType = exports.updateVehicleType = exports.getVehicleTypeById = exports.getAllVehicleTypes = exports.createVehicleType = void 0;
const prisma_1 = require("../../config/prisma");
const generateUniqueOtp_1 = require("../../utils/generateUniqueOtp");
const socket_service_1 = require("../socket/socket.service");
/* ============================================
    VEHICLE TYPE MANAGEMENT
============================================ */
const createVehicleType = async (data) => {
    // Validate category
    const validCategories = ["BIKE", "AUTO", "CAR"];
    if (!validCategories.includes(data.category)) {
        throw new Error("Invalid category. Must be BIKE, AUTO, or CAR.");
    }
    // Check if vehicle type with this name already exists
    const exists = await prisma_1.prisma.vehicleType.findUnique({
        where: { name: data.name },
    });
    if (exists) {
        throw new Error("Vehicle type with this name already exists");
    }
    const vehicleType = await prisma_1.prisma.vehicleType.create({
        data: {
            category: data.category,
            name: data.name,
            displayName: data.displayName,
            pricePerKm: data.pricePerKm,
            baseFare: data.baseFare ?? null,
        },
    });
    return vehicleType;
};
exports.createVehicleType = createVehicleType;
const getAllVehicleTypes = async () => {
    const vehicleTypes = await prisma_1.prisma.vehicleType.findMany({
        orderBy: { createdAt: "desc" },
    });
    return vehicleTypes;
};
exports.getAllVehicleTypes = getAllVehicleTypes;
const getVehicleTypeById = async (id) => {
    const vehicleType = await prisma_1.prisma.vehicleType.findUnique({
        where: { id },
    });
    if (!vehicleType) {
        throw new Error("Vehicle type not found");
    }
    return vehicleType;
};
exports.getVehicleTypeById = getVehicleTypeById;
const updateVehicleType = async (id, data) => {
    const vehicleType = await prisma_1.prisma.vehicleType.findUnique({
        where: { id },
    });
    if (!vehicleType) {
        throw new Error("Vehicle type not found");
    }
    const updated = await prisma_1.prisma.vehicleType.update({
        where: { id },
        data: {
            ...(data.displayName && { displayName: data.displayName }),
            ...(data.pricePerKm !== undefined && { pricePerKm: data.pricePerKm }),
            ...(data.baseFare !== undefined && { baseFare: data.baseFare }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
    });
    return updated;
};
exports.updateVehicleType = updateVehicleType;
const deleteVehicleType = async (id) => {
    const vehicleType = await prisma_1.prisma.vehicleType.findUnique({
        where: { id },
    });
    if (!vehicleType) {
        throw new Error("Vehicle type not found");
    }
    await prisma_1.prisma.vehicleType.delete({
        where: { id },
    });
    return { message: "Vehicle type deleted successfully" };
};
exports.deleteVehicleType = deleteVehicleType;
/* ============================================
    PRICING CONFIGURATION
============================================ */
const getPricingConfig = async () => {
    let config = await prisma_1.prisma.pricingConfig.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
    });
    // If no config exists, create default one
    if (!config) {
        config = await prisma_1.prisma.pricingConfig.create({
            data: {
                riderPercentage: 80,
                appCommission: 20,
            },
        });
    }
    return config;
};
exports.getPricingConfig = getPricingConfig;
const updatePricingConfig = async (data) => {
    // Validate percentages
    if (data.riderPercentage + data.appCommission !== 100) {
        throw new Error("Rider percentage and app commission must sum to 100%");
    }
    // Deactivate old configs
    await prisma_1.prisma.pricingConfig.updateMany({
        where: { isActive: true },
        data: { isActive: false },
    });
    // Create new active config
    const config = await prisma_1.prisma.pricingConfig.create({
        data: {
            baseFare: data.baseFare ?? 20,
            riderPercentage: data.riderPercentage,
            appCommission: data.appCommission,
            isActive: true,
        },
    });
    return config;
};
exports.updatePricingConfig = updatePricingConfig;
/* ============================================
    PARTNER MANAGEMENT
============================================ */
const getAllPartners = async () => {
    const partners = await prisma_1.prisma.partner.findMany({
        select: {
            id: true,
            customId: true,
            name: true,
            phone: true,
            email: true,
            profileImage: true,
            isOnline: true,
            rating: true,
            totalEarnings: true,
            hasOwnVehicle: true,
            ownVehicleNumber: true,
            ownVehicleModel: true,
            createdAt: true,
            vehicle: {
                select: {
                    id: true,
                    customId: true,
                    registrationNumber: true,
                    vehicleModel: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
    return partners;
};
exports.getAllPartners = getAllPartners;
const getPartnerById = async (partnerId) => {
    const partner = await prisma_1.prisma.partner.findUnique({
        where: { id: partnerId },
        include: {
            vehicle: {
                include: {
                    vehicleType: true,
                    vendor: true,
                },
            },
            ownVehicleType: true,
            rides: {
                select: {
                    id: true,
                    status: true,
                    totalFare: true,
                    riderEarnings: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "desc" },
                take: 20,
            },
        },
    });
    if (!partner) {
        throw new Error("Partner not found");
    }
    return partner;
};
exports.getPartnerById = getPartnerById;
/* ============================================
    SCHEDULED RIDE MANAGEMENT
============================================ */
const getScheduledRides = async () => {
    const rides = await prisma_1.prisma.ride.findMany({
        where: {
            status: "SCHEDULED",
            isManualBooking: true,
            partnerId: null,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                },
            },
            vehicleType: true,
        },
        orderBy: { scheduledDateTime: "asc" },
    });
    return rides;
};
exports.getScheduledRides = getScheduledRides;
const assignPartnerToRide = async (rideId, partnerId, adminId) => {
    // Verify partner exists
    const partner = await prisma_1.prisma.partner.findUnique({
        where: { id: partnerId },
        include: {
            vehicle: true
        }
    });
    if (!partner) {
        throw new Error("Partner not found");
    }
    // Verify ride exists and is scheduled
    const ride = await prisma_1.prisma.ride.findUnique({
        where: { id: rideId },
    });
    if (!ride) {
        throw new Error("Ride not found");
    }
    if (ride.status !== "SCHEDULED") {
        throw new Error("Ride is not a scheduled ride or already assigned");
    }
    if (ride.partnerId) {
        throw new Error("Ride already has a partner assigned");
    }
    // Assign partner to ride
    const updatedRide = await prisma_1.prisma.ride.update({
        where: { id: rideId },
        data: {
            partnerId: partnerId,
            assignedByAdminId: adminId,
            status: "ACCEPTED",
            acceptedAt: new Date(),
            // If partner has an assigned vehicle, link it
            ...(partner.vehicleId && { vehicleId: partner.vehicleId }),
            // If partner has an assigned vehicle, use its vendor
            ...(partner.vehicle?.vendorId && { vendorId: partner.vehicle.vendorId }),
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                },
            },
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
            vehicleType: true,
        },
    });
    // Emit socket event to notify user and partner
    // Note: Function renamed or logic updated to emitRiderAssigned with Partner data
    (0, socket_service_1.emitRiderAssigned)(updatedRide);
    return updatedRide;
};
exports.assignPartnerToRide = assignPartnerToRide;
/* ============================================
    ADMIN RIDE MANAGEMENT
============================================ */
const getAllRides = async (filters) => {
    const rides = await prisma_1.prisma.ride.findMany({
        where: {
            ...(filters?.status && { status: filters.status }),
            ...(filters?.vehicleType && {
                vehicleType: {
                    name: filters.vehicleType,
                },
            }),
            ...(filters?.userId && { userId: filters.userId }),
            ...(filters?.partnerId && { partnerId: filters.partnerId }),
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                },
            },
            partner: {
                select: {
                    id: true,
                    customId: true,
                    name: true,
                    phone: true,
                    email: true,
                },
            },
            vehicleType: true,
            vehicle: true,
            vendor: true,
        },
        orderBy: { createdAt: "desc" },
    });
    return rides;
};
exports.getAllRides = getAllRides;
const getRideById = async (id) => {
    const ride = await prisma_1.prisma.ride.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                },
            },
            partner: {
                select: {
                    id: true,
                    customId: true,
                    name: true,
                    phone: true,
                    email: true,
                },
            },
            vehicleType: true,
            vehicle: true,
            vendor: true,
        },
    });
    if (!ride) {
        throw new Error("Ride not found");
    }
    return ride;
};
exports.getRideById = getRideById;
/* ============================================
    ADMIN USER MANAGEMENT
============================================ */
const updateUserUniqueOtpByAdmin = async (userId) => {
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
            email: true,
            uniqueOtp: true,
            updatedAt: true,
        },
    });
    return updatedUser;
};
exports.updateUserUniqueOtpByAdmin = updateUserUniqueOtpByAdmin;
const getAllUsers = async () => {
    const users = await prisma_1.prisma.user.findMany({
        select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            uniqueOtp: true,
            createdAt: true,
            updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
    });
    return users;
};
exports.getAllUsers = getAllUsers;
const getUserById = async (userId) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            uniqueOtp: true,
            createdAt: true,
            updatedAt: true,
            rides: {
                select: {
                    id: true,
                    status: true,
                    totalFare: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "desc" },
            },
        },
    });
    if (!user) {
        throw new Error("User not found");
    }
    return user;
};
exports.getUserById = getUserById;
