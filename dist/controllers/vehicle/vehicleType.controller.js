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
const vehicleTypeService = __importStar(require("../../services/vehicle/vehicleType.service"));
exports.default = {
    async create(req, res) {
        try {
            const vehicleType = await vehicleTypeService.createVehicleType(req.body);
            res.status(201).json({ success: true, data: vehicleType });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async getAll(req, res) {
        try {
            const vehicleTypes = await vehicleTypeService.getAllVehicleTypes();
            res.json({ success: true, data: vehicleTypes });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    async getById(req, res) {
        try {
            const vehicleType = await vehicleTypeService.getVehicleTypeById(req.params.id);
            if (!vehicleType)
                return res.status(404).json({ success: false, message: "Vehicle type not found" });
            res.json({ success: true, data: vehicleType });
        }
        catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    },
    async update(req, res) {
        try {
            const vehicleType = await vehicleTypeService.updateVehicleType(req.params.id, req.body);
            res.json({ success: true, data: vehicleType });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async delete(req, res) {
        try {
            await vehicleTypeService.deleteVehicleType(req.params.id);
            res.json({ success: true, message: "Vehicle type deleted successfully" });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
};
