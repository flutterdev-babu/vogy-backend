"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = __importDefault(require("../../controllers/auth/auth.controller"));
const router = (0, express_1.Router)();
/* ===============================
        USER & RIDER AUTH ROUTES
================================ */
// Register user
router.post("/register-user", auth_controller_1.default.registerUser);
// Register rider
router.post("/register-rider", auth_controller_1.default.registerRider);
// Login step 1 → send OTP (for USER or RIDER)
router.post("/send-otp", auth_controller_1.default.sendOtp);
// Login step 2 → verify OTP & return token (for USER or RIDER)
router.post("/verify-otp", auth_controller_1.default.verifyOtp);
exports.default = router;
