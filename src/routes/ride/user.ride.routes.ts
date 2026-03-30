import { Router } from "express";
import rideController from "../../controllers/ride/ride.controller";
import paymentController from "../../controllers/ride/payment.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

/* ===============================
        USER RIDE ROUTES
================================ */

// All routes require authentication and USER role
router.use(authMiddleware(["USER"]));

// Payment Verification (Atomic Flow)
router.post("/initiate-payment", paymentController.initiateIntent);
router.post("/verify-payment", paymentController.verifyPayment);
router.get("/active-intent", paymentController.getActiveIntent);

// Create a new ride request (instant booking)
router.post("/new-ride", rideController.createRide);

// Create a manual/scheduled ride request
router.post("/manual", rideController.createManualRide);

// Get all rides for user (optional status filter)
router.get("/all-rides", rideController.getUserRides);

// Estimate fare before booking
router.post("/estimate-fare", rideController.estimateFare);

// Validate a coupon before ride booking
router.post("/validate-coupon", rideController.validateCoupon);

// Get a specific ride by ID
router.get("/rideby/:id", rideController.getRideById);

// Cancel a ride
router.post("/:id/cancel", rideController.cancelRide);

// Complete ride with user's OTP
router.post("/:id/complete", rideController.completeRide);

export default router;

