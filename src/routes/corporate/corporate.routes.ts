import { Router } from "express";
import corporateController from "../../controllers/corporate/corporate.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

/* ===============================
        CORPORATE AUTH ROUTES (Public)
================================ */

// Register corporate
router.post("/auth/register", corporateController.register);

// Login corporate
router.post("/auth/login", corporateController.login);

/* ===============================
        CORPORATE PROTECTED ROUTES
================================ */

// All routes below require CORPORATE authentication
router.use(authMiddleware(["CORPORATE"]));

// Profile management
router.get("/profile", corporateController.getProfile);
router.put("/profile", corporateController.updateProfile);
router.patch("/profile", corporateController.updateProfile);

// Ride history
router.get("/rides", corporateController.getCorporateRides);

// Billing
router.get("/billing", corporateController.getCorporateBillingHistory);
router.get("/billing/summary", corporateController.getCorporateBillingSummary);

// Payment history
router.get("/payments", corporateController.getCorporatePaymentHistory);

export default router;
