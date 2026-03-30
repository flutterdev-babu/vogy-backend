import { Response } from "express";
import { AuthedRequest } from "../../middleware/auth.middleware";
import * as paymentService from "../../services/ride/payment.service";

export default {
  /* ============================================
      INITIATE PAYMENT INTENT (Step 1)
  ============================================ */
  initiateIntent: async (req: AuthedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const { amount, idempotencyKey, rideDetails } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      if (!amount || !idempotencyKey) {
        return res.status(400).json({ success: false, message: "Amount and idempotencyKey are required" });
      }

      const intent = await paymentService.initiatePaymentIntent(userId, {
        amount: parseFloat(amount),
        idempotencyKey,
        rideDetails: rideDetails || {},
      });

      return res.status(200).json({
        success: true,
        message: "Payment intent initiated",
        data: intent,
      });
    } catch (error: any) {
      console.error("Initiate Intent Error:", error);
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to initiate payment intent",
      });
    }
  },

  /* ============================================
      VERIFY UPI PAYMENT (Step 2)
  ============================================ */
  verifyPayment: async (req: AuthedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const { verificationId, transactionId } = req.body;
      const ip = (req.headers["x-forwarded-for"] as string) || req.ip;
      const userAgent = req.headers["user-agent"];

      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      if (!verificationId || !transactionId) {
        return res.status(400).json({
          success: false,
          message: "Verification ID and Transaction ID are required",
        });
      }

      // Strong validation for transaction ID format (Ship+ Polish)
      if (transactionId.length < 8 || !/^[a-zA-Z0-9]+$/.test(transactionId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Transaction ID format. Must be alphanumeric and at least 8 characters.",
        });
      }

      const verification = await paymentService.verifyPaymentIntent(userId, verificationId, transactionId, {
        ip,
        userAgent,
      });

      return res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        data: verification,
      });
    } catch (error: any) {
      console.error("Payment Verification Error:", error);

      // Record failed attempt for fraud guard
      if (req.user?.id) {
        await paymentService.recordFailedAttempt(req.user.id, req.headers["x-forwarded-for"] as string || req.ip);
      }

      return res.status(400).json({
        success: false,
        message: error.message || "Failed to verify payment",
      });
    }
  },

  /* ============================================
      GET ACTIVE INTENT (Recovery)
  ============================================ */
  getActiveIntent: async (req: AuthedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const intent = await paymentService.getActiveIntent(userId);

      return res.status(200).json({
        success: true,
        data: intent,
      });
    } catch (error: any) {
      console.error("Get Active Intent Error:", error);
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch active intent",
      });
    }
  },
};
