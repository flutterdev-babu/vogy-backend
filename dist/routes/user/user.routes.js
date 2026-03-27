"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = __importDefault(require("../../controllers/user/user.controller"));
const ticket_controller_1 = __importDefault(require("../../controllers/cc/ticket.controller"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
/* ===============================
        USER ROUTES
================================ */
// All routes require authentication and USER role
router.use((0, auth_middleware_1.authMiddleware)(["USER"]));
// Get user profile
router.get("/profile", user_controller_1.default.getProfile);
// Update user profile
router.put("/profile", user_controller_1.default.updateProfile);
router.patch("/profile", user_controller_1.default.updateProfile);
// Ride summary & active ride
router.get("/rides/summary", user_controller_1.default.getRideSummary);
router.get("/rides/active", user_controller_1.default.getActiveRide);
// Spend summary
router.get("/spend-summary", user_controller_1.default.getSpendSummary);
// Get user unique OTP
router.get("/unique-otp", user_controller_1.default.getUniqueOtp);
// Update/Regenerate user unique OTP
router.post("/unique-otp/regenerate", user_controller_1.default.updateUniqueOtp);
router.put("/unique-otp", user_controller_1.default.updateUniqueOtp);
router.patch("/unique-otp", user_controller_1.default.updateUniqueOtp);
// Saved Places
router.get("/saved-places", user_controller_1.default.getSavedPlaces);
router.put("/saved-places", user_controller_1.default.updateSavedPlaces);
// Emergency Contacts & Safety
router.get("/emergency-contacts", user_controller_1.default.getEmergencyContacts);
router.put("/emergency-contacts", user_controller_1.default.updateEmergencyContacts);
// Referral System
router.get("/referral-code", user_controller_1.default.getReferralCode);
router.post("/referral/apply", user_controller_1.default.applyReferralCode);
// Support Tickets
router.post("/support-tickets", ticket_controller_1.default.createCustomerTicket);
router.get("/support-tickets", ticket_controller_1.default.getMyTickets);
router.get("/support-tickets/:id", ticket_controller_1.default.getCustomerTicketById);
router.post("/support-tickets/:id/messages", ticket_controller_1.default.addCustomerMessage);
exports.default = router;
