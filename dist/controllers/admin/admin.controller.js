"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auditLog_service_1 = require("../../services/audit/auditLog.service");
const prisma_1 = require("../../config/prisma");
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
            (0, auditLog_service_1.createAuditLog)({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "CREATE", module: "VEHICLE_TYPE", entityId: vehicleType.id, description: `Created vehicle type: ${displayName}`, newData: vehicleType, ...(0, auditLog_service_1.getRequestContext)(req) });
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
            const oldVehicleType = await (0, admin_service_1.getVehicleTypeById)(id);
            const vehicleType = await (0, admin_service_1.updateVehicleType)(id, {
                displayName,
                pricePerKm: pricePerKm !== undefined ? parseFloat(pricePerKm) : undefined,
                baseFare: baseFare !== undefined ? parseFloat(baseFare) : undefined,
                isActive,
            });
            (0, auditLog_service_1.createAuditLog)({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "UPDATE", module: "VEHICLE_TYPE", entityId: id, description: `Updated vehicle type: ${vehicleType.displayName}`, oldData: oldVehicleType, newData: req.body, ...(0, auditLog_service_1.getRequestContext)(req) });
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
            (0, auditLog_service_1.createAuditLog)({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "DELETE", module: "VEHICLE_TYPE", entityId: id, description: `Deleted a vehicle type`, ...(0, auditLog_service_1.getRequestContext)(req) });
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
            const oldConfig = await (0, admin_service_1.getPricingConfig)();
            const config = await (0, admin_service_1.updatePricingConfig)({
                baseFare: baseFare ? parseFloat(baseFare) : undefined,
                riderPercentage: parseFloat(riderPercentage),
                appCommission: parseFloat(appCommission),
            });
            (0, auditLog_service_1.createAuditLog)({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "UPDATE", module: "PRICING", entityId: config.id, description: `Updated pricing: Rider ${riderPercentage}%, Commission ${appCommission}%`, oldData: oldConfig, newData: config, ...(0, auditLog_service_1.getRequestContext)(req) });
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
        VEHICLE PRICING GROUPS (NEW)
    ============================================ */
    createPricingGroup: async (req, res) => {
        try {
            const { vehicleTypeId, name, baseKm, baseFare, perKmPrice, cityCodeIds } = req.body;
            if (!vehicleTypeId || perKmPrice === undefined || !cityCodeIds) {
                return res.status(400).json({
                    success: false,
                    message: "vehicleTypeId, perKmPrice, and cityCodeIds are required",
                });
            }
            const { createPricingGroup } = require("../../services/city/city.service");
            const pricingGroup = await createPricingGroup({
                vehicleTypeId,
                name,
                baseKm: baseKm ? parseFloat(baseKm) : 2,
                baseFare: baseFare ? parseFloat(baseFare) : 50,
                perKmPrice: parseFloat(perKmPrice),
                cityCodeIds,
            });
            (0, auditLog_service_1.createAuditLog)({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "CREATE", module: "PRICING_GROUP", entityId: pricingGroup.id, description: `Created pricing group: ${name || pricingGroup.id}`, newData: pricingGroup, ...(0, auditLog_service_1.getRequestContext)(req) });
            return res.status(201).json({
                success: true,
                message: "Vehicle pricing group created successfully",
                data: pricingGroup,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to create pricing group",
            });
        }
    },
    getPricingGroups: async (req, res) => {
        try {
            const { vehicleTypeId } = req.query;
            const { getPricingGroups } = require("../../services/city/city.service");
            const groups = await getPricingGroups(vehicleTypeId);
            return res.status(200).json({
                success: true,
                data: groups,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to get pricing groups",
            });
        }
    },
    updatePricingGroup: async (req, res) => {
        try {
            const { id } = req.params;
            const { updatePricingGroup } = require("../../services/city/city.service");
            const group = await updatePricingGroup(id, req.body);
            (0, auditLog_service_1.createAuditLog)({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "UPDATE", module: "PRICING_GROUP", entityId: id, description: `Updated pricing group: ${id}`, newData: req.body, ...(0, auditLog_service_1.getRequestContext)(req) });
            return res.status(200).json({
                success: true,
                message: "Vehicle pricing group updated successfully",
                data: group,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to update pricing group",
            });
        }
    },
    deletePricingGroup: async (req, res) => {
        try {
            const { id } = req.params;
            const { deletePricingGroup } = require("../../services/city/city.service");
            const result = await deletePricingGroup(id);
            (0, auditLog_service_1.createAuditLog)({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "DELETE", module: "PRICING_GROUP", entityId: id, description: `Deleted pricing group: ${id}`, ...(0, auditLog_service_1.getRequestContext)(req) });
            return res.status(200).json({
                success: true,
                message: result.message,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to delete pricing group",
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
            (0, auditLog_service_1.createAuditLog)({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "CREATE", module: "RIDE", entityId: ride.id, description: `Created manual ride booking`, newData: ride, ...(0, auditLog_service_1.getRequestContext)(req) });
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
            const { status, vehicleType, userId, partnerId, search } = req.query;
            const rides = await (0, admin_service_1.getAllRides)({
                status: status,
                vehicleType: vehicleType,
                userId: userId,
                partnerId: partnerId,
                search: search,
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
            const { status, userOtp, startingKm, endingKm } = req.body;
            const oldRide = await prisma_1.prisma.ride.findUnique({ where: { id }, select: { status: true, startingKm: true, endingKm: true } });
            const ride = await (0, admin_service_1.updateRideStatusByAdmin)(id, status, userOtp, startingKm ? parseFloat(startingKm) : undefined, endingKm ? parseFloat(endingKm) : undefined);
            (0, auditLog_service_1.createAuditLog)({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "STATUS_CHANGE", module: "RIDE", entityId: id, description: `Ride status changed to ${status}`, oldData: oldRide, newData: { status, startingKm, endingKm }, ...(0, auditLog_service_1.getRequestContext)(req) });
            res.json({ success: true, data: ride });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    updateRidePaymentStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { paymentStatus, paymentMode } = req.body;
            const adminId = req.user?.id;
            if (!paymentStatus || !paymentMode) {
                return res.status(400).json({
                    success: false,
                    message: "paymentStatus and paymentMode are required",
                });
            }
            const oldRide = await prisma_1.prisma.ride.findUnique({ where: { id }, select: { paymentStatus: true, paymentMode: true } });
            const ride = await (0, admin_service_1.updateRidePaymentStatusByAdmin)(id, paymentStatus, paymentMode, adminId);
            (0, auditLog_service_1.createAuditLog)({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "UPDATE", module: "RIDE", entityId: id, description: `Ride payment updated: ${paymentStatus} via ${paymentMode}`, oldData: oldRide, newData: { paymentStatus, paymentMode }, ...(0, auditLog_service_1.getRequestContext)(req) });
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
    createUser: async (req, res) => {
        try {
            const user = await (0, admin_service_1.createUserByAdmin)(req.body);
            (0, auditLog_service_1.createAuditLog)({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "CREATE", module: "USER", entityId: user.id, description: `Created user: ${req.body.name || req.body.phone}`, newData: user, ...(0, auditLog_service_1.getRequestContext)(req) });
            res.status(201).json({ success: true, message: "User created successfully", data: user });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    updateUser: async (req, res) => {
        try {
            const oldUser = await prisma_1.prisma.user.findUnique({ where: { id: req.params.id }, select: { name: true, phone: true, email: true } });
            const user = await (0, admin_service_1.updateUserByAdmin)(req.params.id, req.body);
            (0, auditLog_service_1.createAuditLog)({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "UPDATE", module: "USER", entityId: req.params.id, description: `Updated user details`, oldData: oldUser, newData: req.body, ...(0, auditLog_service_1.getRequestContext)(req) });
            res.json({ success: true, message: "User updated successfully", data: user });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    getAllUsers: async (req, res) => {
        try {
            const { search } = req.query;
            const users = await (0, admin_service_1.getAllUsers)({ search: search });
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
            (0, auditLog_service_1.createAuditLog)({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "CREATE", module: "PARTNER", entityId: partner.id, description: `Created partner: ${req.body.name || req.body.phone}`, newData: partner, ...(0, auditLog_service_1.getRequestContext)(req) });
            res.status(201).json({ success: true, message: "Partner created successfully", data: partner });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    getAllRiders: async (req, res) => {
        try {
            const { status, verificationStatus, search, isOnline } = req.query;
            const partners = await (0, admin_service_1.getAllPartners)({
                status: status,
                verificationStatus: verificationStatus,
                search: search,
                isOnline: isOnline === "true" ? true : isOnline === "false" ? false : undefined,
            });
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
    getActivePartnerLocations: async (req, res) => {
        try {
            const locations = await (0, admin_service_1.getActivePartnerLocations)();
            return res.status(200).json({
                success: true,
                message: "Active partner locations retrieved successfully",
                data: locations,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to get active partner locations",
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
            (0, auditLog_service_1.createAuditLog)({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "ASSIGNMENT", module: "RIDE", entityId: id, description: `Assigned partner to ride`, newData: { partnerId }, ...(0, auditLog_service_1.getRequestContext)(req) });
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
            (0, auditLog_service_1.createAuditLog)({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "CREATE", module: "VENDOR", entityId: vendor.id, description: `Created vendor: ${req.body.name || req.body.phone}`, newData: vendor, ...(0, auditLog_service_1.getRequestContext)(req) });
            res.status(201).json({ success: true, message: "Vendor created successfully", data: vendor });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    createAgent: async (req, res) => {
        try {
            const agent = await (0, admin_service_1.createAgentByAdmin)(req.body);
            (0, auditLog_service_1.createAuditLog)({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "CREATE", module: "AGENT", entityId: agent.id, description: `Created agent: ${req.body.name || req.body.phone}`, newData: agent, ...(0, auditLog_service_1.getRequestContext)(req) });
            res.status(201).json({ success: true, message: "Agent created successfully", data: agent });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    getAllVendors: async (req, res) => {
        try {
            const { search, status, verificationStatus, includeDeleted } = req.query;
            const vendors = await (0, admin_service_1.getAllVendors)({
                search: search,
                status: status,
                verificationStatus: verificationStatus,
                includeDeleted: includeDeleted === "true"
            });
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
            const adminId = req.user?.id;
            const oldVendor = await prisma_1.prisma.vendor.findUnique({ where: { id: req.params.id }, select: { name: true, companyName: true, phone: true, email: true, status: true, verificationStatus: true } });
            const vendor = await (0, admin_service_1.updateVendor)(req.params.id, req.body, adminId);
            (0, auditLog_service_1.createAuditLog)({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "UPDATE", module: "VENDOR", entityId: req.params.id, description: `Updated vendor details`, oldData: oldVendor, newData: req.body, ...(0, auditLog_service_1.getRequestContext)(req) });
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
            const { search, status, agentId } = req.query;
            const corporates = await (0, admin_service_1.getAllCorporates)({
                search: search,
                status: status,
                agentId: agentId,
            });
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
            const oldCorp = await prisma_1.prisma.corporate.findUnique({ where: { id: req.params.id }, select: { companyName: true, status: true, verificationStatus: true } });
            const corporate = await (0, admin_service_1.updateCorporate)(req.params.id, req.body);
            (0, auditLog_service_1.createAuditLog)({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "UPDATE", module: "CORPORATE", entityId: req.params.id, description: `Updated corporate: ${oldCorp?.companyName || 'corporate'}`, oldData: oldCorp, newData: req.body, ...(0, auditLog_service_1.getRequestContext)(req) });
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
            (0, auditLog_service_1.createAuditLog)({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "CREATE", module: "CITY_CODE", entityId: city.id, description: `Created city code: ${req.body.code} - ${req.body.cityName}`, newData: city, ...(0, auditLog_service_1.getRequestContext)(req) });
            res.status(201).json({ success: true, data: city });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    updateCityCode: async (req, res) => {
        try {
            const oldCity = await prisma_1.prisma.cityCode.findUnique({ where: { id: req.params.id }, select: { code: true, cityName: true, isActive: true } });
            const city = await (0, admin_service_1.updateCityCode)(req.params.id, req.body);
            (0, auditLog_service_1.createAuditLog)({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "UPDATE", module: "CITY_CODE", entityId: req.params.id, description: `Updated city code: ${city.code || req.body.code}`, oldData: oldCity, newData: req.body, ...(0, auditLog_service_1.getRequestContext)(req) });
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
            const adminId = req.user?.id;
            const attachment = await (0, admin_service_1.createAttachment)({
                ...req.body,
                adminId,
            });
            (0, auditLog_service_1.createAuditLog)({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "CREATE", module: "ATTACHMENT", entityId: attachment.id, description: `Created attachment`, newData: attachment, ...(0, auditLog_service_1.getRequestContext)(req) });
            res.status(201).json({ success: true, data: attachment });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    getAttachmentById: async (req, res) => {
        try {
            const attachment = await (0, admin_service_1.getAttachmentById)(req.params.id);
            res.json({ success: true, data: attachment });
        }
        catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    },
    getAllAttachments: async (req, res) => {
        try {
            const { vendorId, partnerId, vehicleId, verificationStatus } = req.query;
            const attachments = await (0, admin_service_1.getAllAttachments)({
                vendorId: vendorId,
                partnerId: partnerId,
                vehicleId: vehicleId,
                verificationStatus: verificationStatus,
            });
            res.json({ success: true, data: attachments });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    toggleAttachmentStatus: async (req, res) => {
        try {
            const { status } = req.body;
            const adminId = req.user?.id;
            if (!status) {
                return res.status(400).json({ success: false, message: "Status is required" });
            }
            const attachment = await (0, admin_service_1.updateAttachmentStatus)(req.params.id, status, adminId);
            (0, auditLog_service_1.createAuditLog)({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "STATUS_CHANGE", module: "ATTACHMENT", entityId: req.params.id, description: `Attachment status changed to ${status}`, newData: { status }, ...(0, auditLog_service_1.getRequestContext)(req) });
            res.json({ success: true, data: attachment });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    verifyAttachment: async (req, res) => {
        try {
            const { status } = req.body;
            const adminId = req.user?.id;
            if (!status) {
                return res.status(400).json({ success: false, message: "Verification status is required" });
            }
            const attachment = await (0, admin_service_1.verifyAttachmentByAdmin)(req.params.id, status, adminId);
            (0, auditLog_service_1.createAuditLog)({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "STATUS_CHANGE", module: "ATTACHMENT", entityId: req.params.id, description: `Attachment verification: ${status}`, newData: { verificationStatus: status }, ...(0, auditLog_service_1.getRequestContext)(req) });
            res.json({ success: true, data: attachment });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    deleteAttachment: async (req, res) => {
        try {
            const result = await (0, admin_service_1.deleteAttachment)(req.params.id);
            (0, auditLog_service_1.createAuditLog)({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "DELETE", module: "ATTACHMENT", entityId: req.params.id, description: `Deleted attachment`, ...(0, auditLog_service_1.getRequestContext)(req) });
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
    getCancellationAnalytics: async (req, res) => {
        try {
            const data = await (0, admin_service_1.getCancellationAnalytics)();
            res.json({ success: true, data });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    getAuditTimeline: async (req, res) => {
        try {
            const data = await (0, admin_service_1.getAuditTimeline)();
            res.json({ success: true, data });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
};
