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

// Dashboard
router.get("/dashboard/stats", corporateController.getDashboardStats);

// Bookings
router.post("/bookings", corporateController.bookRide);

// Employees
router.get("/employees", corporateController.getEmployees);
router.post("/employees", corporateController.addEmployee);
router.delete("/employees/:id", corporateController.deleteEmployee);

export default router;
