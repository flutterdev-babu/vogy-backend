import { Router } from "express";
import userController from "../../controllers/user/user.controller";
import ticketController from "../../controllers/cc/ticket.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

/* ===============================
        USER ROUTES
================================ */

// All routes require authentication and USER role
router.use(authMiddleware(["USER"]));

// Get user profile
router.get("/profile", userController.getProfile);

// Update user profile
router.put("/profile", userController.updateProfile);
router.patch("/profile", userController.updateProfile);

// Update password
router.put("/profile/password", userController.updatePassword);

// Ride summary & active ride
router.get("/rides/summary", userController.getRideSummary);
router.get("/rides/active", userController.getActiveRide);

// Spend summary
router.get("/spend-summary", userController.getSpendSummary);

// Get user unique OTP
router.get("/unique-otp", userController.getUniqueOtp);

// Update/Regenerate user unique OTP
router.post("/unique-otp/regenerate", userController.updateUniqueOtp);
router.put("/unique-otp", userController.updateUniqueOtp);
router.patch("/unique-otp", userController.updateUniqueOtp);

// Saved Places
router.get("/saved-places", userController.getSavedPlaces);
router.put("/saved-places", userController.updateSavedPlaces);

// Emergency Contacts & Safety
router.get("/emergency-contacts", userController.getEmergencyContacts);
router.put("/emergency-contacts", userController.updateEmergencyContacts);

// Referral System
router.get("/referral-code", userController.getReferralCode);
router.post("/referral/apply", userController.applyReferralCode);

// Support Tickets
router.post("/support-tickets", ticketController.createCustomerTicket);
router.get("/support-tickets", ticketController.getMyTickets);
router.get("/support-tickets/:id", ticketController.getCustomerTicketById);
router.post("/support-tickets/:id/messages", ticketController.addCustomerMessage);

export default router;
