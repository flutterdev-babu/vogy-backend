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
const vendorAuthService = __importStar(require("../../services/auth/vendor.auth.service"));
const vendorService = __importStar(require("../../services/vendor/vendor.service"));
exports.default = {
    /* ============================================
        AUTH ENDPOINTS
    ============================================ */
    async register(req, res) {
        try {
            const vendor = await vendorAuthService.registerVendor(req.body);
            res.status(201).json({ success: true, data: vendor });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async login(req, res) {
        try {
            const { phone, password } = req.body;
            if (!phone || !password) {
                return res.status(400).json({ success: false, message: "Phone and password are required" });
            }
            const result = await vendorAuthService.loginVendor(phone, password);
            res.json({ success: true, data: result });
        }
        catch (err) {
            res.status(401).json({ success: false, message: err.message });
        }
    },
    async getProfile(req, res) {
        try {
            const vendor = await vendorAuthService.getVendorProfile(req.user.id);
            res.json({ success: true, data: vendor });
        }
        catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    },
    async updateProfile(req, res) {
        try {
            const vendor = await vendorAuthService.updateVendorProfile(req.user.id, req.body);
            res.json({ success: true, data: vendor });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    /* ============================================
        VENDOR MANAGEMENT (Admin endpoints)
    ============================================ */
    async getAllVendors(req, res) {
        try {
            const { status, agentId, search } = req.query;
            const vendors = await vendorService.getAllVendors({
                status: status,
                agentId: agentId,
                search: search,
            });
            res.json({ success: true, data: vendors });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    async getVendorById(req, res) {
        try {
            const vendor = await vendorService.getVendorById(req.params.id);
            res.json({ success: true, data: vendor });
        }
        catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    },
    async updateVendorStatus(req, res) {
        try {
            const { status } = req.body;
            if (!status) {
                return res.status(400).json({ success: false, message: "Status is required" });
            }
            const vendor = await vendorService.updateVendorStatus(req.params.id, status);
            res.json({ success: true, data: vendor });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async updateVendorByAdmin(req, res) {
        try {
            const vendor = await vendorService.updateVendorByAdmin(req.params.id, req.body);
            res.json({ success: true, data: vendor });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async getVendorVehicles(req, res) {
        try {
            const vendorId = req.params.id || req.user.id;
            const vehicles = await vendorService.getVendorVehicles(vendorId);
            res.json({ success: true, data: vehicles });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    async getVendorRides(req, res) {
        try {
            const vendorId = req.params.id || req.user.id;
            const { status, startDate, endDate } = req.query;
            const rides = await vendorService.getVendorRides(vendorId, {
                status: status,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
            });
            res.json({ success: true, data: rides });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    async getVendorAnalytics(req, res) {
        try {
            const vendorId = req.params.id || req.user.id;
            const analytics = await vendorService.getVendorAnalytics(vendorId);
            res.json({ success: true, data: analytics });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    async deleteVendor(req, res) {
        try {
            const result = await vendorService.deleteVendor(req.params.id);
            res.json({ success: true, data: result });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
};
