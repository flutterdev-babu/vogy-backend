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
            const { vehicleTypeId, pickupLat, pickupLng, pickupAddress, dropLat, dropLng, dropAddress, distanceKm, } = req.body;
            // Validate required fields
            if (!vehicleTypeId ||
                pickupLat === undefined ||
                pickupLng === undefined ||
                !pickupAddress ||
                dropLat === undefined ||
                dropLng === undefined ||
                !dropAddress ||
                distanceKm === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "vehicleTypeId, pickupLat, pickupLng, pickupAddress, dropLat, dropLng, dropAddress, and distanceKm are required",
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
        RIDER RIDE CONTROLLERS
    ============================================ */
    // Get available rides for rider
    getAvailableRides: async (req, res) => {
        try {
            const riderId = req.user?.id;
            const { lat, lng, vehicleTypeId } = req.query;
            if (!riderId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            if (lat === undefined || lng === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "Rider location (lat, lng) is required",
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
            const riderId = req.user?.id;
            const { id } = req.params;
            if (!riderId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            const ride = await (0, ride_service_1.acceptRide)(id, riderId);
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
    // Get all rides for a rider
    getRiderRides: async (req, res) => {
        try {
            const riderId = req.user?.id;
            const { status } = req.query;
            if (!riderId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            const rides = await (0, ride_service_1.getRiderRides)(riderId, status);
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
    // Update ride status (ARRIVED, STARTED)
    updateRideStatus: async (req, res) => {
        try {
            const riderId = req.user?.id;
            const { id } = req.params;
            const { status } = req.body;
            if (!riderId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            if (!status || !["ARRIVED", "STARTED"].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Status must be ARRIVED or STARTED",
                });
            }
            const ride = await (0, ride_service_1.updateRideStatus)(id, riderId, status);
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
};
