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
exports.default = {
    /* ============================================
        VEHICLE MANAGEMENT
    ============================================ */
    async createVehicle(req, res) {
        try {
            const vehicle = await vehicleService.createVehicle(req.body);
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
            const vehicle = await vehicleService.updateVehicle(req.params.id, {
                ...req.body,
                updatedByAdminId: adminId
            });
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
            const vehicle = await vehicleService.updateVehicleStatus(req.params.id, status, adminId);
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
            const vehicle = await vehicleService.updateVehicleVerification(req.params.id, status, adminId);
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
            res.json({ success: true, data: result });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
};
