"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vendor_controller_1 = __importDefault(require("../../controllers/vendor/vendor.controller"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
/* ===============================
        VENDOR AUTH ROUTES (Public)
================================ */
// Register vendor
router.post("/auth/register", vendor_controller_1.default.register);
// Login vendor
router.post("/auth/login", vendor_controller_1.default.login);
/* ===============================
        VENDOR PROTECTED ROUTES
================================ */
// All routes below require VENDOR authentication
router.use((0, auth_middleware_1.authMiddleware)(["VENDOR"]));
// Profile management
router.get("/profile", vendor_controller_1.default.getProfile);
router.put("/profile", vendor_controller_1.default.updateProfile);
router.patch("/profile", vendor_controller_1.default.updateProfile);
// Own vehicles
router.get("/vehicles", vendor_controller_1.default.getVendorVehicles);
// Own rides
router.get("/rides", vendor_controller_1.default.getVendorRides);
// Analytics
router.get("/analytics", vendor_controller_1.default.getVendorAnalytics);
exports.default = router;
