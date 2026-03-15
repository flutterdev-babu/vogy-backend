"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const agent_controller_1 = __importDefault(require("../../controllers/agent/agent.controller"));
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
// Rides linked via Agent Code
router.get("/rides", agent_controller_1.default.getAgentRides);
// Analytics
router.get("/analytics", agent_controller_1.default.getAgentAnalytics);
/* ===============================
        USER MANAGEMENT
================================ */
// List all users
router.get("/users", agent_controller_1.default.getAllUsers);
// Create a new user
router.post("/users", agent_controller_1.default.createUser);
exports.default = router;
