"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin_service_1 = require("../../services/admin/admin.service");
exports.default = {
    /* ============================================
        VEHICLE TYPE MANAGEMENT
    ============================================ */
    createVehicleType: async (req, res) => {
        try {
            const { category, name, displayName, pricePerKm, baseFare } = req.body;
            if (!category || !name || !displayName || pricePerKm === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "category, name, displayName, and pricePerKm are required",
                });
            }
            const vehicleType = await (0, admin_service_1.createVehicleType)({
                category,
                name,
                displayName,
                pricePerKm: parseFloat(pricePerKm),
                baseFare: baseFare ? parseFloat(baseFare) : undefined,
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
            const { displayName, pricePerKm, baseFare, isActive } = req.body;
            const vehicleType = await (0, admin_service_1.updateVehicleType)(id, {
                displayName,
                pricePerKm: pricePerKm !== undefined ? parseFloat(pricePerKm) : undefined,
                baseFare: baseFare !== undefined ? parseFloat(baseFare) : undefined,
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
            const { baseFare, riderPercentage, appCommission } = req.body;
            if (riderPercentage === undefined || appCommission === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "Rider percentage and app commission are required",
                });
            }
            const config = await (0, admin_service_1.updatePricingConfig)({
                baseFare: baseFare ? parseFloat(baseFare) : undefined,
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
            const { status, vehicleType, userId, partnerId } = req.query;
            const rides = await (0, admin_service_1.getAllRides)({
                status: status,
                vehicleType: vehicleType,
                userId: userId,
                partnerId: partnerId,
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
    /* ============================================
        RIDER MANAGEMENT
    ============================================ */
    getAllRiders: async (req, res) => {
        try {
            const partners = await (0, admin_service_1.getAllPartners)();
            return res.status(200).json({
                success: true,
                message: "Partners retrieved successfully",
                data: partners,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to get riders",
            });
        }
    },
    getRiderById: async (req, res) => {
        try {
            const { id } = req.params;
            const partner = await (0, admin_service_1.getPartnerById)(id);
            return res.status(200).json({
                success: true,
                message: "Partner retrieved successfully",
                data: partner,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to get rider",
            });
        }
    },
    /* ============================================
        SCHEDULED RIDE MANAGEMENT
    ============================================ */
    getScheduledRides: async (req, res) => {
        try {
            const rides = await (0, admin_service_1.getScheduledRides)();
            return res.status(200).json({
                success: true,
                message: "Scheduled rides retrieved successfully",
                data: rides,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to get scheduled rides",
            });
        }
    },
    assignRiderToRide: async (req, res) => {
        try {
            const { id } = req.params;
            const { partnerId } = req.body;
            if (!partnerId) {
                return res.status(400).json({
                    success: false,
                    message: "Partner ID is required",
                });
            }
            const adminId = req.user?.id;
            const ride = await (0, admin_service_1.assignPartnerToRide)(id, partnerId, adminId);
            return res.status(200).json({
                success: true,
                message: "Partner assigned to ride successfully",
                data: ride,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to assign rider to ride",
            });
        }
    },
};
