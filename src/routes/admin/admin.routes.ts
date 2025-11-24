import { Router } from "express";
import authController from "../../controllers/auth/auth.controller";
import adminController from "../../controllers/admin/admin.controller";
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

// Vehicle Type Management
router.post("/vehicle-types", adminController.createVehicleType);
router.get("/vehicle-types", adminController.getAllVehicleTypes);
router.get("/vehicle-types/:id", adminController.getVehicleTypeById);
router.put("/vehicle-types/:id", adminController.updateVehicleType);
router.patch("/vehicle-types/:id", adminController.updateVehicleType);
router.delete("/vehicle-types/:id", adminController.deleteVehicleType);

// Pricing Configuration
router.get("/pricing-config", adminController.getPricingConfig);
router.put("/pricing-config", adminController.updatePricingConfig);
router.patch("/pricing-config", adminController.updatePricingConfig);

// Ride Management
router.get("/rides", adminController.getAllRides);
router.get("/rides/:id", adminController.getRideById);

// User Management
router.get("/users", adminController.getAllUsers);
router.get("/users/:id", adminController.getUserById);
router.post("/users/:id/regenerate-otp", adminController.updateUserUniqueOtp);
router.put("/users/:id/unique-otp", adminController.updateUserUniqueOtp);
router.patch("/users/:id/unique-otp", adminController.updateUserUniqueOtp);

export default router;
