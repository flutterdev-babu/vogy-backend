import { Router } from "express";
import authController from "../../controllers/auth/auth.controller";
import adminController from "../../controllers/admin/admin.controller";
import vendorController from "../../controllers/vendor/vendor.controller";
import partnerController from "../../controllers/partner/partner.controller";
import agentController from "../../controllers/agent/agent.controller";
import agentCouponController from "../../controllers/admin/agentCoupon.controller";
import peakHourController from "../../controllers/admin/peakHour.controller";
import corporateController from "../../controllers/corporate/corporate.controller";
import vehicleController from "../../controllers/vehicle/vehicle.controller";
import billingController from "../../controllers/billing/billing.controller";
import auditLogController from "../../controllers/audit/auditLog.controller";
import adminManagementController from "../../controllers/admin/adminManagement.controller";
import ticketController from "../../controllers/cc/ticket.controller";
import { authMiddleware, permissionMiddleware } from "../../middleware/auth.middleware";

const router = Router();

/* ===============================
        ADMIN AUTH ROUTES (Public)
================================ */

// Register admin
router.post("/auth/register", authController.registerAdmin);

// Login admin
router.post("/auth/login", authController.loginAdmin);

/* ===============================
        ADMIN MANAGEMENT ROUTES (Protected)
================================ */

// All management routes require authentication and ADMIN role
router.use(authMiddleware(["ADMIN"]));

// ============================================
// AUDIT LOG MANAGEMENT
// ============================================
router.get("/audit-logs", permissionMiddleware("audit_logs"), auditLogController.getAuditLogs);
router.get("/audit-logs/:id", permissionMiddleware("audit_logs"), auditLogController.getAuditLogById);

// ============================================
// ADMIN & PERMISSION MANAGEMENT
// ============================================
router.get("/admins", permissionMiddleware("config"), adminManagementController.getAllAdmins);
router.get("/admins/permissions", permissionMiddleware("config"), adminManagementController.getPermissions);
router.post("/admins", permissionMiddleware("config"), adminManagementController.createAdmin);
router.get("/admins/:id", permissionMiddleware("config"), adminManagementController.getAdminById);
router.put("/admins/:id", permissionMiddleware("config"), adminManagementController.updateAdmin);
router.patch("/admins/:id", permissionMiddleware("config"), adminManagementController.updateAdmin);
router.delete("/admins/:id", permissionMiddleware("config"), adminManagementController.deleteAdmin);

// ============================================
// SUPPORT TICKET MANAGEMENT (NEW)
// ============================================
router.get("/support-tickets", permissionMiddleware("support_tickets"), ticketController.getAllTickets);
router.get("/support-tickets/stats", permissionMiddleware("support_tickets"), ticketController.getTicketStats);
router.post("/support-tickets", permissionMiddleware("support_tickets"), ticketController.createTicket);
router.get("/support-tickets/:id", permissionMiddleware("support_tickets"), ticketController.getTicketById);
router.put("/support-tickets/:id", permissionMiddleware("support_tickets"), ticketController.updateTicket);
router.post("/support-tickets/:id/assign", permissionMiddleware("support_tickets"), ticketController.assignTicket);
router.post("/support-tickets/:id/messages", permissionMiddleware("support_tickets"), ticketController.addMessage);
router.post("/support-tickets/:id/resolve", permissionMiddleware("support_tickets"), ticketController.resolveTicket);

// ============================================
// VEHICLE TYPE MANAGEMENT
// ============================================
router.post("/vehicle-types", permissionMiddleware("vehicles"), adminController.createVehicleType);
router.get("/vehicle-types", permissionMiddleware("vehicles"), adminController.getAllVehicleTypes);
router.get("/vehicle-types/:id", permissionMiddleware("vehicles"), adminController.getVehicleTypeById);
router.put("/vehicle-types/:id", permissionMiddleware("vehicles"), adminController.updateVehicleType);
router.patch("/vehicle-types/:id", permissionMiddleware("vehicles"), adminController.updateVehicleType);
router.delete("/vehicle-types/:id", permissionMiddleware("vehicles"), adminController.deleteVehicleType);
router.patch("/vehicle-type/:id/pricing", permissionMiddleware("vehicles"), adminController.updateVehiclePricing);
router.patch("/vehicle-type/pricing/all", permissionMiddleware("vehicles"), adminController.updateAllVehiclesPricing);
// ============================================
// PRICING CONFIGURATION
// ============================================
router.get("/pricing-config", permissionMiddleware("config"), adminController.getPricingConfig);
router.put("/pricing-config", permissionMiddleware("config"), adminController.updatePricingConfig);
router.patch("/pricing-config", permissionMiddleware("config"), adminController.updatePricingConfig);

// ============================================
// VEHICLE PRICING GROUPS (NEW)
// ============================================
router.post("/vehicle-pricing-groups", permissionMiddleware("config"), adminController.createPricingGroup);
router.get("/vehicle-pricing-groups", permissionMiddleware("config"), adminController.getPricingGroups);
router.put("/vehicle-pricing-groups/:id", permissionMiddleware("config"), adminController.updatePricingGroup);
router.delete("/vehicle-pricing-groups/:id", permissionMiddleware("config"), adminController.deletePricingGroup);

// ============================================
// PEAK HOUR CHARGE MANAGEMENT (NEW)
// ============================================
router.post("/peak-hour-charges", peakHourController.createPeakHourCharge);
router.get("/peak-hour-charges", peakHourController.getAllPeakHourCharges);
router.get("/peak-hour-charges/:id", peakHourController.getPeakHourChargeById);
router.put("/peak-hour-charges/:id", peakHourController.updatePeakHourCharge);
router.patch("/peak-hour-charges/:id", peakHourController.updatePeakHourCharge);
router.delete("/peak-hour-charges/:id", peakHourController.deletePeakHourCharge);

// ============================================
// RIDE MANAGEMENT (Legacy)
// ============================================
router.post("/rides", permissionMiddleware("rides"), adminController.createManualRide);
router.get("/rides", permissionMiddleware("rides"), adminController.getAllRides);
router.get("/rides/scheduled", permissionMiddleware("rides"), adminController.getScheduledRides);
router.get("/rides/live-unassigned", permissionMiddleware("rides"), adminController.getLiveUnassignedRides);
router.get("/rides/:id", permissionMiddleware("rides"), adminController.getRideById);
router.patch("/rides/:id/status", permissionMiddleware("rides"), adminController.updateRideStatus);
router.patch("/rides/:id/update", permissionMiddleware("rides"), adminController.updateRideDetails);
router.get("/rides/:id/otp", permissionMiddleware("rides"), adminController.getRideOtp);
router.post("/rides/:id/assign-rider", permissionMiddleware("rides"), adminController.assignRiderToRide);
router.patch("/rides/:id/payment", permissionMiddleware("rides"), adminController.updateRidePaymentStatus);

// ============================================
// LEGACY RIDER MANAGEMENT
// ============================================
router.get("/riders", adminController.getAllRiders);
router.get("/riders/:id", adminController.getRiderById);

// ============================================
// USER MANAGEMENT
// ============================================
router.post("/users", permissionMiddleware("users"), adminController.createUser);
router.get("/users", permissionMiddleware("users"), adminController.getAllUsers);
router.get("/users/:id", permissionMiddleware("users"), adminController.getUserById);
router.put("/users/:id", permissionMiddleware("users"), adminController.updateUser);
router.patch("/users/:id", permissionMiddleware("users"), adminController.updateUser);
router.post("/users/:id/regenerate-otp", permissionMiddleware("users"), adminController.updateUserUniqueOtp);
router.put("/users/:id/unique-otp", permissionMiddleware("users"), adminController.updateUserUniqueOtp);
router.patch("/users/:id/unique-otp", permissionMiddleware("users"), adminController.updateUserUniqueOtp);

// ============================================
// VENDOR MANAGEMENT
// ============================================
router.post("/vendors", permissionMiddleware("vendors"), adminController.createVendor);
router.get("/vendors", permissionMiddleware("vendors"), adminController.getAllVendors);
router.get("/vendors/:id", permissionMiddleware("vendors"), adminController.getVendorById);
router.put("/vendors/:id", permissionMiddleware("vendors"), adminController.updateVendor);
router.patch("/vendors/:id", permissionMiddleware("vendors"), adminController.updateVendor);
router.patch("/vendors/:id/status", permissionMiddleware("vendors"), vendorController.updateVendorStatus);
router.patch("/vendors/:id/verify", permissionMiddleware("vendors"), vendorController.updateVendorVerification);
router.delete("/vendors/:id", permissionMiddleware("vendors"), vendorController.deleteVendor);

// ============================================
// PARTNER MANAGEMENT
// ============================================
router.post("/partners", permissionMiddleware("partners"), adminController.createPartner);
router.get("/partners", permissionMiddleware("partners"), partnerController.getAllPartners);
router.get("/partners/active-locations", permissionMiddleware("partners"), adminController.getActivePartnerLocations);
router.get("/partners/available", permissionMiddleware("partners"), partnerController.getAvailablePartners);
router.get("/partners/:id", permissionMiddleware("partners"), partnerController.getPartnerById);
router.put("/partners/:id", permissionMiddleware("partners"), partnerController.updatePartnerByAdmin);
router.patch("/partners/:id", permissionMiddleware("partners"), partnerController.updatePartnerByAdmin);
router.put("/partners/:id/status", permissionMiddleware("partners"), partnerController.updatePartnerStatus);
router.patch("/partners/:id/status", permissionMiddleware("partners"), partnerController.updatePartnerStatus);
router.patch("/partners/:id/verify", permissionMiddleware("partners"), partnerController.updatePartnerVerification);
router.post("/partners/:id/assign-vehicle", permissionMiddleware("partners"), partnerController.assignPartnerToVehicle);
router.delete("/partners/:id/unassign-vehicle", permissionMiddleware("partners"), partnerController.unassignPartnerFromVehicle);
router.get("/partners/:id/rides", permissionMiddleware("partners"), partnerController.getPartnerRides);
router.get("/partners/:id/analytics", permissionMiddleware("partners"), partnerController.getPartnerAnalytics);
router.post("/partners/:id/notify", permissionMiddleware("partners"), partnerController.notifyPartner);
router.get("/partners/:id/earnings-stats", permissionMiddleware("partners"), partnerController.getEarningsStats);
router.patch("/partners/:id/verify-document", permissionMiddleware("partners"), partnerController.verifyDocument);
router.post("/partners/:id/notify", permissionMiddleware("partners"), partnerController.sendNotification);
router.delete("/partners/:id", permissionMiddleware("partners"), partnerController.deletePartner);

// ============================================
// ATTACHMENT MANAGEMENT
// ============================================
router.post("/attachments", permissionMiddleware("attachments"), adminController.createAttachment);
router.get("/attachments", permissionMiddleware("attachments"), adminController.getAllAttachments);
router.get("/attachments/:id", permissionMiddleware("attachments"), adminController.getAttachmentById);
router.put("/attachments/:id/status", permissionMiddleware("attachments"), adminController.toggleAttachmentStatus);
router.post("/attachments/:id/verify", permissionMiddleware("attachments"), adminController.verifyAttachment);
router.delete("/attachments/:id", permissionMiddleware("attachments"), adminController.deleteAttachment);

// ============================================
// CITY CODE MANAGEMENT
// ============================================
router.get("/city-codes", permissionMiddleware("config"), adminController.getAllCityCodes);
router.post("/city-codes", permissionMiddleware("config"), adminController.createCityCode);
router.put("/city-codes/:id", permissionMiddleware("config"), adminController.updateCityCode);
router.patch("/city-codes/:id", permissionMiddleware("config"), adminController.updateCityCode);
router.delete("/city-codes/:id", permissionMiddleware("config"), adminController.deleteCityCode);

// ============================================
// VEHICLE MANAGEMENT
// ============================================
router.post("/vehicles", permissionMiddleware("vehicles"), vehicleController.createVehicle);
router.get("/vehicles", permissionMiddleware("vehicles"), vehicleController.getAllVehicles);
router.get("/vehicles/available", permissionMiddleware("vehicles"), vehicleController.getAvailableVehicles);
router.get("/vehicles/:id", permissionMiddleware("vehicles"), vehicleController.getVehicleById);
router.put("/vehicles/:id", permissionMiddleware("vehicles"), vehicleController.updateVehicle);
router.patch("/vehicles/:id", permissionMiddleware("vehicles"), vehicleController.updateVehicle);
router.patch("/vehicles/:id/status", permissionMiddleware("vehicles"), vehicleController.updateVehicleStatus);
router.patch("/vehicles/:id/verify", permissionMiddleware("vehicles"), vehicleController.updateVehicleVerification);
router.post("/vehicles/:id/assign-vendor", permissionMiddleware("vehicles"), vehicleController.assignVehicleToVendor);
router.get("/vehicles/:id/rides", permissionMiddleware("vehicles"), vehicleController.getVehicleRides);
router.delete("/vehicles/:id", permissionMiddleware("vehicles"), vehicleController.deleteVehicle);

// ============================================
// AGENT MANAGEMENT
// ============================================
router.post("/agents", permissionMiddleware("agents"), adminController.createAgent);
router.get("/agents", permissionMiddleware("agents"), agentController.getAllAgents);
router.get("/agents/:id", permissionMiddleware("agents"), agentController.getAgentById);
router.put("/agents/:id", permissionMiddleware("agents"), agentController.updateAgentByAdmin);
router.patch("/agents/:id", permissionMiddleware("agents"), agentController.updateAgentByAdmin);
router.delete("/agents/:id", permissionMiddleware("agents"), agentController.deleteAgent);

// ============================================
// AGENT COUPON MANAGEMENT
// ============================================
router.post("/agent-coupons", permissionMiddleware("promotions"), agentCouponController.createCoupon);
router.get("/agent-coupons", permissionMiddleware("promotions"), agentCouponController.getAllCoupons);
router.get("/agent-coupons/:id", permissionMiddleware("promotions"), agentCouponController.getCouponById);
router.put("/agent-coupons/:id", permissionMiddleware("promotions"), agentCouponController.updateCoupon);
router.patch("/agent-coupons/:id/status", permissionMiddleware("promotions"), agentCouponController.toggleCouponStatus);
router.delete("/agent-coupons/:id", permissionMiddleware("promotions"), agentCouponController.deleteCoupon);

// ============================================
// CORPORATE MANAGEMENT
// ============================================
router.get("/corporates", permissionMiddleware("corporates"), adminController.getAllCorporates);
router.get("/corporates/:id", permissionMiddleware("corporates"), adminController.getCorporateById);
router.put("/corporates/:id", permissionMiddleware("corporates"), adminController.updateCorporate);
router.patch("/corporates/:id", permissionMiddleware("corporates"), adminController.updateCorporate);
router.delete("/corporates/:id", permissionMiddleware("corporates"), corporateController.deleteCorporate);

// ============================================
// BILLING MANAGEMENT
// ============================================
router.post("/billing", permissionMiddleware("billing"), billingController.createBilling);
router.get("/billing", permissionMiddleware("billing"), billingController.getAllBillings);
router.get("/billing/outstanding", permissionMiddleware("billing"), billingController.getOutstandingPayments);
router.get("/billing/:id", permissionMiddleware("billing"), billingController.getBillingById);
router.get("/billing/summary/:corporateId", permissionMiddleware("billing"), billingController.getBillingSummary);

// ============================================
// PAYMENT MANAGEMENT
// ============================================
router.post("/payments", permissionMiddleware("billing"), billingController.recordPayment);
router.get("/payments", permissionMiddleware("billing"), billingController.getPaymentHistory);

// ============================================
// DASHBOARD & ANALYTICS
// ============================================
router.get("/dashboard", adminController.getDashboard);
router.get("/analytics/revenue", adminController.getRevenueAnalytics);
router.get("/analytics/rides", adminController.getRideAnalytics);
router.get("/analytics/entities", adminController.getEntityStatusOverview);
router.get("/recent-activity", adminController.getRecentActivity);
router.get("/analytics/cancellations", adminController.getCancellationAnalytics);
router.get("/audit-timeline", adminController.getAuditTimeline);

// ============================================
// SETTLEMENT MANAGEMENT
// ============================================
router.get("/settlements/stats", permissionMiddleware("billing"), async (req, res) => {
  try {
    const { getSettlementStats } = require("../../services/admin/settlement.service");
    const stats = await getSettlementStats();
    res.json({ success: true, data: stats });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/settlements/partners", permissionMiddleware("billing"), async (req, res) => {
  try {
    const { getPartnerSettlements } = require("../../services/admin/settlement.service");
    const data = await getPartnerSettlements();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/settlements/vendors", permissionMiddleware("billing"), async (req, res) => {
  try {
    const { getVendorSettlements } = require("../../services/admin/settlement.service");
    const data = await getVendorSettlements();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// FRAUD DETECTION
// ============================================
router.get("/fraud-alerts", permissionMiddleware("rides"), async (req, res) => {
  try {
    const { getFraudAlerts } = require("../../services/admin/fraud.service");
    const data = await getFraudAlerts();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// BROADCAST NOTIFICATIONS
// ============================================
router.get("/broadcast/history", permissionMiddleware("config"), async (req, res) => {
  try {
    const { getBroadcastHistory } = require("../../services/admin/broadcast.service");
    const data = await getBroadcastHistory();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/broadcast/send", permissionMiddleware("config"), async (req: any, res) => {
  try {
    const { sendBroadcastNotification } = require("../../services/admin/broadcast.service");
    const { title, body, imageUrl, targetAudience } = req.body;
    if (!title || !body || !targetAudience) {
      return res.status(400).json({ success: false, message: "title, body, and targetAudience are required" });
    }
    const result = await sendBroadcastNotification({
      title,
      body,
      imageUrl,
      targetAudience,
      sentBy: req.user?.id,
      sentByName: req.user?.name,
    });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
