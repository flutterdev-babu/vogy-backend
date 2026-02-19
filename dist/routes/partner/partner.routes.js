"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const partner_controller_1 = __importDefault(require("../../controllers/partner/partner.controller"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
/* ===============================
        PARTNER AUTH ROUTES (Public)
================================ */
// Register partner
router.post("/auth/register", partner_controller_1.default.register);
// Login partner
router.post("/auth/login", partner_controller_1.default.login);
/* ===============================
        PARTNER PROTECTED ROUTES
================================ */
// All routes below require PARTNER authentication
router.use((0, auth_middleware_1.authMiddleware)(["PARTNER"]));
// Dashboard
router.get("/dashboard", partner_controller_1.default.getDashboard);
// Profile management
router.get("/profile", partner_controller_1.default.getProfile);
router.put("/profile", partner_controller_1.default.updateProfile);
router.patch("/profile", partner_controller_1.default.updateProfile);
// Location management
router.put("/location", partner_controller_1.default.updateLocation);
router.patch("/location", partner_controller_1.default.updateLocation);
// Online status
router.put("/online-status", partner_controller_1.default.toggleOnlineStatus);
router.patch("/online-status", partner_controller_1.default.toggleOnlineStatus);
// Vehicle info
router.get("/vehicle", partner_controller_1.default.getVehicleInfo);
// Rides
router.get("/rides", partner_controller_1.default.getPartnerRides);
router.get("/rides/:id", partner_controller_1.default.getPartnerRideDetail);
// Earnings
router.get("/earnings", partner_controller_1.default.getPartnerEarningsSummary);
// Analytics
router.get("/analytics", partner_controller_1.default.getPartnerAnalytics);
// Attachments
router.post("/attachments", partner_controller_1.default.createAttachment);
exports.default = router;
