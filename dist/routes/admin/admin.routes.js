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
const corporate_controller_1 = __importDefault(require("../../controllers/corporate/corporate.controller"));
const vehicle_controller_1 = __importDefault(require("../../controllers/vehicle/vehicle.controller"));
const billing_controller_1 = __importDefault(require("../../controllers/billing/billing.controller"));
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
// VEHICLE TYPE MANAGEMENT
// ============================================
router.post("/vehicle-types", admin_controller_1.default.createVehicleType);
router.get("/vehicle-types", admin_controller_1.default.getAllVehicleTypes);
router.get("/vehicle-types/:id", admin_controller_1.default.getVehicleTypeById);
router.put("/vehicle-types/:id", admin_controller_1.default.updateVehicleType);
router.patch("/vehicle-types/:id", admin_controller_1.default.updateVehicleType);
router.delete("/vehicle-types/:id", admin_controller_1.default.deleteVehicleType);
// ============================================
// PRICING CONFIGURATION
// ============================================
router.get("/pricing-config", admin_controller_1.default.getPricingConfig);
router.put("/pricing-config", admin_controller_1.default.updatePricingConfig);
router.patch("/pricing-config", admin_controller_1.default.updatePricingConfig);
// ============================================
// RIDE MANAGEMENT (Legacy)
// ============================================
router.post("/rides", admin_controller_1.default.createManualRide);
router.get("/rides", admin_controller_1.default.getAllRides);
router.get("/rides/scheduled", admin_controller_1.default.getScheduledRides);
router.get("/rides/:id", admin_controller_1.default.getRideById);
router.patch("/rides/:id/status", admin_controller_1.default.updateRideStatus);
router.get("/rides/:id/otp", admin_controller_1.default.getRideOtp);
router.post("/rides/:id/assign-rider", admin_controller_1.default.assignRiderToRide);
// ============================================
// LEGACY RIDER MANAGEMENT
// ============================================
router.get("/riders", admin_controller_1.default.getAllRiders);
router.get("/riders/:id", admin_controller_1.default.getRiderById);
// ============================================
// USER MANAGEMENT
// ============================================
router.get("/users", admin_controller_1.default.getAllUsers);
router.get("/users/:id", admin_controller_1.default.getUserById);
router.post("/users/:id/regenerate-otp", admin_controller_1.default.updateUserUniqueOtp);
router.put("/users/:id/unique-otp", admin_controller_1.default.updateUserUniqueOtp);
router.patch("/users/:id/unique-otp", admin_controller_1.default.updateUserUniqueOtp);
// ============================================
// VENDOR MANAGEMENT
// ============================================
router.post("/vendors", admin_controller_1.default.createVendor);
router.get("/vendors", admin_controller_1.default.getAllVendors);
router.get("/vendors/:id", admin_controller_1.default.getVendorById);
router.put("/vendors/:id", admin_controller_1.default.updateVendor);
router.patch("/vendors/:id", admin_controller_1.default.updateVendor);
router.patch("/vendors/:id/status", vendor_controller_1.default.updateVendorStatus);
router.patch("/vendors/:id/verify", vendor_controller_1.default.updateVendorVerification);
router.delete("/vendors/:id", vendor_controller_1.default.deleteVendor);
// ============================================
// PARTNER MANAGEMENT
// ============================================
router.post("/partners", admin_controller_1.default.createPartner);
router.get("/partners", partner_controller_1.default.getAllPartners);
router.get("/partners/available", partner_controller_1.default.getAvailablePartners);
router.get("/partners/:id", partner_controller_1.default.getPartnerById);
router.put("/partners/:id", partner_controller_1.default.updatePartnerByAdmin);
router.patch("/partners/:id", partner_controller_1.default.updatePartnerByAdmin);
router.put("/partners/:id/status", partner_controller_1.default.updatePartnerStatus);
router.patch("/partners/:id/status", partner_controller_1.default.updatePartnerStatus);
router.patch("/partners/:id/verify", partner_controller_1.default.updatePartnerVerification);
router.post("/partners/:id/assign-vehicle", partner_controller_1.default.assignPartnerToVehicle);
router.delete("/partners/:id/unassign-vehicle", partner_controller_1.default.unassignPartnerFromVehicle);
router.get("/partners/:id/rides", partner_controller_1.default.getPartnerRides);
router.get("/partners/:id/analytics", partner_controller_1.default.getPartnerAnalytics);
router.delete("/partners/:id", partner_controller_1.default.deletePartner);
// ============================================
// ATTACHMENT MANAGEMENT
// ============================================
router.post("/attachments", admin_controller_1.default.createAttachment);
router.get("/attachments", admin_controller_1.default.getAllAttachments);
router.put("/attachments/:id/status", admin_controller_1.default.toggleAttachmentStatus);
router.post("/attachments/:id/verify", admin_controller_1.default.verifyAttachment);
router.delete("/attachments/:id", admin_controller_1.default.deleteAttachment);
// ============================================
// CITY CODE MANAGEMENT
// ============================================
router.get("/city-codes", admin_controller_1.default.getAllCityCodes);
router.post("/city-codes", admin_controller_1.default.createCityCode);
router.put("/city-codes/:id", admin_controller_1.default.updateCityCode);
router.patch("/city-codes/:id", admin_controller_1.default.updateCityCode);
// ============================================
// VEHICLE MANAGEMENT
// ============================================
router.post("/vehicles", vehicle_controller_1.default.createVehicle);
router.get("/vehicles", vehicle_controller_1.default.getAllVehicles);
router.get("/vehicles/available", vehicle_controller_1.default.getAvailableVehicles);
router.get("/vehicles/:id", vehicle_controller_1.default.getVehicleById);
router.put("/vehicles/:id", vehicle_controller_1.default.updateVehicle);
router.patch("/vehicles/:id", vehicle_controller_1.default.updateVehicle);
router.patch("/vehicles/:id/status", vehicle_controller_1.default.updateVehicleStatus);
router.patch("/vehicles/:id/verify", vehicle_controller_1.default.updateVehicleVerification);
router.post("/vehicles/:id/assign-vendor", vehicle_controller_1.default.assignVehicleToVendor);
router.get("/vehicles/:id/rides", vehicle_controller_1.default.getVehicleRides);
router.delete("/vehicles/:id", vehicle_controller_1.default.deleteVehicle);
// ============================================
// AGENT MANAGEMENT
// ============================================
router.get("/agents", agent_controller_1.default.getAllAgents);
router.get("/agents/:id", agent_controller_1.default.getAgentById);
router.put("/agents/:id", agent_controller_1.default.updateAgentByAdmin);
router.patch("/agents/:id", agent_controller_1.default.updateAgentByAdmin);
router.delete("/agents/:id", agent_controller_1.default.deleteAgent);
// ============================================
// CORPORATE MANAGEMENT
// ============================================
router.get("/corporates", admin_controller_1.default.getAllCorporates);
router.get("/corporates/:id", admin_controller_1.default.getCorporateById);
router.put("/corporates/:id", admin_controller_1.default.updateCorporate);
router.patch("/corporates/:id", admin_controller_1.default.updateCorporate);
router.delete("/corporates/:id", corporate_controller_1.default.deleteCorporate);
// ============================================
// BILLING MANAGEMENT
// ============================================
router.post("/billing", billing_controller_1.default.createBilling);
router.get("/billing", billing_controller_1.default.getAllBillings);
router.get("/billing/outstanding", billing_controller_1.default.getOutstandingPayments);
router.get("/billing/:id", billing_controller_1.default.getBillingById);
router.get("/billing/summary/:corporateId", billing_controller_1.default.getBillingSummary);
// ============================================
// PAYMENT MANAGEMENT
// ============================================
router.post("/payments", billing_controller_1.default.recordPayment);
router.get("/payments", billing_controller_1.default.getPaymentHistory);
// ============================================
// DASHBOARD & ANALYTICS
// ============================================
router.get("/dashboard", admin_controller_1.default.getDashboard);
router.get("/analytics/revenue", admin_controller_1.default.getRevenueAnalytics);
router.get("/analytics/rides", admin_controller_1.default.getRideAnalytics);
router.get("/analytics/entities", admin_controller_1.default.getEntityStatusOverview);
router.get("/recent-activity", admin_controller_1.default.getRecentActivity);
exports.default = router;
