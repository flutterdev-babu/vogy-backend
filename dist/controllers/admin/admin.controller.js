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
    createManualRide: async (req, res) => {
        try {
            const adminId = req.user?.id;
            const ride = await (0, admin_service_1.createManualRideByAdmin)(adminId, req.body);
            return res.status(201).json({
                success: true,
                message: "Manual ride booked successfully",
                data: ride,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to create manual booking",
            });
        }
    },
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
    updateRideStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const ride = await (0, admin_service_1.updateRideStatusByAdmin)(id, status);
            res.json({ success: true, data: ride });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    getRideOtp: async (req, res) => {
        try {
            const otp = await (0, admin_service_1.getRideOtpByAdmin)(req.params.id);
            res.json({ success: true, data: { otp } });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
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
        RIDER/PARTNER MANAGEMENT
    ============================================ */
    createPartner: async (req, res) => {
        try {
            const partner = await (0, admin_service_1.createPartnerByAdmin)(req.body);
            res.status(201).json({ success: true, message: "Partner created successfully", data: partner });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
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
    /* ============================================
        VENDOR MANAGEMENT (Admin)
    ============================================ */
    createVendor: async (req, res) => {
        try {
            const vendor = await (0, admin_service_1.createVendorByAdmin)(req.body);
            res.status(201).json({ success: true, message: "Vendor created successfully", data: vendor });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    getAllVendors: async (req, res) => {
        try {
            const { search } = req.query;
            const vendors = await (0, admin_service_1.getAllVendors)(search);
            res.json({ success: true, data: vendors });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    getVendorById: async (req, res) => {
        try {
            const vendor = await (0, admin_service_1.getVendorById)(req.params.id);
            res.json({ success: true, data: vendor });
        }
        catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    },
    updateVendor: async (req, res) => {
        try {
            const vendor = await (0, admin_service_1.updateVendor)(req.params.id, req.body);
            res.json({ success: true, data: vendor });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    /* ============================================
        CORPORATE MANAGEMENT (Admin)
    ============================================ */
    getAllCorporates: async (req, res) => {
        try {
            const { search } = req.query;
            const corporates = await (0, admin_service_1.getAllCorporates)(search);
            res.json({ success: true, data: corporates });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    getCorporateById: async (req, res) => {
        try {
            const corporate = await (0, admin_service_1.getCorporateById)(req.params.id);
            res.json({ success: true, data: corporate });
        }
        catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    },
    updateCorporate: async (req, res) => {
        try {
            const corporate = await (0, admin_service_1.updateCorporate)(req.params.id, req.body);
            res.json({ success: true, data: corporate });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    /* ============================================
        CITY CODE MANAGEMENT (Admin)
    ============================================ */
    getAllCityCodes: async (req, res) => {
        try {
            const cities = await (0, admin_service_1.getAllCityCodes)();
            res.json({ success: true, data: cities });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    createCityCode: async (req, res) => {
        try {
            const city = await (0, admin_service_1.createCityCode)(req.body);
            res.status(201).json({ success: true, data: city });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    updateCityCode: async (req, res) => {
        try {
            const city = await (0, admin_service_1.updateCityCode)(req.params.id, req.body);
            res.json({ success: true, data: city });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    /* ============================================
        ATTACHMENT MANAGEMENT
    ============================================ */
    createAttachment: async (req, res) => {
        try {
            const attachment = await (0, admin_service_1.createAttachment)(req.body);
            res.status(201).json({ success: true, data: attachment });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    getAllAttachments: async (req, res) => {
        try {
            const attachments = await (0, admin_service_1.getAllAttachments)();
            res.json({ success: true, data: attachments });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    toggleAttachmentStatus: async (req, res) => {
        try {
            const { isActive } = req.body;
            const attachment = await (0, admin_service_1.toggleAttachmentStatus)(req.params.id, isActive);
            res.json({ success: true, data: attachment });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    verifyAttachment: async (req, res) => {
        try {
            const { status } = req.body;
            const attachment = await (0, admin_service_1.verifyAttachmentByAdmin)(req.params.id, status);
            res.json({ success: true, data: attachment });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    deleteAttachment: async (req, res) => {
        try {
            const result = await (0, admin_service_1.deleteAttachment)(req.params.id);
            res.json({ success: true, data: result });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    /* ============================================
        ADMIN DASHBOARD ENDPOINTS
    ============================================ */
    getDashboard: async (req, res) => {
        try {
            const dashboard = await (0, admin_service_1.getAdminDashboard)();
            res.json({ success: true, data: dashboard });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    getRevenueAnalytics: async (req, res) => {
        try {
            const analytics = await (0, admin_service_1.getRevenueAnalytics)();
            res.json({ success: true, data: analytics });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    getRideAnalytics: async (req, res) => {
        try {
            const analytics = await (0, admin_service_1.getRideAnalytics)();
            res.json({ success: true, data: analytics });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    getEntityStatusOverview: async (req, res) => {
        try {
            const overview = await (0, admin_service_1.getEntityStatusOverview)();
            res.json({ success: true, data: overview });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    getRecentActivity: async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 20;
            const activity = await (0, admin_service_1.getRecentActivity)(limit);
            res.json({ success: true, data: activity });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
};
