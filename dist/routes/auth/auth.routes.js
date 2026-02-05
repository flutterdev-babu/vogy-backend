"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = __importDefault(require("../../controllers/auth/auth.controller"));
const router = (0, express_1.Router)();
/* ===============================
        USER AUTH ROUTES
================================ */
// Register user
router.post("/register-user", auth_controller_1.default.registerUser);
// Note: Rider registration has been removed - use Partner auth (/api/partners/auth/register)
// All drivers are now unified under the Partner entity
// Login step 1 → send OTP (for USER or PARTNER)
router.post("/send-otp", auth_controller_1.default.sendOtp);
// Login step 2 → verify OTP & return token (for USER or PARTNER)
router.post("/verify-otp", auth_controller_1.default.verifyOtp);
exports.default = router;
