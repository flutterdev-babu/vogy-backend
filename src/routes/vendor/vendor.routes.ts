import { Router } from "express";
import vendorController from "../../controllers/vendor/vendor.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { upload } from "../../middleware/fileUpload";
import ticketController from "../../controllers/cc/ticket.controller";
import vehicleController from "../../controllers/vehicle/vehicle.controller";

const router = Router();

/* ===============================
        VENDOR AUTH ROUTES (Public)
================================ */

// Register vendor
router.post("/auth/register", vendorController.register);

// Login vendor
router.post("/auth/login", vendorController.login);

/* ===============================
        VENDOR PROTECTED ROUTES
================================ */

// All routes below require VENDOR authentication
router.use(authMiddleware(["VENDOR"]));

// Dashboard
router.get("/dashboard", vendorController.getDashboard);

// Profile management
router.get("/profile", vendorController.getProfile);
router.put("/profile", vendorController.updateProfile);
router.patch("/profile", vendorController.updateProfile);

// Vendor-specific listings (scoped to self)
router.get("/vehicles", vendorController.getVendorVehicles);
router.post("/vehicles", vehicleController.createVehicle);
router.get("/partners", vendorController.getVendorPartners);
router.get("/attachments", vendorController.getVendorAttachmentsList);
router.post("/attachments", vendorController.createAttachment);
router.post("/attachments/upload", upload.single('file'), vendorController.uploadFile);

// Rides
router.get("/rides", vendorController.getVendorRides);
router.get("/rides/:id", vendorController.getVendorRideDetail);

// Earnings
router.get("/earnings", vendorController.getVendorEarningsSummary);

// Analytics
router.get("/analytics", vendorController.getVendorAnalytics);

// Support System
router.get("/support/tickets", ticketController.getMyTickets);
router.post("/support/tickets", ticketController.createCustomerTicket);
router.get("/support/tickets/:id", ticketController.getCustomerTicketById);
router.post("/support/tickets/:id/messages", ticketController.addCustomerMessage);

export default router;
