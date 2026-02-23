"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRideStatus = exports.getPartnerRides = exports.acceptRide = exports.getAvailableRides = exports.completeRideWithOtp = exports.cancelRide = exports.getRideById = exports.getUserRides = exports.createManualRide = exports.createRide = void 0;
const prisma_1 = require("../../config/prisma");
const socket_service_1 = require("../socket/socket.service");
const city_service_1 = require("../city/city.service");
/* ============================================
    CREATE RIDE (USER) - Instant Booking
============================================ */
const createRide = async (userId, data) => {
    // Get city code for ID generation
    const cityCodeEntry = await prisma_1.prisma.cityCode.findUnique({
        where: { id: data.cityCodeId },
    });
    if (!cityCodeEntry) {
        throw new Error("Invalid city code ID");
    }
    const customId = await (0, city_service_1.generateEntityCustomId)(cityCodeEntry.code, "RIDE");
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
    // Calculate fare with admin-controlled pricing
    // TOTAL FARE = baseFare + (pricePerKm × distanceKm)
    const baseFare = pricingConfig.baseFare || 20;
    const perKmPrice = vehicleType.pricePerKm;
    const totalFare = baseFare + (perKmPrice * data.distanceKm);
    const riderEarnings = (totalFare * pricingConfig.riderPercentage) / 100;
    const commission = (totalFare * pricingConfig.appCommission) / 100;
    // NEW: Handle agentCode if provided
    let agentId = null;
    let agentCode = null;
    if (data.agentCode) {
        const agent = await prisma_1.prisma.agent.findUnique({
            where: { agentCode: data.agentCode },
        });
        if (agent) {
            agentId = agent.id;
            agentCode = agent.agentCode;
        }
    }
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
            status: "UPCOMING",
            isManualBooking: false,
            cityCodeId: data.cityCodeId,
            customId: customId,
            agentId: agentId,
            agentCode: agentCode || data.agentCode || null,
            rideType: data.rideType || "LOCAL",
            altMobile: data.altMobile || null,
            paymentMode: data.paymentMode || "CASH",
            corporateId: data.corporateId || null,
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
    // Emit socket event for real-time updates
    (0, socket_service_1.emitRideCreated)(ride);
    return ride;
};
exports.createRide = createRide;
/* ============================================
    CREATE MANUAL/SCHEDULED RIDE (USER)
============================================ */
const createManualRide = async (userId, data) => {
    // Get city code for ID generation
    const cityCodeEntry = await prisma_1.prisma.cityCode.findUnique({
        where: { id: data.cityCodeId },
    });
    if (!cityCodeEntry) {
        throw new Error("Invalid city code ID");
    }
    const customId = await (0, city_service_1.generateEntityCustomId)(cityCodeEntry.code, "RIDE");
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
    // Validate scheduled date is in the future
    const scheduledDate = new Date(data.scheduledDateTime);
    if (scheduledDate <= new Date()) {
        throw new Error("Scheduled date must be in the future");
    }
    // Get active pricing config
    const pricingConfig = await prisma_1.prisma.pricingConfig.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
    });
    if (!pricingConfig) {
        throw new Error("Pricing configuration not found");
    }
    // Calculate fare with admin-controlled pricing
    const baseFare = pricingConfig.baseFare || 20;
    const perKmPrice = vehicleType.pricePerKm;
    const totalFare = baseFare + (perKmPrice * data.distanceKm);
    const riderEarnings = (totalFare * pricingConfig.riderPercentage) / 100;
    const commission = (totalFare * pricingConfig.appCommission) / 100;
    // Handle agentCode if provided
    let agentId = null;
    let agentCode = null;
    if (data.agentCode) {
        const agent = await prisma_1.prisma.agent.findUnique({
            where: { agentCode: data.agentCode },
        });
        if (agent) {
            agentId = agent.id;
            agentCode = agent.agentCode;
        }
    }
    // Create scheduled ride
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
            status: "SCHEDULED",
            isManualBooking: true,
            scheduledDateTime: scheduledDate,
            bookingNotes: data.bookingNotes || null,
            cityCodeId: data.cityCodeId,
            customId: customId,
            agentId: agentId,
            agentCode: agentCode || data.agentCode || null,
            rideType: data.rideType || "LOCAL",
            altMobile: data.altMobile || null,
            paymentMode: data.paymentMode || "CASH",
            corporateId: data.corporateId || null,
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
    // Emit socket event for admins
    (0, socket_service_1.emitManualRideCreated)(ride);
    return ride;
};
exports.createManualRide = createManualRide;
/* ============================================
    GET USER RIDES
============================================ */
const getUserRides = async (userId, status) => {
    const where = { userId };
    if (status === "FUTURE") {
        where.status = {
            in: ["UPCOMING", "ASSIGNED", "STARTED", "ARRIVED", "ONGOING", "STOPPED"]
        };
    }
    else if (status) {
        where.status = status;
    }
    const rides = await prisma_1.prisma.ride.findMany({
        where,
        include: {
            vehicleType: true,
            partner: {
                select: {
                    id: true,
                    customId: true,
                    name: true,
                    phone: true,
                    profileImage: true,
                    rating: true,
                    hasOwnVehicle: true,
                    ownVehicleNumber: true,
                    ownVehicleModel: true,
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
            partner: {
                select: {
                    id: true,
                    customId: true,
                    name: true,
                    phone: true,
                    profileImage: true,
                    rating: true,
                    hasOwnVehicle: true,
                    ownVehicleNumber: true,
                    ownVehicleModel: true,
                    currentLat: true,
                    currentLng: true,
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
            partner: {
                select: {
                    id: true,
                    customId: true,
                    name: true,
                    phone: true,
                },
            },
        },
    });
    // Emit socket event to notify partner
    (0, socket_service_1.emitRideCancelled)(updatedRide, "USER");
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
            partner: true,
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
    // Update ride status and partner earnings
    const updatedRide = await prisma_1.prisma.ride.update({
        where: { id: rideId },
        data: {
            status: "COMPLETED",
            endTime: new Date(),
            userOtp: userOtp,
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
            partner: {
                select: {
                    id: true,
                    customId: true,
                    name: true,
                    phone: true,
                },
            },
        },
    });
    // Update partner's total earnings if partner exists
    if (ride.partnerId && ride.riderEarnings) {
        await prisma_1.prisma.partner.update({
            where: { id: ride.partnerId },
            data: {
                totalEarnings: {
                    increment: ride.riderEarnings,
                },
            },
        });
    }
    // Emit socket event
    (0, socket_service_1.emitRideCompleted)(updatedRide);
    return updatedRide;
};
exports.completeRideWithOtp = completeRideWithOtp;
/* ============================================
    GET AVAILABLE RIDES FOR PARTNER
============================================ */
const getAvailableRides = async (partnerLat, partnerLng, vehicleTypeId) => {
    // Get pending rides not yet accepted
    const rides = await prisma_1.prisma.ride.findMany({
        where: {
            status: "UPCOMING",
            ...(vehicleTypeId && { vehicleTypeId: vehicleTypeId }),
            partnerId: null, // Only rides not yet accepted
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
        const distance = calculateDistance(partnerLat, partnerLng, ride.pickupLat, ride.pickupLng);
        return { ...ride, distanceFromPartner: distance };
    })
        .filter((ride) => ride.distanceFromPartner <= 10) // Within 10km
        .sort((a, b) => a.distanceFromPartner - b.distanceFromPartner); // Closest first
    return nearbyRides;
};
exports.getAvailableRides = getAvailableRides;
/* ============================================
    ACCEPT RIDE (PARTNER)
============================================ */
const acceptRide = async (rideId, partnerId) => {
    // Check if partner exists and is online
    const partner = await prisma_1.prisma.partner.findUnique({
        where: { id: partnerId },
        include: {
            vehicle: true,
        },
    });
    if (!partner) {
        throw new Error("Partner not found");
    }
    if (!partner.isOnline) {
        throw new Error("Partner must be online to accept rides");
    }
    // Get ride
    const ride = await prisma_1.prisma.ride.findUnique({
        where: { id: rideId },
    });
    if (!ride) {
        throw new Error("Ride not found");
    }
    if (ride.status !== "UPCOMING") {
        throw new Error("Ride is not available for acceptance");
    }
    if (ride.partnerId) {
        throw new Error("Ride has already been accepted");
    }
    // Determine vehicle to use (partner's assigned vendor vehicle or own vehicle)
    const vehicleId = partner.vehicleId || null;
    // Accept ride
    const updatedRide = await prisma_1.prisma.ride.update({
        where: { id: rideId },
        data: {
            partnerId: partnerId,
            vehicleId: vehicleId,
            status: "ASSIGNED",
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
            partner: {
                select: {
                    id: true,
                    customId: true,
                    name: true,
                    phone: true,
                    profileImage: true,
                    hasOwnVehicle: true,
                    ownVehicleNumber: true,
                    ownVehicleModel: true,
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
        },
    });
    // Emit socket event to notify user
    (0, socket_service_1.emitRideAccepted)(updatedRide);
    return updatedRide;
};
exports.acceptRide = acceptRide;
/* ============================================
    GET PARTNER RIDES
============================================ */
const getPartnerRides = async (partnerId, status) => {
    const rides = await prisma_1.prisma.ride.findMany({
        where: {
            partnerId: partnerId,
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
                    uniqueOtp: true, // Partner needs to see OTP for completion
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
        },
        orderBy: { createdAt: "desc" },
    });
    return rides;
};
exports.getPartnerRides = getPartnerRides;
/* ============================================
    UPDATE RIDE STATUS (PARTNER)
============================================ */
const updateRideStatus = async (rideId, partnerId, status, userOtp) => {
    const ride = await prisma_1.prisma.ride.findUnique({
        where: { id: rideId },
    });
    if (!ride) {
        throw new Error("Ride not found");
    }
    if (ride.partnerId !== partnerId) {
        throw new Error("Unauthorized to update this ride");
    }
    // Validate status transition
    if (status === "ARRIVED" && ride.status !== "ASSIGNED") {
        throw new Error("Ride must be assigned before marking as arrived");
    }
    if (status === "STARTED" && ride.status !== "ARRIVED") {
        throw new Error("Ride must be arrived before starting");
    }
    // OTP Verification for starting the ride
    if (status === "STARTED") {
        // Get user to verify uniqueOtp
        if (!ride.userId) {
            throw new Error("User not found for this ride");
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: ride.userId },
            select: { uniqueOtp: true }
        });
        if (!user) {
            throw new Error("User record not found");
        }
        if (!userOtp) {
            throw new Error("User unique OTP is required to start the ride");
        }
        if (user.uniqueOtp !== userOtp) {
            throw new Error("Invalid user OTP");
        }
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
            partner: {
                select: {
                    id: true,
                    customId: true,
                    name: true,
                    phone: true,
                    profileImage: true,
                    hasOwnVehicle: true,
                    ownVehicleNumber: true,
                    ownVehicleModel: true,
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
        },
    });
    // Emit socket event based on status
    if (status === "ARRIVED") {
        (0, socket_service_1.emitRideArrived)(updatedRide);
    }
    else if (status === "STARTED") {
        (0, socket_service_1.emitRideStarted)(updatedRide);
    }
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
