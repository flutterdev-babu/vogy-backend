import { Router } from "express";
import rideController from "../../controllers/ride/ride.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

/* ===============================
        USER RIDE ROUTES
================================ */

// All routes require authentication and USER role
router.use(authMiddleware(["USER"]));

// Create a new ride request (instant booking)
router.post("/new-ride", rideController.createRide);

// Create a manual/scheduled ride request
router.post("/manual", rideController.createManualRide);

// Get all rides for user (optional status filter)
router.get("/all-rides", rideController.getUserRides);

// Validate a coupon before ride booking
router.post("/validate-coupon", rideController.validateCoupon);

// Get a specific ride by ID
router.get("/rideby/:id", rideController.getRideById);

// Cancel a ride
router.post("/:id/cancel", rideController.cancelRide);

// Complete ride with user's OTP
router.post("/:id/complete", rideController.completeRide);

export default router;

