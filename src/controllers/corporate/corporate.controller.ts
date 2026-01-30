import { Response } from "express";
import { AuthedRequest } from "../../middleware/auth.middleware";
import * as corporateAuthService from "../../services/auth/corporate.auth.service";
import * as corporateService from "../../services/corporate/corporate.service";

export default {
  /* ============================================
      AUTH ENDPOINTS
  ============================================ */

  async register(req: AuthedRequest, res: Response) {
    try {
      const corporate = await corporateAuthService.registerCorporate(req.body);
      res.status(201).json({ success: true, data: corporate });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async login(req: AuthedRequest, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required" });
      }
      const result = await corporateAuthService.loginCorporate(email, password);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(401).json({ success: false, message: err.message });
    }
  },

  async getProfile(req: AuthedRequest, res: Response) {
    try {
      const corporate = await corporateAuthService.getCorporateProfile(req.user.id);
      res.json({ success: true, data: corporate });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message });
    }
  },

  async updateProfile(req: AuthedRequest, res: Response) {
    try {
      const corporate = await corporateAuthService.updateCorporateProfile(req.user.id, req.body);
      res.json({ success: true, data: corporate });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async getCorporateRides(req: AuthedRequest, res: Response) {
    try {
      const corporateId = req.params.id || req.user.id;
      const rides = await corporateAuthService.getCorporateRides(corporateId);
      res.json({ success: true, data: rides });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getCorporateBillingHistory(req: AuthedRequest, res: Response) {
    try {
      const corporateId = req.params.id || req.user.id;
      const billings = await corporateAuthService.getCorporateBillingHistory(corporateId);
      res.json({ success: true, data: billings });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getCorporatePaymentHistory(req: AuthedRequest, res: Response) {
    try {
      const corporateId = req.params.id || req.user.id;
      const payments = await corporateAuthService.getCorporatePaymentHistory(corporateId);
      res.json({ success: true, data: payments });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getCorporateBillingSummary(req: AuthedRequest, res: Response) {
    try {
      const corporateId = req.params.id || req.user.id;
      const summary = await corporateAuthService.getCorporateBillingSummary(corporateId);
      res.json({ success: true, data: summary });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /* ============================================
      CORPORATE MANAGEMENT (Admin endpoints)
  ============================================ */

  async getAllCorporates(req: AuthedRequest, res: Response) {
    try {
      const { status, agentId, search } = req.query;
      const corporates = await corporateService.getAllCorporates({
        status: status as any,
        agentId: agentId as string,
        search: search as string,
      });
      res.json({ success: true, data: corporates });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getCorporateById(req: AuthedRequest, res: Response) {
    try {
      const corporate = await corporateService.getCorporateById(req.params.id);
      res.json({ success: true, data: corporate });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message });
    }
  },

  async updateCorporateStatus(req: AuthedRequest, res: Response) {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ success: false, message: "Status is required" });
      }
      const corporate = await corporateService.updateCorporateStatus(req.params.id, status);
      res.json({ success: true, data: corporate });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async updateCorporateCreditLimit(req: AuthedRequest, res: Response) {
    try {
      const { creditLimit } = req.body;
      if (creditLimit === undefined) {
        return res.status(400).json({ success: false, message: "creditLimit is required" });
      }
      const corporate = await corporateService.updateCorporateCreditLimit(req.params.id, creditLimit);
      res.json({ success: true, data: corporate });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async updateCorporateByAdmin(req: AuthedRequest, res: Response) {
    try {
      const corporate = await corporateService.updateCorporateByAdmin(req.params.id, req.body);
      res.json({ success: true, data: corporate });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async deleteCorporate(req: AuthedRequest, res: Response) {
    try {
      const result = await corporateService.deleteCorporate(req.params.id);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },
};
