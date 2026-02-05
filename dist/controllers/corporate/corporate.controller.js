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
const corporateAuthService = __importStar(require("../../services/auth/corporate.auth.service"));
const corporateService = __importStar(require("../../services/corporate/corporate.service"));
exports.default = {
    /* ============================================
        AUTH ENDPOINTS
    ============================================ */
    async register(req, res) {
        try {
            const corporate = await corporateAuthService.registerCorporate(req.body);
            res.status(201).json({ success: true, data: corporate });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ success: false, message: "Email and password are required" });
            }
            const result = await corporateAuthService.loginCorporate(email, password);
            res.json({ success: true, data: result });
        }
        catch (err) {
            res.status(401).json({ success: false, message: err.message });
        }
    },
    async getProfile(req, res) {
        try {
            const corporate = await corporateAuthService.getCorporateProfile(req.user.id);
            res.json({ success: true, data: corporate });
        }
        catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    },
    async updateProfile(req, res) {
        try {
            const corporate = await corporateAuthService.updateCorporateProfile(req.user.id, req.body);
            res.json({ success: true, data: corporate });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async getCorporateRides(req, res) {
        try {
            const corporateId = req.params.id || req.user.id;
            const rides = await corporateAuthService.getCorporateRides(corporateId);
            res.json({ success: true, data: rides });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    async getCorporateBillingHistory(req, res) {
        try {
            const corporateId = req.params.id || req.user.id;
            const billings = await corporateAuthService.getCorporateBillingHistory(corporateId);
            res.json({ success: true, data: billings });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    async getCorporatePaymentHistory(req, res) {
        try {
            const corporateId = req.params.id || req.user.id;
            const payments = await corporateAuthService.getCorporatePaymentHistory(corporateId);
            res.json({ success: true, data: payments });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    async getCorporateBillingSummary(req, res) {
        try {
            const corporateId = req.params.id || req.user.id;
            const summary = await corporateAuthService.getCorporateBillingSummary(corporateId);
            res.json({ success: true, data: summary });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    /* ============================================
        CORPORATE MANAGEMENT (Admin endpoints)
    ============================================ */
    async getAllCorporates(req, res) {
        try {
            const { status, agentId, search } = req.query;
            const corporates = await corporateService.getAllCorporates({
                status: status,
                agentId: agentId,
                search: search,
            });
            res.json({ success: true, data: corporates });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    async getCorporateById(req, res) {
        try {
            const corporate = await corporateService.getCorporateById(req.params.id);
            res.json({ success: true, data: corporate });
        }
        catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    },
    async updateCorporateStatus(req, res) {
        try {
            const { status } = req.body;
            if (!status) {
                return res.status(400).json({ success: false, message: "Status is required" });
            }
            const corporate = await corporateService.updateCorporateStatus(req.params.id, status);
            res.json({ success: true, data: corporate });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async updateCorporateCreditLimit(req, res) {
        try {
            const { creditLimit } = req.body;
            if (creditLimit === undefined) {
                return res.status(400).json({ success: false, message: "creditLimit is required" });
            }
            const corporate = await corporateService.updateCorporateCreditLimit(req.params.id, creditLimit);
            res.json({ success: true, data: corporate });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async updateCorporateByAdmin(req, res) {
        try {
            const corporate = await corporateService.updateCorporateByAdmin(req.params.id, req.body);
            res.json({ success: true, data: corporate });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async deleteCorporate(req, res) {
        try {
            const result = await corporateService.deleteCorporate(req.params.id);
            res.json({ success: true, data: result });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
};
