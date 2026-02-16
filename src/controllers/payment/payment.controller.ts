import { Request, Response } from "express";
import { createRazorpayOrder, verifyRazorpayPayment } from "../../services/payment/payment.service";

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { rideId } = req.body;
    if (!rideId) {
      return res.status(400).json({ success: false, message: "Ride ID is required" });
    }

    const order = await createRazorpayOrder(rideId);
    return res.status(200).json({ success: true, data: order });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ 
        success: false, 
        message: "razorpayOrderId, razorpayPaymentId, and razorpaySignature are required" 
      });
    }

    const result = await verifyRazorpayPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  createOrder,
  verifyPayment,
};
