import { Router } from "express";
import userController from "../../controllers/user/user.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

/* ===============================
        USER ROUTES
================================ */

// All routes require authentication and USER role
router.use(authMiddleware(["USER"]));

// Get user profile
router.get("/profile", userController.getProfile);

// Update user profile
router.put("/profile", userController.updateProfile);
router.patch("/profile", userController.updateProfile);

// Ride summary & active ride
router.get("/rides/summary", userController.getRideSummary);
router.get("/rides/active", userController.getActiveRide);

// Spend summary
router.get("/spend-summary", userController.getSpendSummary);

// Get user unique OTP
router.get("/unique-otp", userController.getUniqueOtp);

// Update/Regenerate user unique OTP
router.post("/unique-otp/regenerate", userController.updateUniqueOtp);
router.put("/unique-otp", userController.updateUniqueOtp);
router.patch("/unique-otp", userController.updateUniqueOtp);

export default router;
