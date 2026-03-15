import { Router } from "express";
import rideController from "../../controllers/ride/ride.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

/* ===============================
        COMMON RIDE ROUTES
================================ */

// Validate a coupon before ride booking (Public)
router.post("/validate-coupon", rideController.validateCoupon);

export default router;
