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
        USER RIDE ROUTES
================================ */
// All routes require authentication and USER role
router.use((0, auth_middleware_1.authMiddleware)(["USER"]));
// Create a new ride request
router.post("/new-ride", ride_controller_1.default.createRide);
// Get all rides for user (optional status filter)
router.get("/all-rides", ride_controller_1.default.getUserRides);
// Get a specific ride by ID
router.get("/rideby/:id", ride_controller_1.default.getRideById);
// Cancel a ride
router.post("/:id/cancel", ride_controller_1.default.cancelRide);
// Complete ride with user's OTP
router.post("/:id/complete", ride_controller_1.default.completeRide);
exports.default = router;
