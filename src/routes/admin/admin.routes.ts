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
router.get("/rides", adminController.getAllRides);
router.get("/rides/scheduled", adminController.getScheduledRides);
router.get("/rides/:id", adminController.getRideById);
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
router.get("/vendors", vendorController.getAllVendors);
router.get("/vendors/:id", vendorController.getVendorById);
router.put("/vendors/:id", vendorController.updateVendorByAdmin);
router.patch("/vendors/:id", vendorController.updateVendorByAdmin);
router.put("/vendors/:id/status", vendorController.updateVendorStatus);
router.patch("/vendors/:id/status", vendorController.updateVendorStatus);
router.get("/vendors/:id/vehicles", vendorController.getVendorVehicles);
router.get("/vendors/:id/rides", vendorController.getVendorRides);
router.get("/vendors/:id/analytics", vendorController.getVendorAnalytics);
router.delete("/vendors/:id", vendorController.deleteVendor);

// ============================================
// PARTNER MANAGEMENT
// ============================================
router.get("/partners", partnerController.getAllPartners);
router.get("/partners/available", partnerController.getAvailablePartners);
router.get("/partners/:id", partnerController.getPartnerById);
router.put("/partners/:id", partnerController.updatePartnerByAdmin);
router.patch("/partners/:id", partnerController.updatePartnerByAdmin);
router.put("/partners/:id/status", partnerController.updatePartnerStatus);
router.patch("/partners/:id/status", partnerController.updatePartnerStatus);
router.post("/partners/:id/assign-vehicle", partnerController.assignPartnerToVehicle);
router.delete("/partners/:id/unassign-vehicle", partnerController.unassignPartnerFromVehicle);
router.get("/partners/:id/rides", partnerController.getPartnerRides);
router.get("/partners/:id/analytics", partnerController.getPartnerAnalytics);
router.delete("/partners/:id", partnerController.deletePartner);

// ============================================
// VEHICLE MANAGEMENT
// ============================================
router.post("/vehicles", vehicleController.createVehicle);
router.get("/vehicles", vehicleController.getAllVehicles);
router.get("/vehicles/available", vehicleController.getAvailableVehicles);
router.get("/vehicles/:id", vehicleController.getVehicleById);
router.put("/vehicles/:id", vehicleController.updateVehicle);
router.patch("/vehicles/:id", vehicleController.updateVehicle);
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
router.get("/agents/:id/vendors", agentController.getAgentVendors);
router.get("/agents/:id/corporates", agentController.getAgentCorporates);
router.get("/agents/:id/rides", agentController.getAgentRides);
router.get("/agents/:id/analytics", agentController.getAgentAnalytics);
router.post("/agents/:id/assign-vendor", agentController.registerVendorUnderAgent);
router.post("/agents/:id/assign-corporate", agentController.registerCorporateUnderAgent);
router.delete("/agents/:id", agentController.deleteAgent);

// ============================================
// CORPORATE MANAGEMENT
// ============================================
router.get("/corporates", corporateController.getAllCorporates);
router.get("/corporates/:id", corporateController.getCorporateById);
router.put("/corporates/:id", corporateController.updateCorporateByAdmin);
router.patch("/corporates/:id", corporateController.updateCorporateByAdmin);
router.put("/corporates/:id/status", corporateController.updateCorporateStatus);
router.patch("/corporates/:id/status", corporateController.updateCorporateStatus);
router.put("/corporates/:id/credit-limit", corporateController.updateCorporateCreditLimit);
router.patch("/corporates/:id/credit-limit", corporateController.updateCorporateCreditLimit);
router.get("/corporates/:id/rides", corporateController.getCorporateRides);
router.get("/corporates/:id/billing", corporateController.getCorporateBillingHistory);
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

export default router;
