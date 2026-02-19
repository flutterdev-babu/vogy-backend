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
            const agent = await agentAuthService.getAgentProfile(req.user.id);
            if (!agent.agentCode) {
                return res.json({ success: true, data: [], message: "No agent code assigned" });
            }
            const rides = await agentService.getAgentRides(agent.agentCode);
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
    async getAgentVehicles(req, res) {
        try {
            const { vehicleTypeId, search } = req.query;
            const vehicles = await agentRideService.getAgentVehicles(req.user.id, {
                vehicleTypeId: vehicleTypeId,
                search: search,
            });
            res.json({ success: true, data: vehicles });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    async createManualRide(req, res) {
        try {
            const { cityCodeId } = req.body;
            if (!cityCodeId) {
                return res.status(400).json({ success: false, message: "cityCodeId is required" });
            }
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
