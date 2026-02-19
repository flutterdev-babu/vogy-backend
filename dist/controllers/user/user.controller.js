"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_service_1 = require("../../services/user/user.service");
const ride_service_1 = require("../../services/ride/ride.service");
exports.default = {
    /* ============================================
        USER PROFILE (Already exists)
    ============================================ */
    getProfile: async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            const user = await (0, user_service_1.getUserProfile)(userId);
            return res.status(200).json({
                success: true,
                message: "Profile retrieved successfully",
                data: user,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to get profile",
            });
        }
    },
    updateProfile: async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            const { name, email, profileImage } = req.body;
            if (!name && email === undefined && profileImage === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "At least one field (name, email, profileImage) is required",
                });
            }
            const updatedUser = await (0, user_service_1.updateUserProfile)(userId, {
                name,
                email,
                profileImage,
            });
            return res.status(200).json({
                success: true,
                message: "Profile updated successfully",
                data: updatedUser,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to update profile",
            });
        }
    },
    /* ============================================
        RIDE MANAGEMENT (USER)
    ============================================ */
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
             } = req.body;
            if (!dropAddress ||
                !distanceKm ||
                !cityCodeId // NEW
            ) {
                return res.status(400).json({
                    success: false,
                    message: "All fields are required including cityCodeId",
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
    getRides: async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            const { status } = req.query;
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
    getRideById: async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            const { id } = req.params;
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
    cancelRide: async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            const { id } = req.params;
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
    completeRide: async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            const { id } = req.params;
            const { userOtp } = req.body;
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
        USER UNIQUE OTP MANAGEMENT
    ============================================ */
    getUniqueOtp: async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            const user = await (0, user_service_1.getUserUniqueOtp)(userId);
            return res.status(200).json({
                success: true,
                message: "Unique OTP retrieved successfully",
                data: user,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to get unique OTP",
            });
        }
    },
    updateUniqueOtp: async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            const user = await (0, user_service_1.updateUserUniqueOtp)(userId);
            return res.status(200).json({
                success: true,
                message: "Unique OTP updated successfully",
                data: user,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to update unique OTP",
            });
        }
    },
    /* ============================================
        USER DASHBOARD ENDPOINTS
    ============================================ */
    getRideSummary: async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ success: false, message: "Unauthorized" });
            const summary = await (0, user_service_1.getUserRideSummary)(userId);
            res.json({ success: true, data: summary });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    getActiveRide: async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ success: false, message: "Unauthorized" });
            const ride = await (0, user_service_1.getActiveRide)(userId);
            res.json({ success: true, data: ride });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    getSpendSummary: async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ success: false, message: "Unauthorized" });
            const spending = await (0, user_service_1.getUserSpendSummary)(userId);
            res.json({ success: true, data: spending });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
};
