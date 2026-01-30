import { Router } from "express";
import vendorController from "../../controllers/vendor/vendor.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

/* ===============================
        VENDOR AUTH ROUTES (Public)
================================ */

// Register vendor
router.post("/auth/register", vendorController.register);

// Login vendor
router.post("/auth/login", vendorController.login);

/* ===============================
        VENDOR PROTECTED ROUTES
================================ */

// All routes below require VENDOR authentication
router.use(authMiddleware(["VENDOR"]));

// Profile management
router.get("/profile", vendorController.getProfile);
router.put("/profile", vendorController.updateProfile);
router.patch("/profile", vendorController.updateProfile);

// Own vehicles
router.get("/vehicles", vendorController.getVendorVehicles);

// Own rides
router.get("/rides", vendorController.getVendorRides);

// Analytics
router.get("/analytics", vendorController.getVendorAnalytics);

export default router;
