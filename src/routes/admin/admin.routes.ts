import { Router } from "express";
import authController from "../../controllers/auth/auth.controller";
import adminController from "../../controllers/admin/admin.controller";
import vendorController from "../../controllers/vendor/vendor.controller";
import partnerController from "../../controllers/partner/partner.controller";
import agentController from "../../controllers/agent/agent.controller";
import corporateController from "../../controllers/corporate/corporate.controller";
import vehicleController from "../../controllers/vehicle/vehicle.controller";
import billingController from "../../controllers/billing/billing.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

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
// VEHICLE TYPE MANAGEMENT
// ============================================
router.post("/vehicle-types", adminController.createVehicleType);
router.get("/vehicle-types", adminController.getAllVehicleTypes);
router.get("/vehicle-types/:id", adminController.getVehicleTypeById);
router.put("/vehicle-types/:id", adminController.updateVehicleType);
router.patch("/vehicle-types/:id", adminController.updateVehicleType);
router.delete("/vehicle-types/:id", adminController.deleteVehicleType);

// ============================================
// PRICING CONFIGURATION
// ============================================
router.get("/pricing-config", adminController.getPricingConfig);
router.put("/pricing-config", adminController.updatePricingConfig);
router.patch("/pricing-config", adminController.updatePricingConfig);

// ============================================
// RIDE MANAGEMENT (Legacy)
// ============================================
router.post("/rides", adminController.createManualRide);
router.get("/rides", adminController.getAllRides);
router.get("/rides/scheduled", adminController.getScheduledRides);
router.get("/rides/:id", adminController.getRideById);
router.patch("/rides/:id/status", adminController.updateRideStatus);
router.get("/rides/:id/otp", adminController.getRideOtp);
router.post("/rides/:id/assign-rider", adminController.assignRiderToRide);

// ============================================
// LEGACY RIDER MANAGEMENT
// ============================================
router.get("/riders", adminController.getAllRiders);
router.get("/riders/:id", adminController.getRiderById);

// ============================================
// USER MANAGEMENT
// ============================================
router.get("/users", adminController.getAllUsers);
router.get("/users/:id", adminController.getUserById);
router.post("/users/:id/regenerate-otp", adminController.updateUserUniqueOtp);
router.put("/users/:id/unique-otp", adminController.updateUserUniqueOtp);
router.patch("/users/:id/unique-otp", adminController.updateUserUniqueOtp);

// ============================================
// VENDOR MANAGEMENT
// ============================================
router.post("/vendors", adminController.createVendor);
router.get("/vendors", adminController.getAllVendors);
router.get("/vendors/:id", adminController.getVendorById);
router.put("/vendors/:id", adminController.updateVendor);
router.patch("/vendors/:id", adminController.updateVendor);
router.patch("/vendors/:id/status", vendorController.updateVendorStatus);
router.patch("/vendors/:id/verify", vendorController.updateVendorVerification);
router.delete("/vendors/:id", vendorController.deleteVendor);

// ============================================
// PARTNER MANAGEMENT
// ============================================
router.post("/partners", adminController.createPartner);
router.get("/partners", partnerController.getAllPartners);
router.get("/partners/available", partnerController.getAvailablePartners);
router.get("/partners/:id", partnerController.getPartnerById);
router.put("/partners/:id", partnerController.updatePartnerByAdmin);
router.patch("/partners/:id", partnerController.updatePartnerByAdmin);
router.put("/partners/:id/status", partnerController.updatePartnerStatus);
router.patch("/partners/:id/status", partnerController.updatePartnerStatus);
router.patch("/partners/:id/verify", partnerController.updatePartnerVerification);
router.post("/partners/:id/assign-vehicle", partnerController.assignPartnerToVehicle);
router.delete("/partners/:id/unassign-vehicle", partnerController.unassignPartnerFromVehicle);
router.get("/partners/:id/rides", partnerController.getPartnerRides);
router.get("/partners/:id/analytics", partnerController.getPartnerAnalytics);
router.delete("/partners/:id", partnerController.deletePartner);

// ============================================
// ATTACHMENT MANAGEMENT
// ============================================
router.post("/attachments", adminController.createAttachment);
router.get("/attachments", adminController.getAllAttachments);
router.put("/attachments/:id/status", adminController.toggleAttachmentStatus);
router.post("/attachments/:id/verify", adminController.verifyAttachment);
router.delete("/attachments/:id", adminController.deleteAttachment);

// ============================================
// CITY CODE MANAGEMENT
// ============================================
router.get("/city-codes", adminController.getAllCityCodes);
router.post("/city-codes", adminController.createCityCode);
router.put("/city-codes/:id", adminController.updateCityCode);
router.patch("/city-codes/:id", adminController.updateCityCode);

// ============================================
// VEHICLE MANAGEMENT
// ============================================
router.post("/vehicles", vehicleController.createVehicle);
router.get("/vehicles", vehicleController.getAllVehicles);
router.get("/vehicles/available", vehicleController.getAvailableVehicles);
router.get("/vehicles/:id", vehicleController.getVehicleById);
router.put("/vehicles/:id", vehicleController.updateVehicle);
router.patch("/vehicles/:id", vehicleController.updateVehicle);
router.patch("/vehicles/:id/status", vehicleController.updateVehicleStatus);
router.patch("/vehicles/:id/verify", vehicleController.updateVehicleVerification);
router.post("/vehicles/:id/assign-vendor", vehicleController.assignVehicleToVendor);
router.get("/vehicles/:id/rides", vehicleController.getVehicleRides);
router.delete("/vehicles/:id", vehicleController.deleteVehicle);

// ============================================
// AGENT MANAGEMENT
// ============================================
router.get("/agents", agentController.getAllAgents);
router.get("/agents/:id", agentController.getAgentById);
router.put("/agents/:id", agentController.updateAgentByAdmin);
router.patch("/agents/:id", agentController.updateAgentByAdmin);
router.delete("/agents/:id", agentController.deleteAgent);

// ============================================
// CORPORATE MANAGEMENT
// ============================================
router.get("/corporates", adminController.getAllCorporates);
router.get("/corporates/:id", adminController.getCorporateById);
router.put("/corporates/:id", adminController.updateCorporate);
router.patch("/corporates/:id", adminController.updateCorporate);
router.delete("/corporates/:id", corporateController.deleteCorporate);

// ============================================
// BILLING MANAGEMENT
// ============================================
router.post("/billing", billingController.createBilling);
router.get("/billing", billingController.getAllBillings);
router.get("/billing/outstanding", billingController.getOutstandingPayments);
router.get("/billing/:id", billingController.getBillingById);
router.get("/billing/summary/:corporateId", billingController.getBillingSummary);

// ============================================
// PAYMENT MANAGEMENT
// ============================================
router.post("/payments", billingController.recordPayment);
router.get("/payments", billingController.getPaymentHistory);

// ============================================
// DASHBOARD & ANALYTICS
// ============================================
router.get("/dashboard", adminController.getDashboard);
router.get("/analytics/revenue", adminController.getRevenueAnalytics);
router.get("/analytics/rides", adminController.getRideAnalytics);
router.get("/analytics/entities", adminController.getEntityStatusOverview);
router.get("/recent-activity", adminController.getRecentActivity);

export default router;
