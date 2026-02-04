import { Response } from "express";
import { AuthedRequest } from "../../middleware/auth.middleware";
import * as agentAuthService from "../../services/auth/agent.auth.service";
import * as agentService from "../../services/agent/agent.service";
import * as vendorAuthService from "../../services/auth/vendor.auth.service";
import * as corporateAuthService from "../../services/auth/corporate.auth.service";

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
      const agentId = req.params.id || req.user.id;
      const rides = await agentAuthService.getAgentRides(agentId);
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
      VENDOR/CORPORATE CREATION (Agent endpoints)
  ============================================ */

  async createVendor(req: AuthedRequest, res: Response) {
    try {
      // Agent creates vendor with their agentId auto-set
      const vendorData = {
        ...req.body,
        agentId: req.user.id,
      };
      const vendor = await vendorAuthService.registerVendor(vendorData);
      res.status(201).json({ success: true, data: vendor });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async createCorporate(req: AuthedRequest, res: Response) {
    try {
      // Agent creates corporate with their agentId auto-set
      const corporateData = {
        ...req.body,
        agentId: req.user.id,
      };
      const corporate = await corporateAuthService.registerCorporate(corporateData);
      res.status(201).json({ success: true, data: corporate });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
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

  async registerVendorUnderAgent(req: AuthedRequest, res: Response) {
    try {
      const { vendorId } = req.body;
      if (!vendorId) {
        return res.status(400).json({ success: false, message: "vendorId is required" });
      }
      const vendor = await agentService.registerVendorUnderAgent(vendorId, req.params.id);
      res.json({ success: true, data: vendor });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async registerCorporateUnderAgent(req: AuthedRequest, res: Response) {
    try {
      const { corporateId } = req.body;
      if (!corporateId) {
        return res.status(400).json({ success: false, message: "corporateId is required" });
      }
      const corporate = await agentService.registerCorporateUnderAgent(corporateId, req.params.id);
      res.json({ success: true, data: corporate });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async unassignVendorFromAgent(req: AuthedRequest, res: Response) {
    try {
      const { vendorId } = req.params;
      const vendor = await agentService.unassignVendorFromAgent(vendorId);
      res.json({ success: true, data: vendor });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async unassignCorporateFromAgent(req: AuthedRequest, res: Response) {
    try {
      const { corporateId } = req.params;
      const corporate = await agentService.unassignCorporateFromAgent(corporateId);
      res.json({ success: true, data: corporate });
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
};
