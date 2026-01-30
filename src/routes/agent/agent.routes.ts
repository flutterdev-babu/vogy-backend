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

// Vendors under this agent
router.get("/vendors", agentController.getAgentVendors);

// Corporates under this agent
router.get("/corporates", agentController.getAgentCorporates);

// Rides
router.get("/rides", agentController.getAgentRides);

// Analytics
router.get("/analytics", agentController.getAgentAnalytics);

/* ===============================
        CITY CODE MANAGEMENT
================================ */

// City code CRUD
router.post("/city-codes", cityController.createCityCode);
router.get("/city-codes", cityController.getAgentCityCodes);
router.get("/city-codes/:id", cityController.getCityCodeById);
router.put("/city-codes/:id", cityController.updateCityCode);
router.patch("/city-codes/:id", cityController.updateCityCode);
router.delete("/city-codes/:id", cityController.deleteCityCode);

/* ===============================
        FARE PRICING MANAGEMENT
================================ */

// Pricing per city per vehicle type
router.post("/city-codes/:cityCodeId/pricing", cityController.setCityPricing);
router.get("/city-codes/:cityCodeId/pricing", cityController.getCityPricing);
router.put("/city-codes/:cityCodeId/pricing", cityController.setCityPricing);
router.patch("/city-codes/:cityCodeId/pricing", cityController.setCityPricing);
router.delete("/city-codes/:cityCodeId/pricing/:vehicleTypeId", cityController.deleteCityPricing);

export default router;
