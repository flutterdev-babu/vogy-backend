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
exports.deletePeakHourCharge = exports.updatePeakHourCharge = exports.getPeakHourChargeById = exports.getAllPeakHourCharges = exports.createPeakHourCharge = void 0;
const peakHourService = __importStar(require("../../services/admin/peakHour.service"));
const createPeakHourCharge = async (req, res) => {
    try {
        const peakHourCharge = await peakHourService.createPeakHourCharge(req.body);
        res.status(201).json({
            status: "success",
            data: peakHourCharge,
        });
    }
    catch (error) {
        res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
};
exports.createPeakHourCharge = createPeakHourCharge;
const getAllPeakHourCharges = async (req, res) => {
    try {
        const { vehicleTypeId, cityCodeId, isActive } = req.query;
        const filters = {
            vehicleTypeId: vehicleTypeId,
            cityCodeId: cityCodeId,
            isActive: isActive !== undefined ? isActive === "true" : undefined,
        };
        const charges = await peakHourService.getAllPeakHourCharges(filters);
        res.status(200).json({
            status: "success",
            data: charges,
        });
    }
    catch (error) {
        res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
};
exports.getAllPeakHourCharges = getAllPeakHourCharges;
const getPeakHourChargeById = async (req, res) => {
    try {
        const charge = await peakHourService.getPeakHourChargeById(req.params.id);
        res.status(200).json({
            status: "success",
            data: charge,
        });
    }
    catch (error) {
        res.status(404).json({
            status: "error",
            message: error.message,
        });
    }
};
exports.getPeakHourChargeById = getPeakHourChargeById;
const updatePeakHourCharge = async (req, res) => {
    try {
        const charge = await peakHourService.updatePeakHourCharge(req.params.id, req.body);
        res.status(200).json({
            status: "success",
            data: charge,
        });
    }
    catch (error) {
        res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
};
exports.updatePeakHourCharge = updatePeakHourCharge;
const deletePeakHourCharge = async (req, res) => {
    try {
        const result = await peakHourService.deletePeakHourCharge(req.params.id);
        res.status(200).json({
            status: "success",
            ...result,
        });
    }
    catch (error) {
        res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
};
exports.deletePeakHourCharge = deletePeakHourCharge;
exports.default = {
    createPeakHourCharge: exports.createPeakHourCharge,
    getAllPeakHourCharges: exports.getAllPeakHourCharges,
    getPeakHourChargeById: exports.getPeakHourChargeById,
    updatePeakHourCharge: exports.updatePeakHourCharge,
    deletePeakHourCharge: exports.deletePeakHourCharge,
};
