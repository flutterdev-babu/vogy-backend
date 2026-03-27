const path = require("path");
// Go up one level since this is in the scripts folder
const rideControllerPath = path.resolve(__dirname, "../src/controllers/ride/ride.controller");
const rideRoutesPath = path.resolve(__dirname, "../src/routes/ride/ride.routes");
const authMiddlewarePath = path.resolve(__dirname, "../src/middleware/auth.middleware");

// We might need to use ts-node to require these if they are not transpiled
// But since we are in dev mode, we can try to use standard require if ts-node handles it
try {
    const rideController = require(rideControllerPath).default;
    console.log("rideController properties:", Object.keys(rideController || {}));
    console.log("handleManualBooking:", typeof rideController?.handleManualBooking);
    console.log("validateCoupon:", typeof rideController?.validateCoupon);

    const { authMiddleware } = require(authMiddlewarePath);
    console.log("authMiddleware type:", typeof authMiddleware);
    
    const express = require("express");
    const router = express.Router();
    
    // Attempting to define the route
    router.post("/test", authMiddleware(), rideController.handleManualBooking);
    console.log("Route definition successful");
} catch (err) {
    console.error("ERROR during inspection:", err);
}
