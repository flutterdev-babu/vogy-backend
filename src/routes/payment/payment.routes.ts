import { Router } from "express";
import paymentController from "../../controllers/payment/payment.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

// Create Razorpay order
router.post("/create-order", authMiddleware(["USER"]), paymentController.createOrder);

// Verify Razorpay payment
router.post("/verify-payment", authMiddleware(["USER"]), paymentController.verifyPayment);

export default router;
