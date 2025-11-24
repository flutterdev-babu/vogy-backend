"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin_service_1 = require("../../services/admin/admin.service");
exports.default = {
    /* ============================================
        VEHICLE TYPE MANAGEMENT
    ============================================ */
    createVehicleType: async (req, res) => {
        try {
            const { name, displayName, pricePerKm } = req.body;
            if (!name || !displayName || !pricePerKm) {
                return res.status(400).json({
                    success: false,
                    message: "Name, displayName, and pricePerKm are required",
                });
            }
            const vehicleType = await (0, admin_service_1.createVehicleType)({
                name,
                displayName,
                pricePerKm: parseFloat(pricePerKm),
            });
            return res.status(201).json({
                success: true,
                message: "Vehicle type created successfully",
                data: vehicleType,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to create vehicle type",
            });
        }
    },
    getAllVehicleTypes: async (req, res) => {
        try {
            const vehicleTypes = await (0, admin_service_1.getAllVehicleTypes)();
            return res.status(200).json({
                success: true,
                message: "Vehicle types retrieved successfully",
                data: vehicleTypes,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to get vehicle types",
            });
        }
    },
    getVehicleTypeById: async (req, res) => {
        try {
            const { id } = req.params;
            const vehicleType = await (0, admin_service_1.getVehicleTypeById)(id);
            return res.status(200).json({
                success: true,
                message: "Vehicle type retrieved successfully",
                data: vehicleType,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to get vehicle type",
            });
        }
    },
    updateVehicleType: async (req, res) => {
        try {
            const { id } = req.params;
            const { displayName, pricePerKm, isActive } = req.body;
            const vehicleType = await (0, admin_service_1.updateVehicleType)(id, {
                displayName,
                pricePerKm: pricePerKm ? parseFloat(pricePerKm) : undefined,
                isActive,
            });
            return res.status(200).json({
                success: true,
                message: "Vehicle type updated successfully",
                data: vehicleType,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to update vehicle type",
            });
        }
    },
    deleteVehicleType: async (req, res) => {
        try {
            const { id } = req.params;
            await (0, admin_service_1.deleteVehicleType)(id);
            return res.status(200).json({
                success: true,
                message: "Vehicle type deleted successfully",
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to delete vehicle type",
            });
        }
    },
    /* ============================================
        PRICING CONFIGURATION
    ============================================ */
    getPricingConfig: async (req, res) => {
        try {
            const config = await (0, admin_service_1.getPricingConfig)();
            return res.status(200).json({
                success: true,
                message: "Pricing config retrieved successfully",
                data: config,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to get pricing config",
            });
        }
    },
    updatePricingConfig: async (req, res) => {
        try {
            const { riderPercentage, appCommission } = req.body;
            if (!riderPercentage || !appCommission) {
                return res.status(400).json({
                    success: false,
                    message: "Rider percentage and app commission are required",
                });
            }
            const config = await (0, admin_service_1.updatePricingConfig)({
                riderPercentage: parseFloat(riderPercentage),
                appCommission: parseFloat(appCommission),
            });
            return res.status(200).json({
                success: true,
                message: "Pricing config updated successfully",
                data: config,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to update pricing config",
            });
        }
    },
    /* ============================================
        RIDE MANAGEMENT
    ============================================ */
    getAllRides: async (req, res) => {
        try {
            const { status, vehicleType, userId, riderId } = req.query;
            const rides = await (0, admin_service_1.getAllRides)({
                status: status,
                vehicleType: vehicleType,
                userId: userId,
                riderId: riderId,
            });
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
            const { id } = req.params;
            const ride = await (0, admin_service_1.getRideById)(id);
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
    /* ============================================
        USER MANAGEMENT
    ============================================ */
    getAllUsers: async (req, res) => {
        try {
            const users = await (0, admin_service_1.getAllUsers)();
            return res.status(200).json({
                success: true,
                message: "Users retrieved successfully",
                data: users,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to get users",
            });
        }
    },
    getUserById: async (req, res) => {
        try {
            const { id } = req.params;
            const user = await (0, admin_service_1.getUserById)(id);
            return res.status(200).json({
                success: true,
                message: "User retrieved successfully",
                data: user,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to get user",
            });
        }
    },
    updateUserUniqueOtp: async (req, res) => {
        try {
            const { id } = req.params;
            const user = await (0, admin_service_1.updateUserUniqueOtpByAdmin)(id);
            return res.status(200).json({
                success: true,
                message: "User unique OTP updated successfully",
                data: user,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to update user unique OTP",
            });
        }
    },
};
