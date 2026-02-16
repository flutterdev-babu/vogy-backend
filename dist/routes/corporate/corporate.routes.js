"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const corporate_controller_1 = __importDefault(require("../../controllers/corporate/corporate.controller"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
/* ===============================
        CORPORATE AUTH ROUTES (Public)
================================ */
// Register corporate
router.post("/auth/register", corporate_controller_1.default.register);
// Login corporate
router.post("/auth/login", corporate_controller_1.default.login);
/* ===============================
        CORPORATE PROTECTED ROUTES
================================ */
// All routes below require CORPORATE authentication
router.use((0, auth_middleware_1.authMiddleware)(["CORPORATE"]));
// Profile management
router.get("/profile", corporate_controller_1.default.getProfile);
router.put("/profile", corporate_controller_1.default.updateProfile);
router.patch("/profile", corporate_controller_1.default.updateProfile);
// Ride history
router.get("/rides", corporate_controller_1.default.getCorporateRides);
// Billing
router.get("/billing", corporate_controller_1.default.getCorporateBillingHistory);
router.get("/billing/summary", corporate_controller_1.default.getCorporateBillingSummary);
// Payment history
router.get("/payments", corporate_controller_1.default.getCorporatePaymentHistory);
exports.default = router;
