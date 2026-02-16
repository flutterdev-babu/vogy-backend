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

export default router;
