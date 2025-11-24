import { Router } from "express";
import rideController from "../../controllers/ride/ride.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

/* ===============================
        USER RIDE ROUTES
================================ */

// All routes require authentication and USER role
router.use(authMiddleware(["USER"]));

// Create a new ride request
router.post("/new-ride", rideController.createRide);

// Get all rides for user (optional status filter)
router.get("/all-rides", rideController.getUserRides);

// Get a specific ride by ID
router.get("/rideby/:id", rideController.getRideById);

// Cancel a ride
router.post("/:id/cancel", rideController.cancelRide);

// Complete ride with user's OTP
router.post("/:id/complete", rideController.completeRide);

export default router;

