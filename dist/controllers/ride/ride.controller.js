"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ride_service_1 = require("../../services/ride/ride.service");
exports.default = {
    /* ============================================
        USER RIDE CONTROLLERS
    ============================================ */
    // Create a new ride request
    createRide: async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            const { vehicleTypeId, pickupLat, pickupLng, pickupAddress, dropLat, dropLng, dropAddress, distanceKm, cityCodeId, // NEW
            rideType, altMobile, paymentMode, corporateId, agentCode, couponCode, expectedFare, } = req.body;
            // Validate required fields
            if (!vehicleTypeId ||
                pickupLat === undefined ||
                pickupLng === undefined ||
                !pickupAddress ||
                dropLat === undefined ||
                dropLng === undefined ||
                !dropAddress ||
                distanceKm === undefined ||
                !cityCodeId // NEW
            ) {
                return res.status(400).json({
                    success: false,
                    message: "vehicleTypeId, pickupLat, pickupLng, pickupAddress, dropLat, dropLng, dropAddress, distanceKm, and cityCodeId are required",
                });
            }
            const ride = await (0, ride_service_1.createRide)(userId, {
                vehicleTypeId,
                pickupLat: parseFloat(pickupLat),
                pickupLng: parseFloat(pickupLng),
                pickupAddress,
                dropLat: parseFloat(dropLat),
                dropLng: parseFloat(dropLng),
                dropAddress,
                distanceKm: parseFloat(distanceKm),
                cityCodeId, // NEW
                rideType,
                altMobile,
                paymentMode,
                corporateId,
                agentCode,
                couponCode,
                expectedFare: expectedFare ? parseFloat(expectedFare) : undefined,
            });
            return res.status(201).json({
                success: true,
                message: "Ride created successfully",
                data: ride,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to create ride",
            });
        }
    },
    // Create a manual/scheduled ride request
    createManualRide: async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            const { vehicleTypeId, pickupLat, pickupLng, pickupAddress, dropLat, dropLng, dropAddress, distanceKm, scheduledDateTime, bookingNotes, cityCodeId, // NEW
            rideType, altMobile, paymentMode, corporateId, agentCode, couponCode, expectedFare, } = req.body;
            // Validate required fields
            if (!vehicleTypeId ||
                pickupLat === undefined ||
                pickupLng === undefined ||
                !pickupAddress ||
                dropLat === undefined ||
                dropLng === undefined ||
                !dropAddress ||
                distanceKm === undefined ||
                !scheduledDateTime ||
                !cityCodeId // NEW
            ) {
                return res.status(400).json({
                    success: false,
                    message: "vehicleTypeId, pickupLat, pickupLng, pickupAddress, dropLat, dropLng, dropAddress, distanceKm, scheduledDateTime, and cityCodeId are required",
                });
            }
            const ride = await (0, ride_service_1.createManualRide)(userId, {
                vehicleTypeId,
                pickupLat: parseFloat(pickupLat),
                pickupLng: parseFloat(pickupLng),
                pickupAddress,
                dropLat: parseFloat(dropLat),
                dropLng: parseFloat(dropLng),
                dropAddress,
                distanceKm: parseFloat(distanceKm),
                scheduledDateTime: new Date(scheduledDateTime),
                bookingNotes,
                cityCodeId, // NEW
                rideType,
                altMobile,
                paymentMode,
                corporateId,
                agentCode,
                couponCode,
                expectedFare: expectedFare ? parseFloat(expectedFare) : undefined,
            });
            return res.status(201).json({
                success: true,
                message: "Scheduled ride booked successfully",
                data: ride,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to create scheduled ride",
            });
        }
    },
    // Estimate fare before booking (no ride created)
    estimateFare: async (req, res) => {
        try {
            const { distanceKm, cityCodeId, couponCode } = req.body;
            if (distanceKm === undefined || !cityCodeId) {
                return res.status(400).json({
                    success: false,
                    message: "distanceKm and cityCodeId are required",
                });
            }
            const fareData = await (0, ride_service_1.estimateFare)({
                distanceKm: parseFloat(distanceKm),
                cityCodeId,
                couponCode,
            });
            return res.status(200).json({
                success: true,
                data: fareData,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to estimate fare",
            });
        }
    },
    // Validate a coupon before ride booking
    validateCoupon: async (req, res) => {
        try {
            const { couponCode, cityCodeId, totalFare } = req.body;
            if (!couponCode || !cityCodeId || totalFare === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "couponCode, cityCodeId, and totalFare are required for validation",
                });
            }
            const couponData = await (0, ride_service_1.validateCouponLogic)(couponCode, cityCodeId, parseFloat(totalFare));
            return res.status(200).json({
                success: true,
                message: "Coupon applied successfully",
                data: couponData,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to validate coupon",
            });
        }
    },
    // Get all rides for a user
    getUserRides: async (req, res) => {
        try {
            const userId = req.user?.id;
            const { status } = req.query;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            const rides = await (0, ride_service_1.getUserRides)(userId, status);
            return res.status(200).json({
                success: true,
                message: "Rides retrieved successfully",
                data: rides,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to get rides",
            });
        }
    },
    // Get a specific ride by ID
    getRideById: async (req, res) => {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            const ride = await (0, ride_service_1.getRideById)(id, userId);
            return res.status(200).json({
                success: true,
                message: "Ride retrieved successfully",
                data: ride,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to get ride",
            });
        }
    },
    // Cancel a ride
    cancelRide: async (req, res) => {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            const ride = await (0, ride_service_1.cancelRide)(id, userId);
            return res.status(200).json({
                success: true,
                message: "Ride cancelled successfully",
                data: ride,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to cancel ride",
            });
        }
    },
    // Complete ride with user's OTP
    completeRide: async (req, res) => {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            const { userOtp } = req.body;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            if (!userOtp) {
                return res.status(400).json({
                    success: false,
                    message: "User OTP is required",
                });
            }
            const ride = await (0, ride_service_1.completeRideWithOtp)(id, userId, userOtp);
            return res.status(200).json({
                success: true,
                message: "Ride completed successfully",
                data: ride,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to complete ride",
            });
        }
    },
    /* ============================================
        PARTNER RIDE CONTROLLERS
    ============================================ */
    // Get available rides for partner
    getAvailableRides: async (req, res) => {
        try {
            const partnerId = req.user?.id;
            const { lat, lng, vehicleTypeId } = req.query;
            if (!partnerId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            if (lat === undefined || lng === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "Partner location (lat, lng) is required",
                });
            }
            const rides = await (0, ride_service_1.getAvailableRides)(parseFloat(lat), parseFloat(lng), vehicleTypeId);
            return res.status(200).json({
                success: true,
                message: "Available rides retrieved successfully",
                data: rides,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to get available rides",
            });
        }
    },
    // Accept a ride
    acceptRide: async (req, res) => {
        try {
            const partnerId = req.user?.id;
            const { id } = req.params;
            if (!partnerId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            const ride = await (0, ride_service_1.acceptRide)(id, partnerId);
            return res.status(200).json({
                success: true,
                message: "Ride accepted successfully",
                data: ride,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to accept ride",
            });
        }
    },
    // Get all rides for a partner
    getPartnerRides: async (req, res) => {
        try {
            const partnerId = req.user?.id;
            const { status } = req.query;
            if (!partnerId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            const rides = await (0, ride_service_1.getPartnerRides)(partnerId, status);
            return res.status(200).json({
                success: true,
                message: "Rides retrieved successfully",
                data: rides,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to get rides",
            });
        }
    },
    // Update ride status (ARRIVED, STARTED, ONGOING, COMPLETED)
    updateRideStatus: async (req, res) => {
        try {
            const partnerId = req.user?.id;
            const { id } = req.params;
            const { status, userOtp, startingKm, endingKm } = req.body;
            if (!partnerId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            const validStatuses = ["ARRIVED", "STARTED", "ONGOING", "COMPLETED"];
            if (!status || !validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Status must be ARRIVED, STARTED, ONGOING, or COMPLETED",
                });
            }
            const ride = await (0, ride_service_1.updateRideStatus)(id, partnerId, status, userOtp, startingKm ? parseFloat(startingKm) : undefined, endingKm ? parseFloat(endingKm) : undefined);
            return res.status(200).json({
                success: true,
                message: "Ride status updated successfully",
                data: ride,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to update ride status",
            });
        }
    },
    // Update partner's current location
    updateLocation: async (req, res) => {
        try {
            const partnerId = req.user?.id;
            const { lat, lng } = req.body;
            if (!partnerId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            if (lat === undefined || lng === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "lat and lng are required",
                });
            }
            const { prisma } = require("../../config/prisma");
            const partner = await prisma.partner.update({
                where: { id: partnerId },
                data: {
                    currentLat: parseFloat(lat),
                    currentLng: parseFloat(lng),
                },
                select: {
                    id: true,
                    customId: true,
                    name: true,
                    currentLat: true,
                    currentLng: true,
                    isOnline: true,
                },
            });
            return res.status(200).json({
                success: true,
                message: "Location updated successfully",
                data: partner,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to update location",
            });
        }
    },
    // Toggle partner online/offline status
    toggleOnlineStatus: async (req, res) => {
        try {
            const partnerId = req.user?.id;
            const { isOnline, lat, lng } = req.body;
            if (!partnerId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            if (isOnline === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "isOnline is required",
                });
            }
            const { prisma } = require("../../config/prisma");
            // If going online, require location
            if (isOnline && (lat === undefined || lng === undefined)) {
                return res.status(400).json({
                    success: false,
                    message: "Location (lat, lng) is required when going online",
                });
            }
            const updateData = { isOnline };
            if (isOnline && lat !== undefined && lng !== undefined) {
                updateData.currentLat = parseFloat(lat);
                updateData.currentLng = parseFloat(lng);
            }
            const partner = await prisma.partner.update({
                where: { id: partnerId },
                data: updateData,
                select: {
                    id: true,
                    customId: true,
                    name: true,
                    isOnline: true,
                    currentLat: true,
                    currentLng: true,
                    hasOwnVehicle: true,
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
            return res.status(200).json({
                success: true,
                message: isOnline ? "You are now online" : "You are now offline",
                data: partner,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to update online status",
            });
        }
    },
};
