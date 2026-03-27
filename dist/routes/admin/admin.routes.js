"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = __importDefault(require("../../controllers/auth/auth.controller"));
const admin_controller_1 = __importDefault(require("../../controllers/admin/admin.controller"));
const vendor_controller_1 = __importDefault(require("../../controllers/vendor/vendor.controller"));
const partner_controller_1 = __importDefault(require("../../controllers/partner/partner.controller"));
const agent_controller_1 = __importDefault(require("../../controllers/agent/agent.controller"));
const agentCoupon_controller_1 = __importDefault(require("../../controllers/admin/agentCoupon.controller"));
const peakHour_controller_1 = __importDefault(require("../../controllers/admin/peakHour.controller"));
const corporate_controller_1 = __importDefault(require("../../controllers/corporate/corporate.controller"));
const vehicle_controller_1 = __importDefault(require("../../controllers/vehicle/vehicle.controller"));
const billing_controller_1 = __importDefault(require("../../controllers/billing/billing.controller"));
const auditLog_controller_1 = __importDefault(require("../../controllers/audit/auditLog.controller"));
const adminManagement_controller_1 = __importDefault(require("../../controllers/admin/adminManagement.controller"));
const ticket_controller_1 = __importDefault(require("../../controllers/cc/ticket.controller"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
/* ===============================
        ADMIN AUTH ROUTES (Public)
================================ */
// Register admin
router.post("/auth/register", auth_controller_1.default.registerAdmin);
// Login admin
router.post("/auth/login", auth_controller_1.default.loginAdmin);
/* ===============================
        ADMIN MANAGEMENT ROUTES (Protected)
================================ */
// All management routes require authentication and ADMIN role
router.use((0, auth_middleware_1.authMiddleware)(["ADMIN"]));
// ============================================
// AUDIT LOG MANAGEMENT
// ============================================
router.get("/audit-logs", (0, auth_middleware_1.permissionMiddleware)("audit_logs"), auditLog_controller_1.default.getAuditLogs);
router.get("/audit-logs/:id", (0, auth_middleware_1.permissionMiddleware)("audit_logs"), auditLog_controller_1.default.getAuditLogById);
// ============================================
// ADMIN & PERMISSION MANAGEMENT
// ============================================
router.get("/admins", (0, auth_middleware_1.permissionMiddleware)("config"), adminManagement_controller_1.default.getAllAdmins);
router.get("/admins/permissions", (0, auth_middleware_1.permissionMiddleware)("config"), adminManagement_controller_1.default.getPermissions);
router.post("/admins", (0, auth_middleware_1.permissionMiddleware)("config"), adminManagement_controller_1.default.createAdmin);
router.get("/admins/:id", (0, auth_middleware_1.permissionMiddleware)("config"), adminManagement_controller_1.default.getAdminById);
router.put("/admins/:id", (0, auth_middleware_1.permissionMiddleware)("config"), adminManagement_controller_1.default.updateAdmin);
router.patch("/admins/:id", (0, auth_middleware_1.permissionMiddleware)("config"), adminManagement_controller_1.default.updateAdmin);
router.delete("/admins/:id", (0, auth_middleware_1.permissionMiddleware)("config"), adminManagement_controller_1.default.deleteAdmin);
// ============================================
// SUPPORT TICKET MANAGEMENT (NEW)
// ============================================
router.get("/support-tickets", (0, auth_middleware_1.permissionMiddleware)("support_tickets"), ticket_controller_1.default.getAllTickets);
router.get("/support-tickets/stats", (0, auth_middleware_1.permissionMiddleware)("support_tickets"), ticket_controller_1.default.getTicketStats);
router.post("/support-tickets", (0, auth_middleware_1.permissionMiddleware)("support_tickets"), ticket_controller_1.default.createTicket);
router.get("/support-tickets/:id", (0, auth_middleware_1.permissionMiddleware)("support_tickets"), ticket_controller_1.default.getTicketById);
router.put("/support-tickets/:id", (0, auth_middleware_1.permissionMiddleware)("support_tickets"), ticket_controller_1.default.updateTicket);
router.post("/support-tickets/:id/assign", (0, auth_middleware_1.permissionMiddleware)("support_tickets"), ticket_controller_1.default.assignTicket);
router.post("/support-tickets/:id/messages", (0, auth_middleware_1.permissionMiddleware)("support_tickets"), ticket_controller_1.default.addMessage);
router.post("/support-tickets/:id/resolve", (0, auth_middleware_1.permissionMiddleware)("support_tickets"), ticket_controller_1.default.resolveTicket);
// ============================================
// VEHICLE TYPE MANAGEMENT
// ============================================
router.post("/vehicle-types", (0, auth_middleware_1.permissionMiddleware)("vehicles"), admin_controller_1.default.createVehicleType);
router.get("/vehicle-types", (0, auth_middleware_1.permissionMiddleware)("vehicles"), admin_controller_1.default.getAllVehicleTypes);
router.get("/vehicle-types/:id", (0, auth_middleware_1.permissionMiddleware)("vehicles"), admin_controller_1.default.getVehicleTypeById);
router.put("/vehicle-types/:id", (0, auth_middleware_1.permissionMiddleware)("vehicles"), admin_controller_1.default.updateVehicleType);
router.patch("/vehicle-types/:id", (0, auth_middleware_1.permissionMiddleware)("vehicles"), admin_controller_1.default.updateVehicleType);
router.delete("/vehicle-types/:id", (0, auth_middleware_1.permissionMiddleware)("vehicles"), admin_controller_1.default.deleteVehicleType);
// ============================================
// PRICING CONFIGURATION
// ============================================
router.get("/pricing-config", (0, auth_middleware_1.permissionMiddleware)("config"), admin_controller_1.default.getPricingConfig);
router.put("/pricing-config", (0, auth_middleware_1.permissionMiddleware)("config"), admin_controller_1.default.updatePricingConfig);
router.patch("/pricing-config", (0, auth_middleware_1.permissionMiddleware)("config"), admin_controller_1.default.updatePricingConfig);
// ============================================
// VEHICLE PRICING GROUPS (NEW)
// ============================================
router.post("/vehicle-pricing-groups", (0, auth_middleware_1.permissionMiddleware)("config"), admin_controller_1.default.createPricingGroup);
router.get("/vehicle-pricing-groups", (0, auth_middleware_1.permissionMiddleware)("config"), admin_controller_1.default.getPricingGroups);
router.put("/vehicle-pricing-groups/:id", (0, auth_middleware_1.permissionMiddleware)("config"), admin_controller_1.default.updatePricingGroup);
router.delete("/vehicle-pricing-groups/:id", (0, auth_middleware_1.permissionMiddleware)("config"), admin_controller_1.default.deletePricingGroup);
// ============================================
// PEAK HOUR CHARGE MANAGEMENT (NEW)
// ============================================
router.post("/peak-hour-charges", peakHour_controller_1.default.createPeakHourCharge);
router.get("/peak-hour-charges", peakHour_controller_1.default.getAllPeakHourCharges);
router.get("/peak-hour-charges/:id", peakHour_controller_1.default.getPeakHourChargeById);
router.put("/peak-hour-charges/:id", peakHour_controller_1.default.updatePeakHourCharge);
router.patch("/peak-hour-charges/:id", peakHour_controller_1.default.updatePeakHourCharge);
router.delete("/peak-hour-charges/:id", peakHour_controller_1.default.deletePeakHourCharge);
// ============================================
// RIDE MANAGEMENT (Legacy)
// ============================================
router.post("/rides", (0, auth_middleware_1.permissionMiddleware)("rides"), admin_controller_1.default.createManualRide);
router.get("/rides", (0, auth_middleware_1.permissionMiddleware)("rides"), admin_controller_1.default.getAllRides);
router.get("/rides/scheduled", (0, auth_middleware_1.permissionMiddleware)("rides"), admin_controller_1.default.getScheduledRides);
router.get("/rides/:id", (0, auth_middleware_1.permissionMiddleware)("rides"), admin_controller_1.default.getRideById);
router.patch("/rides/:id/status", (0, auth_middleware_1.permissionMiddleware)("rides"), admin_controller_1.default.updateRideStatus);
router.get("/rides/:id/otp", (0, auth_middleware_1.permissionMiddleware)("rides"), admin_controller_1.default.getRideOtp);
router.post("/rides/:id/assign-rider", (0, auth_middleware_1.permissionMiddleware)("rides"), admin_controller_1.default.assignRiderToRide);
router.patch("/rides/:id/payment", (0, auth_middleware_1.permissionMiddleware)("rides"), admin_controller_1.default.updateRidePaymentStatus);
// ============================================
// LEGACY RIDER MANAGEMENT
// ============================================
router.get("/riders", admin_controller_1.default.getAllRiders);
router.get("/riders/:id", admin_controller_1.default.getRiderById);
// ============================================
// USER MANAGEMENT
// ============================================
router.post("/users", (0, auth_middleware_1.permissionMiddleware)("users"), admin_controller_1.default.createUser);
router.get("/users", (0, auth_middleware_1.permissionMiddleware)("users"), admin_controller_1.default.getAllUsers);
router.get("/users/:id", (0, auth_middleware_1.permissionMiddleware)("users"), admin_controller_1.default.getUserById);
router.put("/users/:id", (0, auth_middleware_1.permissionMiddleware)("users"), admin_controller_1.default.updateUser);
router.patch("/users/:id", (0, auth_middleware_1.permissionMiddleware)("users"), admin_controller_1.default.updateUser);
router.post("/users/:id/regenerate-otp", (0, auth_middleware_1.permissionMiddleware)("users"), admin_controller_1.default.updateUserUniqueOtp);
router.put("/users/:id/unique-otp", (0, auth_middleware_1.permissionMiddleware)("users"), admin_controller_1.default.updateUserUniqueOtp);
router.patch("/users/:id/unique-otp", (0, auth_middleware_1.permissionMiddleware)("users"), admin_controller_1.default.updateUserUniqueOtp);
// ============================================
// VENDOR MANAGEMENT
// ============================================
router.post("/vendors", (0, auth_middleware_1.permissionMiddleware)("vendors"), admin_controller_1.default.createVendor);
router.get("/vendors", (0, auth_middleware_1.permissionMiddleware)("vendors"), admin_controller_1.default.getAllVendors);
router.get("/vendors/:id", (0, auth_middleware_1.permissionMiddleware)("vendors"), admin_controller_1.default.getVendorById);
router.put("/vendors/:id", (0, auth_middleware_1.permissionMiddleware)("vendors"), admin_controller_1.default.updateVendor);
router.patch("/vendors/:id", (0, auth_middleware_1.permissionMiddleware)("vendors"), admin_controller_1.default.updateVendor);
router.patch("/vendors/:id/status", (0, auth_middleware_1.permissionMiddleware)("vendors"), vendor_controller_1.default.updateVendorStatus);
router.patch("/vendors/:id/verify", (0, auth_middleware_1.permissionMiddleware)("vendors"), vendor_controller_1.default.updateVendorVerification);
router.delete("/vendors/:id", (0, auth_middleware_1.permissionMiddleware)("vendors"), vendor_controller_1.default.deleteVendor);
// ============================================
// PARTNER MANAGEMENT
// ============================================
router.post("/partners", (0, auth_middleware_1.permissionMiddleware)("partners"), admin_controller_1.default.createPartner);
router.get("/partners", (0, auth_middleware_1.permissionMiddleware)("partners"), partner_controller_1.default.getAllPartners);
router.get("/partners/active-locations", (0, auth_middleware_1.permissionMiddleware)("partners"), admin_controller_1.default.getActivePartnerLocations);
router.get("/partners/available", (0, auth_middleware_1.permissionMiddleware)("partners"), partner_controller_1.default.getAvailablePartners);
router.get("/partners/:id", (0, auth_middleware_1.permissionMiddleware)("partners"), partner_controller_1.default.getPartnerById);
router.put("/partners/:id", (0, auth_middleware_1.permissionMiddleware)("partners"), partner_controller_1.default.updatePartnerByAdmin);
router.patch("/partners/:id", (0, auth_middleware_1.permissionMiddleware)("partners"), partner_controller_1.default.updatePartnerByAdmin);
router.put("/partners/:id/status", (0, auth_middleware_1.permissionMiddleware)("partners"), partner_controller_1.default.updatePartnerStatus);
router.patch("/partners/:id/status", (0, auth_middleware_1.permissionMiddleware)("partners"), partner_controller_1.default.updatePartnerStatus);
router.patch("/partners/:id/verify", (0, auth_middleware_1.permissionMiddleware)("partners"), partner_controller_1.default.updatePartnerVerification);
router.post("/partners/:id/assign-vehicle", (0, auth_middleware_1.permissionMiddleware)("partners"), partner_controller_1.default.assignPartnerToVehicle);
router.delete("/partners/:id/unassign-vehicle", (0, auth_middleware_1.permissionMiddleware)("partners"), partner_controller_1.default.unassignPartnerFromVehicle);
router.get("/partners/:id/rides", (0, auth_middleware_1.permissionMiddleware)("partners"), partner_controller_1.default.getPartnerRides);
router.get("/partners/:id/analytics", (0, auth_middleware_1.permissionMiddleware)("partners"), partner_controller_1.default.getPartnerAnalytics);
router.delete("/partners/:id", (0, auth_middleware_1.permissionMiddleware)("partners"), partner_controller_1.default.deletePartner);
// ============================================
// ATTACHMENT MANAGEMENT
// ============================================
router.post("/attachments", (0, auth_middleware_1.permissionMiddleware)("attachments"), admin_controller_1.default.createAttachment);
router.get("/attachments", (0, auth_middleware_1.permissionMiddleware)("attachments"), admin_controller_1.default.getAllAttachments);
router.get("/attachments/:id", (0, auth_middleware_1.permissionMiddleware)("attachments"), admin_controller_1.default.getAttachmentById);
router.put("/attachments/:id/status", (0, auth_middleware_1.permissionMiddleware)("attachments"), admin_controller_1.default.toggleAttachmentStatus);
router.post("/attachments/:id/verify", (0, auth_middleware_1.permissionMiddleware)("attachments"), admin_controller_1.default.verifyAttachment);
router.delete("/attachments/:id", (0, auth_middleware_1.permissionMiddleware)("attachments"), admin_controller_1.default.deleteAttachment);
// ============================================
// CITY CODE MANAGEMENT
// ============================================
router.get("/city-codes", (0, auth_middleware_1.permissionMiddleware)("config"), admin_controller_1.default.getAllCityCodes);
router.post("/city-codes", (0, auth_middleware_1.permissionMiddleware)("config"), admin_controller_1.default.createCityCode);
router.put("/city-codes/:id", (0, auth_middleware_1.permissionMiddleware)("config"), admin_controller_1.default.updateCityCode);
router.patch("/city-codes/:id", (0, auth_middleware_1.permissionMiddleware)("config"), admin_controller_1.default.updateCityCode);
// ============================================
// VEHICLE MANAGEMENT
// ============================================
router.post("/vehicles", (0, auth_middleware_1.permissionMiddleware)("vehicles"), vehicle_controller_1.default.createVehicle);
router.get("/vehicles", (0, auth_middleware_1.permissionMiddleware)("vehicles"), vehicle_controller_1.default.getAllVehicles);
router.get("/vehicles/available", (0, auth_middleware_1.permissionMiddleware)("vehicles"), vehicle_controller_1.default.getAvailableVehicles);
router.get("/vehicles/:id", (0, auth_middleware_1.permissionMiddleware)("vehicles"), vehicle_controller_1.default.getVehicleById);
router.put("/vehicles/:id", (0, auth_middleware_1.permissionMiddleware)("vehicles"), vehicle_controller_1.default.updateVehicle);
router.patch("/vehicles/:id", (0, auth_middleware_1.permissionMiddleware)("vehicles"), vehicle_controller_1.default.updateVehicle);
router.patch("/vehicles/:id/status", (0, auth_middleware_1.permissionMiddleware)("vehicles"), vehicle_controller_1.default.updateVehicleStatus);
router.patch("/vehicles/:id/verify", (0, auth_middleware_1.permissionMiddleware)("vehicles"), vehicle_controller_1.default.updateVehicleVerification);
router.post("/vehicles/:id/assign-vendor", (0, auth_middleware_1.permissionMiddleware)("vehicles"), vehicle_controller_1.default.assignVehicleToVendor);
router.get("/vehicles/:id/rides", (0, auth_middleware_1.permissionMiddleware)("vehicles"), vehicle_controller_1.default.getVehicleRides);
router.delete("/vehicles/:id", (0, auth_middleware_1.permissionMiddleware)("vehicles"), vehicle_controller_1.default.deleteVehicle);
// ============================================
// AGENT MANAGEMENT
// ============================================
router.post("/agents", (0, auth_middleware_1.permissionMiddleware)("agents"), admin_controller_1.default.createAgent);
router.get("/agents", (0, auth_middleware_1.permissionMiddleware)("agents"), agent_controller_1.default.getAllAgents);
router.get("/agents/:id", (0, auth_middleware_1.permissionMiddleware)("agents"), agent_controller_1.default.getAgentById);
router.put("/agents/:id", (0, auth_middleware_1.permissionMiddleware)("agents"), agent_controller_1.default.updateAgentByAdmin);
router.patch("/agents/:id", (0, auth_middleware_1.permissionMiddleware)("agents"), agent_controller_1.default.updateAgentByAdmin);
router.delete("/agents/:id", (0, auth_middleware_1.permissionMiddleware)("agents"), agent_controller_1.default.deleteAgent);
// ============================================
// AGENT COUPON MANAGEMENT
// ============================================
router.post("/agent-coupons", (0, auth_middleware_1.permissionMiddleware)("promotions"), agentCoupon_controller_1.default.createCoupon);
router.get("/agent-coupons", (0, auth_middleware_1.permissionMiddleware)("promotions"), agentCoupon_controller_1.default.getAllCoupons);
router.get("/agent-coupons/:id", (0, auth_middleware_1.permissionMiddleware)("promotions"), agentCoupon_controller_1.default.getCouponById);
router.put("/agent-coupons/:id", (0, auth_middleware_1.permissionMiddleware)("promotions"), agentCoupon_controller_1.default.updateCoupon);
router.patch("/agent-coupons/:id/status", (0, auth_middleware_1.permissionMiddleware)("promotions"), agentCoupon_controller_1.default.toggleCouponStatus);
router.delete("/agent-coupons/:id", (0, auth_middleware_1.permissionMiddleware)("promotions"), agentCoupon_controller_1.default.deleteCoupon);
// ============================================
// CORPORATE MANAGEMENT
// ============================================
router.get("/corporates", (0, auth_middleware_1.permissionMiddleware)("corporates"), admin_controller_1.default.getAllCorporates);
router.get("/corporates/:id", (0, auth_middleware_1.permissionMiddleware)("corporates"), admin_controller_1.default.getCorporateById);
router.put("/corporates/:id", (0, auth_middleware_1.permissionMiddleware)("corporates"), admin_controller_1.default.updateCorporate);
router.patch("/corporates/:id", (0, auth_middleware_1.permissionMiddleware)("corporates"), admin_controller_1.default.updateCorporate);
router.delete("/corporates/:id", (0, auth_middleware_1.permissionMiddleware)("corporates"), corporate_controller_1.default.deleteCorporate);
// ============================================
// BILLING MANAGEMENT
// ============================================
router.post("/billing", (0, auth_middleware_1.permissionMiddleware)("billing"), billing_controller_1.default.createBilling);
router.get("/billing", (0, auth_middleware_1.permissionMiddleware)("billing"), billing_controller_1.default.getAllBillings);
router.get("/billing/outstanding", (0, auth_middleware_1.permissionMiddleware)("billing"), billing_controller_1.default.getOutstandingPayments);
router.get("/billing/:id", (0, auth_middleware_1.permissionMiddleware)("billing"), billing_controller_1.default.getBillingById);
router.get("/billing/summary/:corporateId", (0, auth_middleware_1.permissionMiddleware)("billing"), billing_controller_1.default.getBillingSummary);
// ============================================
// PAYMENT MANAGEMENT
// ============================================
router.post("/payments", (0, auth_middleware_1.permissionMiddleware)("billing"), billing_controller_1.default.recordPayment);
router.get("/payments", (0, auth_middleware_1.permissionMiddleware)("billing"), billing_controller_1.default.getPaymentHistory);
// ============================================
// DASHBOARD & ANALYTICS
// ============================================
router.get("/dashboard", admin_controller_1.default.getDashboard);
router.get("/analytics/revenue", admin_controller_1.default.getRevenueAnalytics);
router.get("/analytics/rides", admin_controller_1.default.getRideAnalytics);
router.get("/analytics/entities", admin_controller_1.default.getEntityStatusOverview);
router.get("/recent-activity", admin_controller_1.default.getRecentActivity);
router.get("/analytics/cancellations", admin_controller_1.default.getCancellationAnalytics);
router.get("/audit-timeline", admin_controller_1.default.getAuditTimeline);
// ============================================
// SETTLEMENT MANAGEMENT
// ============================================
router.get("/settlements/stats", (0, auth_middleware_1.permissionMiddleware)("billing"), async (req, res) => {
    try {
        const { getSettlementStats } = require("../../services/admin/settlement.service");
        const stats = await getSettlementStats();
        res.json({ success: true, data: stats });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
router.get("/settlements/partners", (0, auth_middleware_1.permissionMiddleware)("billing"), async (req, res) => {
    try {
        const { getPartnerSettlements } = require("../../services/admin/settlement.service");
        const data = await getPartnerSettlements();
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
router.get("/settlements/vendors", (0, auth_middleware_1.permissionMiddleware)("billing"), async (req, res) => {
    try {
        const { getVendorSettlements } = require("../../services/admin/settlement.service");
        const data = await getVendorSettlements();
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
// ============================================
// FRAUD DETECTION
// ============================================
router.get("/fraud-alerts", (0, auth_middleware_1.permissionMiddleware)("rides"), async (req, res) => {
    try {
        const { getFraudAlerts } = require("../../services/admin/fraud.service");
        const data = await getFraudAlerts();
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
// ============================================
// BROADCAST NOTIFICATIONS
// ============================================
router.get("/broadcast/history", (0, auth_middleware_1.permissionMiddleware)("config"), async (req, res) => {
    try {
        const { getBroadcastHistory } = require("../../services/admin/broadcast.service");
        const data = await getBroadcastHistory();
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
router.post("/broadcast/send", (0, auth_middleware_1.permissionMiddleware)("config"), async (req, res) => {
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
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
exports.default = router;
