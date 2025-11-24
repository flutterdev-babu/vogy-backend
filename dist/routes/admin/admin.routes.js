"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = __importDefault(require("../../controllers/auth/auth.controller"));
const admin_controller_1 = __importDefault(require("../../controllers/admin/admin.controller"));
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
// Vehicle Type Management
router.post("/vehicle-types", admin_controller_1.default.createVehicleType);
router.get("/vehicle-types", admin_controller_1.default.getAllVehicleTypes);
router.get("/vehicle-types/:id", admin_controller_1.default.getVehicleTypeById);
router.put("/vehicle-types/:id", admin_controller_1.default.updateVehicleType);
router.patch("/vehicle-types/:id", admin_controller_1.default.updateVehicleType);
router.delete("/vehicle-types/:id", admin_controller_1.default.deleteVehicleType);
// Pricing Configuration
router.get("/pricing-config", admin_controller_1.default.getPricingConfig);
router.put("/pricing-config", admin_controller_1.default.updatePricingConfig);
router.patch("/pricing-config", admin_controller_1.default.updatePricingConfig);
// Ride Management
router.get("/rides", admin_controller_1.default.getAllRides);
router.get("/rides/:id", admin_controller_1.default.getRideById);
// User Management
router.get("/users", admin_controller_1.default.getAllUsers);
router.get("/users/:id", admin_controller_1.default.getUserById);
router.post("/users/:id/regenerate-otp", admin_controller_1.default.updateUserUniqueOtp);
router.put("/users/:id/unique-otp", admin_controller_1.default.updateUserUniqueOtp);
router.patch("/users/:id/unique-otp", admin_controller_1.default.updateUserUniqueOtp);
exports.default = router;
