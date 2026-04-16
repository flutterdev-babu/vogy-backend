import { Response } from "express";
import { AuthedRequest } from "../../middleware/auth.middleware";
import * as partnerAuthService from "../../services/auth/partner.auth.service";
import * as partnerService from "../../services/partner/partner.service";
import * as adminService from "../../services/admin/admin.service";
import * as rideService from "../../services/ride/ride.service";
import { prisma } from "../../config/prisma";
import { createAuditLog, getRequestContext } from "../../services/audit/auditLog.service";

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
      const { phone, password, otp } = req.body;
      if (!phone || (!password && !otp)) {
        return res.status(400).json({ success: false, message: "Phone and either password or otp are required" });
      }
      const result = await partnerAuthService.loginPartner(phone, password, otp);
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
      const { vendorId, status, verificationStatus, search, includeDeleted, cityCodeId } = req.query;
      const partners = await partnerService.getAllPartners({
        vendorId: vendorId as string,
        status: status ? (status as string).toUpperCase() as any : undefined,
        verificationStatus: verificationStatus ? (verificationStatus as string).toUpperCase() as any : undefined,
        search: search as string,
        includeDeleted: includeDeleted === "true",
        cityCodeId: cityCodeId as string,
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
      const oldPartner = await prisma.partner.findUnique({ where: { id: req.params.id }, select: { status: true, name: true } });
      const partner = await partnerService.updatePartnerStatus(req.params.id, status, adminId);
      createAuditLog({ userId: adminId, userName: req.user?.name, userRole: req.user?.role, action: "STATUS_CHANGE", module: "PARTNER", entityId: req.params.id, description: `Partner status changed to ${status}`, oldData: oldPartner, newData: { status }, ...getRequestContext(req) });
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
      const oldPartner = await prisma.partner.findUnique({ where: { id: req.params.id }, select: { verificationStatus: true, name: true } });
      const partner = await partnerService.updatePartnerVerification(req.params.id, status, adminId);
      createAuditLog({ userId: adminId, userName: req.user?.name, userRole: req.user?.role, action: "STATUS_CHANGE", module: "PARTNER", entityId: req.params.id, description: `Partner verification changed to ${status}`, oldData: oldPartner, newData: { verificationStatus: status }, ...getRequestContext(req) });
      res.json({ success: true, data: partner });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async updatePartnerByAdmin(req: AuthedRequest, res: Response) {
    try {
      const oldPartner = await prisma.partner.findUnique({ where: { id: req.params.id }, select: { name: true, phone: true, email: true, status: true, verificationStatus: true } });
      const partner = await partnerService.updatePartnerByAdmin(req.params.id, req.body);
      createAuditLog({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "UPDATE", module: "PARTNER", entityId: req.params.id, description: `Updated partner details`, oldData: oldPartner, newData: req.body, ...getRequestContext(req) });
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
      createAuditLog({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "ASSIGNMENT", module: "PARTNER", entityId: req.params.id, description: `Assigned partner to vehicle`, newData: { vehicleId }, ...getRequestContext(req) });
      res.json({ success: true, data: partner });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async unassignPartnerFromVehicle(req: AuthedRequest, res: Response) {
    try {
      const partner = await partnerService.unassignPartnerFromVehicle(req.params.id);
      createAuditLog({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "ASSIGNMENT", module: "PARTNER", entityId: req.params.id, description: `Unassigned partner from vehicle`, ...getRequestContext(req) });
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
      createAuditLog({ userId: adminId, userName: req.user?.name, userRole: req.user?.role, action: "DELETE", module: "PARTNER", entityId: req.params.id, description: `Deleted a partner`, ...getRequestContext(req) });
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

  async getPartnerDocuments(req: AuthedRequest, res: Response) {
    try {
      const partner = await prisma.partner.findUnique({
        where: { id: req.user.id },
        select: {
          panNumber: true,
          panCardPhoto: true,
          aadhaarNumber: true,
          aadhaarFrontPhoto: true,
          aadhaarBackPhoto: true,
          licenseNumber: true,
          licenseImage: true,
          licenseExpiryDate: true,
          cancelledChequePhoto: true,
          profileImage: true,
        }
      });

      if (!partner) {
        return res.status(404).json({ success: false, message: "Partner not found" });
      }

      // Build documents list from partner's KYC fields
      const documents = [
        {
          id: 'pan_card',
          name: 'PAN Card',
          status: partner.panNumber && partner.panCardPhoto ? 'APPROVED' : partner.panNumber || partner.panCardPhoto ? 'PENDING' : 'MISSING',
        },
        {
          id: 'aadhaar_card',
          name: 'Aadhaar Card',
          status: partner.aadhaarNumber && (partner.aadhaarFrontPhoto || partner.aadhaarBackPhoto) ? 'APPROVED' : partner.aadhaarNumber ? 'PENDING' : 'MISSING',
        },
        {
          id: 'driving_license',
          name: 'Driving License',
          status: partner.licenseNumber && partner.licenseImage ? 'APPROVED' : partner.licenseNumber ? 'PENDING' : 'MISSING',
          expiryDate: partner.licenseExpiryDate?.toISOString() || undefined,
        },
        {
          id: 'cancelled_cheque',
          name: 'Cancelled Cheque / Bank Proof',
          status: partner.cancelledChequePhoto ? 'APPROVED' : 'MISSING',
        },
        {
          id: 'profile_photo',
          name: 'Profile Photo',
          status: partner.profileImage ? 'APPROVED' : 'MISSING',
        },
      ];

      res.json({ success: true, data: documents });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getAvailableRides(req: AuthedRequest, res: Response) {
    try {
      const { lat, lng, vehicleTypeId } = req.query;
      if (!lat || !lng) {
        return res.status(400).json({ success: false, message: "lat and lng are required" });
      }
      const rides = await rideService.getAvailableRides(
        Number(lat),
        Number(lng),
        vehicleTypeId as string
      );
      res.json({ success: true, data: { rides: rides } });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getNotifications(req: AuthedRequest, res: Response) {
    try {
      const { getPartnerNotifications } = await import("../../services/notification/notification.service");
      const notifications = await getPartnerNotifications(req.user.id);
      res.json({ success: true, data: notifications });
  async verifyDocument(req: AuthedRequest, res: Response) {
    try {
      const { documentId, status } = req.body;
      const adminId = req.user?.id;
      if (!documentId || !status) {
        return res.status(400).json({ success: false, message: "documentId and status are required" });
      }
      const partner = await partnerService.verifyPartnerDocument(req.params.id, documentId, status, adminId);
      res.json({ success: true, data: partner });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async sendNotification(req: AuthedRequest, res: Response) {
    try {
      const { message } = req.body;
      const adminId = req.user?.id;
      if (!message) {
        return res.status(400).json({ success: false, message: "message is required" });
      }
      const result = await partnerService.sendDirectNotification(req.params.id, message, adminId);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async getEarningsStats(req: AuthedRequest, res: Response) {
    try {
      const earnings = await partnerService.getPartnerEarnings(req.params.id);
      res.json({ success: true, data: earnings });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async markNotificationAsRead(req: AuthedRequest, res: Response) {
    try {
      const { markNotificationAsRead } = await import("../../services/notification/notification.service");
      const notification = await markNotificationAsRead(req.params.id);
      res.json({ success: true, data: notification });
  async getNotifications(req: AuthedRequest, res: Response) {
    try {
      const notifications = await partnerService.getPartnerNotifications(req.user.id);
      res.json({ success: true, data: notifications });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async notifyPartner(req: AuthedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { title, message, type } = req.body;
      const { createPartnerNotification } = await import("../../services/notification/notification.service");
      
      const notification = await createPartnerNotification(id, {
        title: title || "New Message from Admin",
        message: message,
        type: type || "INFO"
      });
      
      res.json({ success: true, data: notification });
  async markNotificationAsRead(req: AuthedRequest, res: Response) {
    try {
      const { id } = req.params;
      await partnerService.markNotificationAsRead(id, req.user.id);
      res.json({ success: true, message: "Notification marked as read" });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
