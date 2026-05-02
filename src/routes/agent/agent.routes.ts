import { Router } from "express";
import agentController from "../../controllers/agent/agent.controller";
import cityController from "../../controllers/city/city.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

/* ===============================
        AGENT AUTH ROUTES (Public)
================================ */

// Register agent
router.post("/auth/register", agentController.register);

// Login agent
router.post("/auth/login", agentController.login);

/* ===============================
        AGENT PROTECTED ROUTES
================================ */

// All routes below require AGENT authentication
router.use(authMiddleware(["AGENT"]));

// Profile management
router.get("/profile", agentController.getProfile);
router.put("/profile", agentController.updateProfile);
router.patch("/profile", agentController.updateProfile);

// Rides linked via Agent Code
router.get("/rides", agentController.getAgentRides);

// Analytics
router.get("/analytics", agentController.getAgentAnalytics);

/* ===============================
        USER MANAGEMENT
================================ */

// List all users
router.get("/users", agentController.getAllUsers);

// Create a new user
router.post("/users", agentController.createUser);

/* ===============================
        VENDOR MANAGEMENT
================================ */

// List agent's vendors
router.get("/vendors", agentController.getAgentVendors);

// Create a new vendor
router.post("/vendors", agentController.registerVendor);

/* ===============================
        CORPORATE MANAGEMENT
================================ */

// List agent's corporates
router.get("/corporates", agentController.getAgentCorporates);

// Create a new corporate
router.post("/corporates", agentController.registerCorporate);

/* ===============================
        PARTNER MANAGEMENT
================================ */

// List agent's partners
router.get("/partners", agentController.getAgentPartners);

// Create a new partner
router.post("/partners", agentController.registerPartner);

/* ===============================
        VEHICLE MANAGEMENT
================================ */

// List agent's vehicles
router.get("/vehicles", agentController.getAgentVehicles);

/* ===============================
        RIDE MANAGEMENT
================================ */

// Get fare estimate
router.get("/rides/estimate", agentController.getFareEstimate);

// Create manual ride
router.post("/rides/manual", agentController.createManualRide);

// Assign partner to ride
router.post("/rides/:id/assign", agentController.assignPartnerToRide);

// Update ride status
router.patch("/rides/:id/status", agentController.updateRideStatus);

export default router;
