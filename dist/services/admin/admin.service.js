"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserById = exports.getAllUsers = exports.updateUserUniqueOtpByAdmin = exports.getRideById = exports.getAllRides = exports.updatePricingConfig = exports.getPricingConfig = exports.deleteVehicleType = exports.updateVehicleType = exports.getVehicleTypeById = exports.getAllVehicleTypes = exports.createVehicleType = void 0;
const prisma_1 = require("../../config/prisma");
const generateUniqueOtp_1 = require("../../utils/generateUniqueOtp");
/* ============================================
    VEHICLE TYPE MANAGEMENT
============================================ */
const createVehicleType = async (data) => {
    // Check if vehicle type already exists
    const exists = await prisma_1.prisma.vehicleType.findUnique({
        where: { name: data.name },
    });
    if (exists) {
        throw new Error("Vehicle type already exists");
    }
    const vehicleType = await prisma_1.prisma.vehicleType.create({
        data: {
            name: data.name,
            displayName: data.displayName,
            pricePerKm: data.pricePerKm,
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
            riderPercentage: data.riderPercentage,
            appCommission: data.appCommission,
            isActive: true,
        },
    });
    return config;
};
exports.updatePricingConfig = updatePricingConfig;
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
            ...(filters?.riderId && { riderId: filters.riderId }),
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
            rider: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                },
            },
            vehicleType: true,
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
            rider: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                },
            },
            vehicleType: true,
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
