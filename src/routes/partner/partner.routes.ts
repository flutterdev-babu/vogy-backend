import { Router } from "express";
import partnerController from "../../controllers/partner/partner.controller";
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

// Own rides
router.get("/rides", partnerController.getPartnerRides);

// Analytics
router.get("/analytics", partnerController.getPartnerAnalytics);

// Attachments
router.post("/attachments", partnerController.createAttachment);

export default router;
