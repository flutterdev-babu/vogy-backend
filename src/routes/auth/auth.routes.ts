import { Router } from "express";
import authController from "../../controllers/auth/auth.controller";

const router = Router();

/* ===============================
        USER & RIDER AUTH ROUTES
================================ */

// Register user
router.post("/register-user", authController.registerUser);

// Register rider
router.post("/register-rider", authController.registerRider);

// Login step 1 → send OTP (for USER or RIDER)
router.post("/send-otp", authController.sendOtp);

// Login step 2 → verify OTP & return token (for USER or RIDER)
router.post("/verify-otp", authController.verifyOtp);

export default router;
