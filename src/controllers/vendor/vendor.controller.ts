import { Response } from "express";
import { AuthedRequest } from "../../middleware/auth.middleware";
import * as vendorAuthService from "../../services/auth/vendor.auth.service";
import * as vendorService from "../../services/vendor/vendor.service";
import * as partnerService from "../../services/partner/partner.service";
import * as adminService from "../../services/admin/admin.service";
import { prisma } from "../../config/prisma";
import { createAuditLog, getRequestContext } from "../../services/audit/auditLog.service";

export default {
  /* ============================================
      AUTH ENDPOINTS
  ============================================ */

  async register(req: AuthedRequest, res: Response) {
    try {
      const vendor = await vendorAuthService.registerVendor(req.body);
      res.status(201).json({ success: true, data: vendor });
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
      const result = await vendorAuthService.loginVendor(phone, password);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(401).json({ success: false, message: err.message });
    }
  },

  async getProfile(req: AuthedRequest, res: Response) {
    try {
      const vendor = await vendorAuthService.getVendorProfile(req.user.id);
      res.json({ success: true, data: vendor });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message });
    }
  },

  async updateProfile(req: AuthedRequest, res: Response) {
    try {
      const vendor = await vendorAuthService.updateVendorProfile(req.user.id, req.body);
      res.json({ success: true, data: vendor });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  /* ============================================
      VENDOR MANAGEMENT (Admin endpoints)
  ============================================ */

  async getAllVendors(req: AuthedRequest, res: Response) {
    try {
      const { vendorId, type, status, verificationStatus, agentId, search, includeDeleted, cityCodeId } = req.query;
      const vendors = await vendorService.getAllVendors({
        vendorId: vendorId as string,
        type: type ? (type as string).toUpperCase() as any : undefined,
        status: status ? (status as string).toUpperCase() as any : undefined,
        verificationStatus: verificationStatus ? (verificationStatus as string).toUpperCase() as any : undefined,
        agentId: agentId as string,
        search: search as string,
        includeDeleted: includeDeleted === "true",
        cityCodeId: cityCodeId as string,
      });
      res.json({ success: true, data: vendors });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getVendorById(req: AuthedRequest, res: Response) {
    try {
      const vendor = await vendorService.getVendorById(req.params.id);
      res.json({ success: true, data: vendor });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message });
    }
  },

  async updateVendorStatus(req: AuthedRequest, res: Response) {
    try {
      const { status } = req.body;
      const adminId = req.user?.id;
      if (!status) {
        return res.status(400).json({ success: false, message: "Status is required" });
      }
      const oldVendor = await prisma.vendor.findUnique({ where: { id: req.params.id }, select: { status: true, companyName: true } });
      const vendor = await vendorService.updateVendorStatus(req.params.id, status, adminId);
      createAuditLog({ userId: adminId, userName: req.user?.name, userRole: req.user?.role, action: "STATUS_CHANGE", module: "VENDOR", entityId: req.params.id, description: `Vendor status changed to ${status}`, oldData: oldVendor, newData: { status }, ...getRequestContext(req) });
      res.json({ success: true, data: vendor });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async updateVendorVerification(req: AuthedRequest, res: Response) {
    try {
      const { status } = req.body;
      const adminId = req.user?.id;
      if (!status) {
        return res.status(400).json({ success: false, message: "Verification status is required" });
      }
      const oldVendor = await prisma.vendor.findUnique({ where: { id: req.params.id }, select: { verificationStatus: true, companyName: true } });
      const vendor = await vendorService.updateVendorVerification(req.params.id, status, adminId);
      createAuditLog({ userId: adminId, userName: req.user?.name, userRole: req.user?.role, action: "STATUS_CHANGE", module: "VENDOR", entityId: req.params.id, description: `Vendor verification changed to ${status}`, oldData: oldVendor, newData: { verificationStatus: status }, ...getRequestContext(req) });
      res.json({ success: true, data: vendor });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async updateVendorByAdmin(req: AuthedRequest, res: Response) {
    try {
      const oldVendor = await prisma.vendor.findUnique({ where: { id: req.params.id }, select: { companyName: true, phone: true, email: true, status: true, verificationStatus: true } });
      const vendor = await vendorService.updateVendorByAdmin(req.params.id, req.body);
      createAuditLog({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "UPDATE", module: "VENDOR", entityId: req.params.id, description: `Updated vendor details`, oldData: oldVendor, newData: req.body, ...getRequestContext(req) });
      res.json({ success: true, data: vendor });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async getVendorVehicles(req: AuthedRequest, res: Response) {
    try {
      const vendorId = req.params.id || req.user.id;
      const vehicles = await vendorService.getVendorVehicles(vendorId);
      res.json({ success: true, data: vehicles });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getVendorRides(req: AuthedRequest, res: Response) {
    try {
      const vendorId = req.params.id || req.user.id;
      const { status, startDate, endDate } = req.query;
      const rides = await vendorService.getVendorRides(vendorId, {
        status: status as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });
      res.json({ success: true, data: rides });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getVendorAnalytics(req: AuthedRequest, res: Response) {
    try {
      const vendorId = req.params.id || req.user.id;
      const analytics = await vendorService.getVendorAnalytics(vendorId);
      res.json({ success: true, data: analytics });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async deleteVendor(req: AuthedRequest, res: Response) {
    try {
      const adminId = req.user?.id;
      const result = await vendorService.deleteVendor(req.params.id, adminId);
      createAuditLog({ userId: adminId, userName: req.user?.name, userRole: req.user?.role, action: "DELETE", module: "VENDOR", entityId: req.params.id, description: `Deleted a vendor`, ...getRequestContext(req) });
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async getVendorPartners(req: AuthedRequest, res: Response) {
    try {
      const vendorId = req.params.id || req.user.id;
      const { status, search } = req.query;
      const partners = await partnerService.getAllPartners({
        vendorId,
        status: status as any,
        search: search as string,
      });
      res.json({ success: true, data: partners });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async createAttachment(req: AuthedRequest, res: Response) {
    try {
      const { fileType, fileUrl, uploadedBy } = req.body;
      const adminId = req.user?.id;

      const attachment = await adminService.createAttachment({
        referenceType: "VENDOR",
        referenceId: req.user.id,
        fileType,
        fileUrl,
        uploadedBy: uploadedBy || "VENDOR",
        adminId
      });
      res.status(201).json({ success: true, data: attachment });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  /* ============================================
      VENDOR DASHBOARD ENDPOINTS
  ============================================ */

  async getDashboard(req: AuthedRequest, res: Response) {
    try {
      const dashboard = await vendorService.getVendorDashboard(req.user.id);
      res.json({ success: true, data: dashboard });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getVendorAttachmentsList(req: AuthedRequest, res: Response) {
    try {
      const attachments = await vendorService.getVendorAttachments(req.user.id);
      res.json({ success: true, data: attachments });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getVendorRideDetail(req: AuthedRequest, res: Response) {
    try {
      const ride = await vendorService.getVendorRideById(req.user.id, req.params.id);
      res.json({ success: true, data: ride });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message });
    }
  },

  async getVendorEarningsSummary(req: AuthedRequest, res: Response) {
    try {
      const { period } = req.query;
      const earnings = await vendorService.getVendorEarnings(req.user.id, period as string);
      res.json({ success: true, data: earnings });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async uploadFile(req: AuthedRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      // Generate the URL for the uploaded file
      // In a real production app, this would be an absolute URL or stored in S3
      const fileUrl = `/uploads/${req.file.filename}`;

      res.status(200).json({
        success: true,
        data: {
          fileUrl,
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
