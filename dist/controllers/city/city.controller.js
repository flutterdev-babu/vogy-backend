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
const cityService = __importStar(require("../../services/city/city.service"));
exports.default = {
    /* ============================================
        PUBLIC ENDPOINTS
    ============================================ */
    async getAllCityCodes(req, res) {
        try {
            const cityCodes = await cityService.getAllCityCodes();
            res.json({ success: true, data: cityCodes });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    /* ============================================
        AGENT ENDPOINTS
    ============================================ */
    async createCityCode(req, res) {
        try {
            const { code, cityName } = req.body;
            if (!code || !cityName) {
                return res.status(400).json({
                    success: false,
                    message: "code and cityName are required",
                });
            }
            const cityCode = await cityService.createCityCode(req.user.id, { code, cityName });
            res.status(201).json({ success: true, data: cityCode });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async getAgentCityCodes(req, res) {
        try {
            const cityCodes = await cityService.getAgentCityCodes(req.user.id);
            res.json({ success: true, data: cityCodes });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    async getCityCodeById(req, res) {
        try {
            const cityCode = await cityService.getCityCodeById(req.params.id);
            res.json({ success: true, data: cityCode });
        }
        catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    },
    async updateCityCode(req, res) {
        try {
            const cityCode = await cityService.updateCityCode(req.params.id, req.user.id, req.body);
            res.json({ success: true, data: cityCode });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async deleteCityCode(req, res) {
        try {
            const result = await cityService.deleteCityCode(req.params.id, req.user.id);
            res.json({ success: true, data: result });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    /* ============================================
        PRICING ENDPOINTS
    ============================================ */
    async setCityPricing(req, res) {
        try {
            const { vehicleTypeId, baseKm, baseFare, perKmAfterBase } = req.body;
            if (!vehicleTypeId || baseKm === undefined || baseFare === undefined || perKmAfterBase === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "vehicleTypeId, baseKm, baseFare, and perKmAfterBase are required",
                });
            }
            const pricing = await cityService.setCityPricing(req.user.id, req.params.cityCodeId, {
                vehicleTypeId,
                baseKm,
                baseFare,
                perKmAfterBase,
            });
            res.json({ success: true, data: pricing });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async getCityPricing(req, res) {
        try {
            const pricing = await cityService.getCityPricing(req.params.cityCodeId);
            res.json({ success: true, data: pricing });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    async deleteCityPricing(req, res) {
        try {
            const { vehicleTypeId } = req.params;
            const result = await cityService.deleteCityPricing(req.user.id, req.params.cityCodeId, vehicleTypeId);
            res.json({ success: true, data: result });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
};
