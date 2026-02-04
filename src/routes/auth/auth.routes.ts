import { Router } from "express";
import authController from "../../controllers/auth/auth.controller";

const router = Router();

/* ===============================
        USER AUTH ROUTES
================================ */

// Register user
router.post("/register-user", authController.registerUser);

// Note: Rider registration has been removed - use Partner auth (/api/partners/auth/register)
// All drivers are now unified under the Partner entity

// Login step 1 → send OTP (for USER or PARTNER)
router.post("/send-otp", authController.sendOtp);

// Login step 2 → verify OTP & return token (for USER or PARTNER)
router.post("/verify-otp", authController.verifyOtp);

export default router;
