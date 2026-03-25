"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const vehicleService = __importStar(require("../../services/vehicle/vehicle.service"));
const prisma_1 = require("../../config/prisma");
const auditLog_service_1 = require("../../services/audit/auditLog.service");
exports.default = {
    /* ============================================
        VEHICLE MANAGEMENT
    ============================================ */
    async createVehicle(req, res) {
        try {
            const vehicle = await vehicleService.createVehicle(req.body);
            (0, auditLog_service_1.createAuditLog)({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "CREATE", module: "VEHICLE", entityId: vehicle.id, description: `Created vehicle: ${req.body.registrationNumber || vehicle.id}`, newData: vehicle, ...(0, auditLog_service_1.getRequestContext)(req) });
            res.status(201).json({ success: true, data: vehicle });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async getAllVehicles(req, res) {
        try {
            const { vendorId, vehicleTypeId, isAvailable, status, verificationStatus, search, includeDeleted, cityCodeId } = req.query;
            const vehicles = await vehicleService.getAllVehicles({
                vendorId: vendorId,
                vehicleTypeId: vehicleTypeId,
                isAvailable: isAvailable === "true" ? true : isAvailable === "false" ? false : undefined,
                status: status ? status.toUpperCase() : undefined,
                verificationStatus: verificationStatus ? verificationStatus.toUpperCase() : undefined,
                search: search,
                includeDeleted: includeDeleted === "true",
                cityCodeId: cityCodeId,
            });
            res.json({ success: true, data: vehicles });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    async getVehicleById(req, res) {
        try {
            const vehicle = await vehicleService.getVehicleById(req.params.id);
            res.json({ success: true, data: vehicle });
        }
        catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    },
    async updateVehicle(req, res) {
        try {
            const adminId = req.user?.id;
            const oldVehicle = await prisma_1.prisma.vehicle.findUnique({ where: { id: req.params.id }, select: { registrationNumber: true, vehicleModel: true, status: true, verificationStatus: true } });
            const vehicle = await vehicleService.updateVehicle(req.params.id, {
                ...req.body,
                updatedByAdminId: adminId
            });
            (0, auditLog_service_1.createAuditLog)({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "UPDATE", module: "VEHICLE", entityId: req.params.id, description: `Updated vehicle details`, oldData: oldVehicle, newData: req.body, ...(0, auditLog_service_1.getRequestContext)(req) });
            res.json({ success: true, data: vehicle });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async updateVehicleStatus(req, res) {
        try {
            const { status } = req.body;
            const adminId = req.user?.id;
            if (!status) {
                return res.status(400).json({ success: false, message: "Status is required" });
            }
            const oldVehicle = await prisma_1.prisma.vehicle.findUnique({ where: { id: req.params.id }, select: { status: true, registrationNumber: true } });
            const vehicle = await vehicleService.updateVehicleStatus(req.params.id, status, adminId);
            (0, auditLog_service_1.createAuditLog)({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "STATUS_CHANGE", module: "VEHICLE", entityId: req.params.id, description: `Vehicle status changed to ${status}`, oldData: oldVehicle, newData: { status }, ...(0, auditLog_service_1.getRequestContext)(req) });
            res.json({ success: true, data: vehicle });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async updateVehicleVerification(req, res) {
        try {
            const { status } = req.body;
            const adminId = req.user?.id;
            if (!status) {
                return res.status(400).json({ success: false, message: "Verification status is required" });
            }
            const oldVehicle = await prisma_1.prisma.vehicle.findUnique({ where: { id: req.params.id }, select: { verificationStatus: true, registrationNumber: true } });
            const vehicle = await vehicleService.updateVehicleVerification(req.params.id, status, adminId);
            (0, auditLog_service_1.createAuditLog)({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "STATUS_CHANGE", module: "VEHICLE", entityId: req.params.id, description: `Vehicle verification changed to ${status}`, oldData: oldVehicle, newData: { verificationStatus: status }, ...(0, auditLog_service_1.getRequestContext)(req) });
            res.json({ success: true, data: vehicle });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async assignVehicleToVendor(req, res) {
        try {
            const { vendorId } = req.body;
            if (!vendorId) {
                return res.status(400).json({ success: false, message: "vendorId is required" });
            }
            const vehicle = await vehicleService.assignVehicleToVendor(req.params.id, vendorId);
            (0, auditLog_service_1.createAuditLog)({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "ASSIGNMENT", module: "VEHICLE", entityId: req.params.id, description: `Assigned vehicle to vendor`, newData: { vendorId }, ...(0, auditLog_service_1.getRequestContext)(req) });
            res.json({ success: true, data: vehicle });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async getAvailableVehicles(req, res) {
        try {
            const { vehicleTypeId } = req.query;
            const vehicles = await vehicleService.getAvailableVehicles(vehicleTypeId);
            res.json({ success: true, data: vehicles });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    async getVehicleRides(req, res) {
        try {
            const rides = await vehicleService.getVehicleRides(req.params.id);
            res.json({ success: true, data: rides });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    async deleteVehicle(req, res) {
        try {
            const adminId = req.user?.id;
            const result = await vehicleService.deleteVehicle(req.params.id, adminId);
            (0, auditLog_service_1.createAuditLog)({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "DELETE", module: "VEHICLE", entityId: req.params.id, description: `Deleted a vehicle`, ...(0, auditLog_service_1.getRequestContext)(req) });
            res.json({ success: true, data: result });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
};
