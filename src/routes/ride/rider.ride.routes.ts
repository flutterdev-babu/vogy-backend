import { Router } from "express";
import rideController from "../../controllers/ride/ride.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

/* ===============================
        PARTNER RIDE ROUTES
================================ */

// All routes require authentication and PARTNER role
router.use(authMiddleware(["PARTNER"]));

// Update rider's current location
router.post("/location", rideController.updateLocation);

// Toggle online/offline status
router.post("/online-status", rideController.toggleOnlineStatus);

// Get available rides for rider (requires lat, lng query params)
router.get("/available", rideController.getAvailableRides);

// Accept a ride
router.post("/:id/accept", rideController.acceptRide);

// Get all rides for partner (optional status filter)
router.get("/", rideController.getPartnerRides);

// Update ride status (ARRIVED or STARTED)
router.patch("/:id/status", rideController.updateRideStatus);

export default router;


