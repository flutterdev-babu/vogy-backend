import { Response } from "express";
import { AuthedRequest } from "../../middleware/auth.middleware";
import * as agentAuthService from "../../services/auth/agent.auth.service";
import * as agentService from "../../services/agent/agent.service";
import * as agentRideService from "../../services/agent/agent.ride.service";
import * as vendorAuthService from "../../services/auth/vendor.auth.service";
import * as corporateAuthService from "../../services/auth/corporate.auth.service";
import * as partnerAuthService from "../../services/auth/partner.auth.service";

export default {
  /* ============================================
      AUTH ENDPOINTS
  ============================================ */

  async register(req: AuthedRequest, res: Response) {
    try {
      const agent = await agentAuthService.registerAgent(req.body);
      res.status(201).json({ success: true, data: agent });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async login(req: AuthedRequest, res: Response) {
    try {
      const { phone, password } = req.body;
      if (!phone || !password) {
        return res.status(400).json({ success: false, message: "Phone and password are required" });
      }
      const result = await agentAuthService.loginAgent(phone, password);
      res.json({ success: true, data: result });
    } catch (err: any) {
      console.error("[AGENT LOGIN ERROR]:", err);
      res.status(401).json({ success: false, message: err.message });
    }
  },

  async getProfile(req: AuthedRequest, res: Response) {
    try {
      const agent = await agentAuthService.getAgentProfile(req.user.id);
      res.json({ success: true, data: agent });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message });
    }
  },

  async updateProfile(req: AuthedRequest, res: Response) {
    try {
      const agent = await agentAuthService.updateAgentProfile(req.user.id, req.body);
      res.json({ success: true, data: agent });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async getAgentVendors(req: AuthedRequest, res: Response) {
    try {
      const agentId = req.params.id || req.user.id;
      const vendors = await agentAuthService.getAgentVendors(agentId);
      res.json({ success: true, data: vendors });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getAgentCorporates(req: AuthedRequest, res: Response) {
    try {
      const agentId = req.params.id || req.user.id;
      const corporates = await agentAuthService.getAgentCorporates(agentId);
      res.json({ success: true, data: corporates });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getAgentRides(req: AuthedRequest, res: Response) {
    try {
      // Fetch rides associated with this agent's ID
      const rides = await agentAuthService.getAgentRides(req.user.id);
      
      // Optionally also fetch rides linked by agentCode if they have one
      const agent = await agentAuthService.getAgentProfile(req.user.id);
      if (agent.agentCode) {
        const codeRides = await agentService.getAgentRides(agent.agentCode);
        
        // Merge rides and deduplicate by ID
        const allRides = [...rides, ...codeRides];
        const uniqueRides = Array.from(new Map(allRides.map(r => [r.id, r])).values());
        
        return res.json({ success: true, data: uniqueRides });
      }
      
      res.json({ success: true, data: rides });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getAgentAnalytics(req: AuthedRequest, res: Response) {
    try {
      const agentId = req.params.id || req.user.id;
      const analytics = await agentAuthService.getAgentAnalytics(agentId);
      res.json({ success: true, data: analytics });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /* ============================================
      AGENT MANAGEMENT (Admin endpoints)
  ============================================ */

  async getAllAgents(req: AuthedRequest, res: Response) {
    try {
      const { search } = req.query;
      const agents = await agentService.getAllAgents(search as string);
      res.json({ success: true, data: agents });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getAgentById(req: AuthedRequest, res: Response) {
    try {
      const agent = await agentService.getAgentById(req.params.id);
      res.json({ success: true, data: agent });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message });
    }
  },

  async updateAgentByAdmin(req: AuthedRequest, res: Response) {
    try {
      const agent = await agentService.updateAgentByAdmin(req.params.id, req.body);
      res.json({ success: true, data: agent });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async deleteAgent(req: AuthedRequest, res: Response) {
    try {
      const result = await agentService.deleteAgent(req.params.id);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  /* ============================================
      USER/RIDER MANAGEMENT (Agent endpoints)
  ============================================ */

  async getAllUsers(req: AuthedRequest, res: Response) {
    try {
      const { search } = req.query;
      const users = await agentService.getAllUsers(search as string);
      res.json({ success: true, data: users });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async createUser(req: AuthedRequest, res: Response) {
    try {
      const user = await agentService.createUser(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  /* ============================================
      RIDE MANAGEMENT (Agent endpoints)
  ============================================ */

  async getOverallRides(req: AuthedRequest, res: Response) {
    try {
      const { status, startDate, endDate, search } = req.query;
      const rides = await agentRideService.getOverallRides({
        status: status as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        search: search as string,
      });
      res.json({ success: true, data: rides });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getVendorRides(req: AuthedRequest, res: Response) {
    try {
      const { status, vendorId } = req.query;
      const rides = await agentRideService.getAgentVendorRides(req.user.id, {
        status: status as string,
        vendorId: vendorId as string,
      });
      res.json({ success: true, data: rides });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getAgentPartners(req: AuthedRequest, res: Response) {
    try {
      const { status, search } = req.query;
      const partners = await agentRideService.getAgentPartners(req.user.id, {
        status: status as string,
        search: search as string,
      });
      res.json({ success: true, data: partners });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getAgentVehicles(req: AuthedRequest, res: Response) {
    try {
      const { vehicleTypeId, search } = req.query;
      const vehicles = await agentRideService.getAgentVehicles(req.user.id, {
        vehicleTypeId: vehicleTypeId as string,
        search: search as string,
      });
      res.json({ success: true, data: vehicles });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async createManualRide(req: AuthedRequest, res: Response) {
    try {
      const { cityCodeId } = req.body;
      if (!cityCodeId) {
        return res.status(400).json({ success: false, message: "cityCodeId is required" });
      }
      const ride = await agentRideService.createAgentManualRide(req.user.id, req.body);
      res.status(201).json({ success: true, data: ride });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async updateRideStatus(req: AuthedRequest, res: Response) {
    try {
      const { status, reason } = req.body;
      const ride = await agentRideService.updateAgentRideStatus(req.user.id, req.params.id, status, reason);
      res.json({ success: true, data: ride });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async assignPartnerToRide(req: AuthedRequest, res: Response) {
    try {
      const { partnerId, vehicleId } = req.body;
      const ride = await agentRideService.assignPartnerToRide(req.user.id, req.params.id, partnerId, vehicleId);
      res.json({ success: true, data: ride });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async getFareEstimate(req: AuthedRequest, res: Response) {
    try {
      const { distanceKm } = req.query;
      if (!distanceKm) return res.status(400).json({ success: false, message: "distanceKm is required" });
      const estimates = await agentRideService.getFareEstimate(parseFloat(distanceKm as string));
      res.json({ success: true, data: estimates });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /* ============================================
      ENTITY REGISTRATION (Agent-led)
  ============================================ */

  async registerVendor(req: AuthedRequest, res: Response) {
    try {
      // Auto-link to this agent
      const data = { ...req.body, agentId: req.user.id };
      const vendor = await vendorAuthService.registerVendor(data);
      res.status(201).json({ success: true, data: vendor });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async registerPartner(req: AuthedRequest, res: Response) {
    try {
      // Auto-link to this agent (via vendorId if applicable, or direct if schema allows)
      // For now, partners are usually under vendors, but if an agent is creating them, 
      // we might need to handle assignment logic.
      const partner = await partnerAuthService.registerPartner(req.body);
      res.status(201).json({ success: true, data: partner });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async registerCorporate(req: AuthedRequest, res: Response) {
    try {
      // Auto-link to this agent
      const data = { ...req.body, agentId: req.user.id };
      const corporate = await corporateAuthService.registerCorporate(data);
      res.status(201).json({ success: true, data: corporate });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },
};
