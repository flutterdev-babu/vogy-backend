import { Router } from "express";
import partnerController from "../../controllers/partner/partner.controller";
import rideController from "../../controllers/ride/ride.controller";
import ticketController from "../../controllers/cc/ticket.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

/* ===============================
        PARTNER AUTH ROUTES (Public)
================================ */

// Register partner
router.post("/auth/register", partnerController.register);

// Login partner
router.post("/auth/login", partnerController.login);

/* ===============================
        PARTNER PROTECTED ROUTES
================================ */

// All routes below require PARTNER authentication
router.use(authMiddleware(["PARTNER"]));

// Dashboard
router.get("/dashboard", partnerController.getDashboard);

// Profile management
router.get("/profile", partnerController.getProfile);
router.put("/profile", partnerController.updateProfile);
router.patch("/profile", partnerController.updateProfile);

// Location management
router.put("/location", partnerController.updateLocation);
router.patch("/location", partnerController.updateLocation);

// Online status
router.put("/online-status", partnerController.toggleOnlineStatus);
router.patch("/online-status", partnerController.toggleOnlineStatus);

// Vehicle info
router.get("/vehicle", partnerController.getVehicleInfo);

// Rides - available must come before :id to avoid conflict
router.get("/rides/available", partnerController.getAvailableRides);
router.get("/rides", partnerController.getPartnerRides);
router.get("/rides/:id", partnerController.getPartnerRideDetail);

// Ride actions (accept, status update)
router.post("/rides/:id/accept", rideController.acceptRide);
router.patch("/rides/:id/status", rideController.updateRideStatus);
router.put("/rides/:id/status", rideController.updateRideStatus);

// Earnings
router.get("/earnings", partnerController.getPartnerEarningsSummary);

// Analytics
router.get("/analytics", partnerController.getPartnerAnalytics);

// Documents (KYC documents view)
router.get("/documents", partnerController.getPartnerDocuments);

// Attachments
router.post("/attachments", partnerController.createAttachment);

// Notifications (Inbox)
router.get("/notifications", partnerController.getNotifications);
router.put("/notifications/:id/read", partnerController.markNotificationAsRead);
router.patch("/notifications/:id/read", partnerController.markNotificationAsRead);

// Support Tickets
router.post("/support-tickets", ticketController.createCustomerTicket);
router.get("/support-tickets", ticketController.getMyTickets);
router.get("/support-tickets/:id", ticketController.getCustomerTicketById);
router.post("/support-tickets/:id/messages", ticketController.addCustomerMessage);

// Notifications
router.get("/notifications", partnerController.getNotifications);
router.put("/notifications/:id/read", partnerController.markNotificationAsRead);
router.patch("/notifications/:id/read", partnerController.markNotificationAsRead);

export default router;

