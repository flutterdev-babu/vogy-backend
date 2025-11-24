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
        RIDER RIDE ROUTES
================================ */
// All routes require authentication and RIDER role
router.use((0, auth_middleware_1.authMiddleware)(["RIDER"]));
// Get available rides for rider (requires lat, lng query params)
router.get("/available", ride_controller_1.default.getAvailableRides);
// Accept a ride
router.post("/:id/accept", ride_controller_1.default.acceptRide);
// Get all rides for rider (optional status filter)
router.get("/", ride_controller_1.default.getRiderRides);
// Update ride status (ARRIVED or STARTED)
router.patch("/:id/status", ride_controller_1.default.updateRideStatus);
exports.default = router;
