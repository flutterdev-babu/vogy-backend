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
const agentAuthService = __importStar(require("../../services/auth/agent.auth.service"));
const agentService = __importStar(require("../../services/agent/agent.service"));
const agentRideService = __importStar(require("../../services/agent/agent.ride.service"));
const vendorAuthService = __importStar(require("../../services/auth/vendor.auth.service"));
const corporateAuthService = __importStar(require("../../services/auth/corporate.auth.service"));
exports.default = {
    /* ============================================
        AUTH ENDPOINTS
    ============================================ */
    async register(req, res) {
        try {
            const agent = await agentAuthService.registerAgent(req.body);
            res.status(201).json({ success: true, data: agent });
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
            const result = await agentAuthService.loginAgent(phone, password);
            res.json({ success: true, data: result });
        }
        catch (err) {
            res.status(401).json({ success: false, message: err.message });
        }
    },
    async getProfile(req, res) {
        try {
            const agent = await agentAuthService.getAgentProfile(req.user.id);
            res.json({ success: true, data: agent });
        }
        catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    },
    async updateProfile(req, res) {
        try {
            const agent = await agentAuthService.updateAgentProfile(req.user.id, req.body);
            res.json({ success: true, data: agent });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async getAgentVendors(req, res) {
        try {
            const agentId = req.params.id || req.user.id;
            const vendors = await agentAuthService.getAgentVendors(agentId);
            res.json({ success: true, data: vendors });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    async getAgentCorporates(req, res) {
        try {
            const agentId = req.params.id || req.user.id;
            const corporates = await agentAuthService.getAgentCorporates(agentId);
            res.json({ success: true, data: corporates });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    async getAgentRides(req, res) {
        try {
            const agentId = req.params.id || req.user.id;
            const rides = await agentAuthService.getAgentRides(agentId);
            res.json({ success: true, data: rides });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    async getAgentAnalytics(req, res) {
        try {
            const agentId = req.params.id || req.user.id;
            const analytics = await agentAuthService.getAgentAnalytics(agentId);
            res.json({ success: true, data: analytics });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    /* ============================================
        VENDOR/CORPORATE CREATION (Agent endpoints)
    ============================================ */
    async createVendor(req, res) {
        try {
            // Agent creates vendor with their agentId auto-set
            const vendorData = {
                ...req.body,
                agentId: req.user.id,
            };
            const vendor = await vendorAuthService.registerVendor(vendorData);
            res.status(201).json({ success: true, data: vendor });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async createCorporate(req, res) {
        try {
            // Agent creates corporate with their agentId auto-set
            const corporateData = {
                ...req.body,
                agentId: req.user.id,
            };
            const corporate = await corporateAuthService.registerCorporate(corporateData);
            res.status(201).json({ success: true, data: corporate });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    /* ============================================
        AGENT MANAGEMENT (Admin endpoints)
    ============================================ */
    async getAllAgents(req, res) {
        try {
            const { search } = req.query;
            const agents = await agentService.getAllAgents(search);
            res.json({ success: true, data: agents });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    async getAgentById(req, res) {
        try {
            const agent = await agentService.getAgentById(req.params.id);
            res.json({ success: true, data: agent });
        }
        catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    },
    async updateAgentByAdmin(req, res) {
        try {
            const agent = await agentService.updateAgentByAdmin(req.params.id, req.body);
            res.json({ success: true, data: agent });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async registerVendorUnderAgent(req, res) {
        try {
            const { vendorId } = req.body;
            if (!vendorId) {
                return res.status(400).json({ success: false, message: "vendorId is required" });
            }
            const vendor = await agentService.registerVendorUnderAgent(vendorId, req.params.id);
            res.json({ success: true, data: vendor });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async registerCorporateUnderAgent(req, res) {
        try {
            const { corporateId } = req.body;
            if (!corporateId) {
                return res.status(400).json({ success: false, message: "corporateId is required" });
            }
            const corporate = await agentService.registerCorporateUnderAgent(corporateId, req.params.id);
            res.json({ success: true, data: corporate });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async unassignVendorFromAgent(req, res) {
        try {
            const { vendorId } = req.params;
            const vendor = await agentService.unassignVendorFromAgent(vendorId);
            res.json({ success: true, data: vendor });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async unassignCorporateFromAgent(req, res) {
        try {
            const { corporateId } = req.params;
            const corporate = await agentService.unassignCorporateFromAgent(corporateId);
            res.json({ success: true, data: corporate });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async deleteAgent(req, res) {
        try {
            const result = await agentService.deleteAgent(req.params.id);
            res.json({ success: true, data: result });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    /* ============================================
        USER/RIDER MANAGEMENT (Agent endpoints)
    ============================================ */
    async getAllUsers(req, res) {
        try {
            const { search } = req.query;
            const users = await agentService.getAllUsers(search);
            res.json({ success: true, data: users });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    async createUser(req, res) {
        try {
            const user = await agentService.createUser(req.body);
            res.status(201).json({ success: true, data: user });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    /* ============================================
        RIDE MANAGEMENT (Agent endpoints)
    ============================================ */
    async getOverallRides(req, res) {
        try {
            const { status, startDate, endDate, search } = req.query;
            const rides = await agentRideService.getOverallRides({
                status: status,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                search: search,
            });
            res.json({ success: true, data: rides });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    async getVendorRides(req, res) {
        try {
            const { status, vendorId } = req.query;
            const rides = await agentRideService.getAgentVendorRides(req.user.id, {
                status: status,
                vendorId: vendorId,
            });
            res.json({ success: true, data: rides });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    async getAgentPartners(req, res) {
        try {
            const { status, search } = req.query;
            const partners = await agentRideService.getAgentPartners(req.user.id, {
                status: status,
                search: search,
            });
            res.json({ success: true, data: partners });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    async createManualRide(req, res) {
        try {
            const ride = await agentRideService.createAgentManualRide(req.user.id, req.body);
            res.status(201).json({ success: true, data: ride });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async updateRideStatus(req, res) {
        try {
            const { status, reason } = req.body;
            const ride = await agentRideService.updateAgentRideStatus(req.user.id, req.params.id, status, reason);
            res.json({ success: true, data: ride });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async assignPartnerToRide(req, res) {
        try {
            const { partnerId, vehicleId } = req.body;
            const ride = await agentRideService.assignPartnerToRide(req.user.id, req.params.id, partnerId, vehicleId);
            res.json({ success: true, data: ride });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async getFareEstimate(req, res) {
        try {
            const { distanceKm } = req.query;
            if (!distanceKm)
                return res.status(400).json({ success: false, message: "distanceKm is required" });
            const estimates = await agentRideService.getFareEstimate(parseFloat(distanceKm));
            res.json({ success: true, data: estimates });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
};
