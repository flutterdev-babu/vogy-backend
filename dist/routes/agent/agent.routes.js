"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const agent_controller_1 = __importDefault(require("../../controllers/agent/agent.controller"));
const city_controller_1 = __importDefault(require("../../controllers/city/city.controller"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
/* ===============================
        AGENT AUTH ROUTES (Public)
================================ */
// Register agent
router.post("/auth/register", agent_controller_1.default.register);
// Login agent
router.post("/auth/login", agent_controller_1.default.login);
/* ===============================
        AGENT PROTECTED ROUTES
================================ */
// All routes below require AGENT authentication
router.use((0, auth_middleware_1.authMiddleware)(["AGENT"]));
// Profile management
router.get("/profile", agent_controller_1.default.getProfile);
router.put("/profile", agent_controller_1.default.updateProfile);
router.patch("/profile", agent_controller_1.default.updateProfile);
// Vendors under this agent
router.get("/vendors", agent_controller_1.default.getAgentVendors);
// Corporates under this agent
router.get("/corporates", agent_controller_1.default.getAgentCorporates);
// Rides
router.get("/rides", agent_controller_1.default.getAgentRides);
// Analytics
router.get("/analytics", agent_controller_1.default.getAgentAnalytics);
/* ===============================
        VENDOR MANAGEMENT
================================ */
// Create vendor under this agent
router.post("/vendors", agent_controller_1.default.createVendor);
/* ===============================
        CORPORATE MANAGEMENT
================================ */
// Create corporate under this agent
router.post("/corporates", agent_controller_1.default.createCorporate);
/* ===============================
        ALL AGENTS LIST
================================ */
// View all agents in the system
router.get("/all-agents", agent_controller_1.default.getAllAgents);
/* ===============================
        CITY CODE MANAGEMENT
================================ */
// City code CRUD
router.post("/city-codes", city_controller_1.default.createCityCode);
router.get("/city-codes", city_controller_1.default.getAgentCityCodes);
router.get("/city-codes/:id", city_controller_1.default.getCityCodeById);
router.put("/city-codes/:id", city_controller_1.default.updateCityCode);
router.patch("/city-codes/:id", city_controller_1.default.updateCityCode);
router.delete("/city-codes/:id", city_controller_1.default.deleteCityCode);
/* ===============================
        FARE PRICING MANAGEMENT
================================ */
// Pricing per city per vehicle type
router.post("/city-codes/:cityCodeId/pricing", city_controller_1.default.setCityPricing);
router.get("/city-codes/:cityCodeId/pricing", city_controller_1.default.getCityPricing);
router.put("/city-codes/:cityCodeId/pricing", city_controller_1.default.setCityPricing);
router.patch("/city-codes/:cityCodeId/pricing", city_controller_1.default.setCityPricing);
router.delete("/city-codes/:cityCodeId/pricing/:vehicleTypeId", city_controller_1.default.deleteCityPricing);
/* ===============================
        USER MANAGEMENT
================================ */
// List all users
router.get("/users", agent_controller_1.default.getAllUsers);
// Create a new user
router.post("/users", agent_controller_1.default.createUser);
/* ===============================
        RIDE MANAGEMENT
================================ */
// Get all rides in system
router.get("/rides/all", agent_controller_1.default.getOverallRides);
// Get rides from agent's vendors
router.get("/rides/vendor", agent_controller_1.default.getVendorRides);
// Get partners under agent's vendors
router.get("/partners", agent_controller_1.default.getAgentPartners);
// Create a manual ride with partner/vehicle assignment
router.post("/rides/manual", agent_controller_1.default.createManualRide);
// Get fare estimate for manual booking
router.get("/rides/estimate", agent_controller_1.default.getFareEstimate);
// Update ride status
router.patch("/rides/:id/status", agent_controller_1.default.updateRideStatus);
// Assign partner to a ride
router.post("/rides/:id/assign", agent_controller_1.default.assignPartnerToRide);
exports.default = router;
