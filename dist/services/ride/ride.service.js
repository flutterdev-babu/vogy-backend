"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRideStatus = exports.getRiderRides = exports.acceptRide = exports.getAvailableRides = exports.completeRideWithOtp = exports.cancelRide = exports.getRideById = exports.getUserRides = exports.createRide = void 0;
const prisma_1 = require("../../config/prisma");
/* ============================================
    CREATE RIDE (USER)
============================================ */
const createRide = async (userId, data) => {
    // Verify vehicle type exists and is active
    const vehicleType = await prisma_1.prisma.vehicleType.findUnique({
        where: { id: data.vehicleTypeId },
    });
    if (!vehicleType) {
        throw new Error("Vehicle type not found");
    }
    if (!vehicleType.isActive) {
        throw new Error("Vehicle type is not available");
    }
    // Get active pricing config
    const pricingConfig = await prisma_1.prisma.pricingConfig.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
    });
    if (!pricingConfig) {
        throw new Error("Pricing configuration not found");
    }
    // Calculate fare
    const baseFare = vehicleType.pricePerKm;
    const perKmPrice = vehicleType.pricePerKm;
    const totalFare = perKmPrice * data.distanceKm;
    const riderEarnings = (totalFare * pricingConfig.riderPercentage) / 100;
    const commission = (totalFare * pricingConfig.appCommission) / 100;
    // Create ride
    const ride = await prisma_1.prisma.ride.create({
        data: {
            userId: userId,
            vehicleTypeId: data.vehicleTypeId,
            pickupLat: data.pickupLat,
            pickupLng: data.pickupLng,
            pickupAddress: data.pickupAddress,
            dropLat: data.dropLat,
            dropLng: data.dropLng,
            dropAddress: data.dropAddress,
            distanceKm: data.distanceKm,
            baseFare: baseFare,
            perKmPrice: perKmPrice,
            totalFare: totalFare,
            riderEarnings: riderEarnings,
            commission: commission,
            status: "PENDING",
        },
        include: {
            vehicleType: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                },
            },
        },
    });
    return ride;
};
exports.createRide = createRide;
/* ============================================
    GET USER RIDES
============================================ */
const getUserRides = async (userId, status) => {
    const rides = await prisma_1.prisma.ride.findMany({
        where: {
            userId: userId,
            ...(status && { status: status }),
        },
        include: {
            vehicleType: true,
            rider: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    profileImage: true,
                    rating: true,
                    vehicleNumber: true,
                    vehicleModel: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
    return rides;
};
exports.getUserRides = getUserRides;
/* ============================================
    GET RIDE BY ID (USER)
============================================ */
const getRideById = async (rideId, userId) => {
    const ride = await prisma_1.prisma.ride.findUnique({
        where: { id: rideId },
        include: {
            vehicleType: true,
            rider: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    profileImage: true,
                    rating: true,
                    vehicleNumber: true,
                    vehicleModel: true,
                    currentLat: true,
                    currentLng: true,
                },
            },
            user: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                },
            },
        },
    });
    if (!ride) {
        throw new Error("Ride not found");
    }
    // Verify ride belongs to user
    if (ride.userId !== userId) {
        throw new Error("Unauthorized to access this ride");
    }
    return ride;
};
exports.getRideById = getRideById;
/* ============================================
    CANCEL RIDE (USER)
============================================ */
const cancelRide = async (rideId, userId) => {
    const ride = await prisma_1.prisma.ride.findUnique({
        where: { id: rideId },
    });
    if (!ride) {
        throw new Error("Ride not found");
    }
    if (ride.userId !== userId) {
        throw new Error("Unauthorized to cancel this ride");
    }
    if (ride.status === "COMPLETED") {
        throw new Error("Cannot cancel a completed ride");
    }
    if (ride.status === "CANCELLED") {
        throw new Error("Ride is already cancelled");
    }
    const updatedRide = await prisma_1.prisma.ride.update({
        where: { id: rideId },
        data: {
            status: "CANCELLED",
        },
        include: {
            vehicleType: true,
            rider: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                },
            },
        },
    });
    return updatedRide;
};
exports.cancelRide = cancelRide;
/* ============================================
    COMPLETE RIDE WITH OTP (USER)
============================================ */
const completeRideWithOtp = async (rideId, userId, userOtp) => {
    // Get user to verify OTP
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        throw new Error("User not found");
    }
    // Verify OTP
    if (user.uniqueOtp !== userOtp) {
        throw new Error("Invalid OTP");
    }
    // Get ride
    const ride = await prisma_1.prisma.ride.findUnique({
        where: { id: rideId },
        include: {
            rider: true,
        },
    });
    if (!ride) {
        throw new Error("Ride not found");
    }
    if (ride.userId !== userId) {
        throw new Error("Unauthorized to complete this ride");
    }
    if (ride.status !== "STARTED") {
        throw new Error("Ride must be started before completion");
    }
    // Update ride status and rider earnings
    const updatedRide = await prisma_1.prisma.ride.update({
        where: { id: rideId },
        data: {
            status: "COMPLETED",
            endTime: new Date(),
            userOtp: userOtp,
        },
    });
    // Update rider's total earnings if rider exists
    if (ride.riderId && ride.riderEarnings) {
        await prisma_1.prisma.rider.update({
            where: { id: ride.riderId },
            data: {
                totalEarnings: {
                    increment: ride.riderEarnings,
                },
            },
        });
    }
    return updatedRide;
};
exports.completeRideWithOtp = completeRideWithOtp;
/* ============================================
    GET AVAILABLE RIDES FOR RIDER
============================================ */
const getAvailableRides = async (riderLat, riderLng, vehicleTypeId) => {
    // Get online riders with their vehicle types
    const rides = await prisma_1.prisma.ride.findMany({
        where: {
            status: "PENDING",
            ...(vehicleTypeId && { vehicleTypeId: vehicleTypeId }),
            riderId: null, // Only rides not yet accepted
        },
        include: {
            vehicleType: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    profileImage: true,
                },
            },
        },
        orderBy: { createdAt: "asc" }, // Oldest first
    });
    // Calculate distance and filter nearby rides (within 10km)
    const nearbyRides = rides
        .map((ride) => {
        const distance = calculateDistance(riderLat, riderLng, ride.pickupLat, ride.pickupLng);
        return { ...ride, distanceFromRider: distance };
    })
        .filter((ride) => ride.distanceFromRider <= 10) // Within 10km
        .sort((a, b) => a.distanceFromRider - b.distanceFromRider); // Closest first
    return nearbyRides;
};
exports.getAvailableRides = getAvailableRides;
/* ============================================
    ACCEPT RIDE (RIDER)
============================================ */
const acceptRide = async (rideId, riderId) => {
    // Check if rider is online
    const rider = await prisma_1.prisma.rider.findUnique({
        where: { id: riderId },
    });
    if (!rider) {
        throw new Error("Rider not found");
    }
    if (!rider.isOnline) {
        throw new Error("Rider must be online to accept rides");
    }
    // Get ride
    const ride = await prisma_1.prisma.ride.findUnique({
        where: { id: rideId },
    });
    if (!ride) {
        throw new Error("Ride not found");
    }
    if (ride.status !== "PENDING") {
        throw new Error("Ride is not available for acceptance");
    }
    if (ride.riderId) {
        throw new Error("Ride has already been accepted");
    }
    // Accept ride
    const updatedRide = await prisma_1.prisma.ride.update({
        where: { id: rideId },
        data: {
            riderId: riderId,
            status: "ACCEPTED",
            acceptedAt: new Date(),
        },
        include: {
            vehicleType: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    profileImage: true,
                },
            },
        },
    });
    return updatedRide;
};
exports.acceptRide = acceptRide;
/* ============================================
    GET RIDER RIDES
============================================ */
const getRiderRides = async (riderId, status) => {
    const rides = await prisma_1.prisma.ride.findMany({
        where: {
            riderId: riderId,
            ...(status && { status: status }),
        },
        include: {
            vehicleType: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    profileImage: true,
                    uniqueOtp: true, // Rider needs to see OTP for completion
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
    return rides;
};
exports.getRiderRides = getRiderRides;
/* ============================================
    UPDATE RIDE STATUS (RIDER)
============================================ */
const updateRideStatus = async (rideId, riderId, status) => {
    const ride = await prisma_1.prisma.ride.findUnique({
        where: { id: rideId },
    });
    if (!ride) {
        throw new Error("Ride not found");
    }
    if (ride.riderId !== riderId) {
        throw new Error("Unauthorized to update this ride");
    }
    // Validate status transition
    if (status === "ARRIVED" && ride.status !== "ACCEPTED") {
        throw new Error("Ride must be accepted before marking as arrived");
    }
    if (status === "STARTED" && ride.status !== "ARRIVED") {
        throw new Error("Ride must be arrived before starting");
    }
    const updateData = {
        status: status,
    };
    if (status === "ARRIVED") {
        updateData.arrivedAt = new Date();
    }
    if (status === "STARTED") {
        updateData.startTime = new Date();
    }
    const updatedRide = await prisma_1.prisma.ride.update({
        where: { id: rideId },
        data: updateData,
        include: {
            vehicleType: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    profileImage: true,
                },
            },
        },
    });
    return updatedRide;
};
exports.updateRideStatus = updateRideStatus;
/* ============================================
    CALCULATE DISTANCE (Helper function)
============================================ */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
};
