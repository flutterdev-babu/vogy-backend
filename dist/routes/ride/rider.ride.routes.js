"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ride_controller_1 = __importDefault(require("../../controllers/ride/ride.controller"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
/* ===============================
        PARTNER RIDE ROUTES
================================ */
// All routes require authentication and PARTNER role
router.use((0, auth_middleware_1.authMiddleware)(["PARTNER"]));
// Update rider's current location
router.post("/location", ride_controller_1.default.updateLocation);
// Toggle online/offline status
router.post("/online-status", ride_controller_1.default.toggleOnlineStatus);
// Get available rides for rider (requires lat, lng query params)
router.get("/available", ride_controller_1.default.getAvailableRides);
// Accept a ride
router.post("/:id/accept", ride_controller_1.default.acceptRide);
// Get all rides for partner (optional status filter)
router.get("/", ride_controller_1.default.getPartnerRides);
// Update ride status (ARRIVED or STARTED)
router.patch("/:id/status", ride_controller_1.default.updateRideStatus);
exports.default = router;
