import { Response } from "express";
import { AuthedRequest } from "../../middleware/auth.middleware";
import * as partnerAuthService from "../../services/auth/partner.auth.service";
import * as partnerService from "../../services/partner/partner.service";
import * as adminService from "../../services/admin/admin.service";
import { prisma } from "../../config/prisma";

export default {
  /* ============================================
      AUTH ENDPOINTS
  ============================================ */

  async register(req: AuthedRequest, res: Response) {
    try {
      const partner = await partnerAuthService.registerPartner(req.body);
      res.status(201).json({ success: true, data: partner });
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
      const result = await partnerAuthService.loginPartner(phone, password);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(401).json({ success: false, message: err.message });
    }
  },

  async getProfile(req: AuthedRequest, res: Response) {
    try {
      const partner = await partnerAuthService.getPartnerProfile(req.user.id);
      res.json({ success: true, data: partner });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message });
    }
  },

  async updateProfile(req: AuthedRequest, res: Response) {
    try {
      const partner = await partnerAuthService.updatePartnerProfile(req.user.id, req.body);
      res.json({ success: true, data: partner });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async updateLocation(req: AuthedRequest, res: Response) {
    try {
      const { lat, lng } = req.body;
      if (lat === undefined || lng === undefined) {
        return res.status(400).json({ success: false, message: "lat and lng are required" });
      }
      const partner = await partnerAuthService.updatePartnerLocation(req.user.id, lat, lng);
      res.json({ success: true, data: partner });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async toggleOnlineStatus(req: AuthedRequest, res: Response) {
    try {
      const { isOnline } = req.body;
      if (isOnline === undefined) {
        return res.status(400).json({ success: false, message: "isOnline is required" });
      }
      const partner = await partnerAuthService.togglePartnerOnline(req.user.id, isOnline);
      res.json({ success: true, data: partner });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  /* ============================================
      PARTNER MANAGEMENT (Admin endpoints)
  ============================================ */

  async getAllPartners(req: AuthedRequest, res: Response) {
    try {
      const { status, vendorId, isOnline, search } = req.query;
      const partners = await partnerService.getAllPartners({
        status: status as any,
        vendorId: vendorId as string,
        isOnline: isOnline === "true" ? true : isOnline === "false" ? false : undefined,
        search: search as string,
      });
      res.json({ success: true, data: partners });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getPartnerById(req: AuthedRequest, res: Response) {
    try {
      const partner = await partnerService.getPartnerById(req.params.id);
      res.json({ success: true, data: partner });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message });
    }
  },

  async updatePartnerStatus(req: AuthedRequest, res: Response) {
    try {
      const { status } = req.body;
      const adminId = req.user?.id;
      if (!status) {
        return res.status(400).json({ success: false, message: "Status is required" });
      }
      const partner = await partnerService.updatePartnerStatus(req.params.id, status, adminId);
      res.json({ success: true, data: partner });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async updatePartnerVerification(req: AuthedRequest, res: Response) {
    try {
      const { status } = req.body;
      const adminId = req.user?.id;
      if (!status) {
        return res.status(400).json({ success: false, message: "Verification status is required" });
      }
      const partner = await partnerService.updatePartnerVerification(req.params.id, status, adminId);
      res.json({ success: true, data: partner });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async updatePartnerByAdmin(req: AuthedRequest, res: Response) {
    try {
      const partner = await partnerService.updatePartnerByAdmin(req.params.id, req.body);
      res.json({ success: true, data: partner });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async assignPartnerToVehicle(req: AuthedRequest, res: Response) {
    try {
      const { vehicleId } = req.body;
      if (!vehicleId) {
        return res.status(400).json({ success: false, message: "vehicleId is required" });
      }
      const partner = await partnerService.assignPartnerToVehicle(req.params.id, vehicleId);
      res.json({ success: true, data: partner });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async unassignPartnerFromVehicle(req: AuthedRequest, res: Response) {
    try {
      const partner = await partnerService.unassignPartnerFromVehicle(req.params.id);
      res.json({ success: true, data: partner });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async getPartnerRides(req: AuthedRequest, res: Response) {
    try {
      const partnerId = req.params.id || req.user.id;
      const { status, startDate, endDate } = req.query;
      const rides = await partnerService.getPartnerRides(partnerId, {
        status: status as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });
      res.json({ success: true, data: rides });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getPartnerAnalytics(req: AuthedRequest, res: Response) {
    try {
      const partnerId = req.params.id || req.user.id;
      const analytics = await partnerService.getPartnerAnalytics(partnerId);
      res.json({ success: true, data: analytics });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getAvailablePartners(req: AuthedRequest, res: Response) {
    try {
      const { vehicleTypeId } = req.query;
      const partners = await partnerService.getAvailablePartners(vehicleTypeId as string);
      res.json({ success: true, data: partners });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async deletePartner(req: AuthedRequest, res: Response) {
    try {
      const adminId = req.user?.id;
      const result = await partnerService.deletePartner(req.params.id, adminId);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async createAttachment(req: AuthedRequest, res: Response) {
    try {
      const { fileType, fileUrl, uploadedBy } = req.body;
      const adminId = req.user?.id;
      
      const attachment = await adminService.createAttachment({
        referenceType: "PARTNER",
        referenceId: req.user.id,
        fileType,
        fileUrl,
        uploadedBy: uploadedBy || "PARTNER",
        adminId
      });
      res.status(201).json({ success: true, data: attachment });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  /* ============================================
      PARTNER DASHBOARD ENDPOINTS
  ============================================ */

  async getDashboard(req: AuthedRequest, res: Response) {
    try {
      const dashboard = await partnerService.getPartnerDashboard(req.user.id);
      res.json({ success: true, data: dashboard });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getVehicleInfo(req: AuthedRequest, res: Response) {
    try {
      const vehicleInfo = await partnerService.getPartnerVehicleInfo(req.user.id);
      res.json({ success: true, data: vehicleInfo });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getPartnerRideDetail(req: AuthedRequest, res: Response) {
    try {
      const ride = await partnerService.getPartnerRideById(req.user.id, req.params.id);
      res.json({ success: true, data: ride });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message });
    }
  },

  async getPartnerEarningsSummary(req: AuthedRequest, res: Response) {
    try {
      const earnings = await partnerService.getPartnerEarnings(req.user.id);
      res.json({ success: true, data: earnings });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
