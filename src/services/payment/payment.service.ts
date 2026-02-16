import { prisma } from "../../config/prisma";
import { getRazorpayInstance } from "../../config/razorpay";
import crypto from "crypto";

/**
 * Creates a Razorpay order for a specific ride
 */
export const createRazorpayOrder = async (rideId: string) => {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
  });

  if (!ride) {
    throw new Error("Ride not found");
  }

  if (!ride.totalFare) {
    throw new Error("Ride total fare not calculated");
  }

  const options = {
    amount: Math.round(ride.totalFare * 100), // amount in the smallest currency unit (paise for INR)
    currency: "INR",
    receipt: `receipt_ride_${ride.id}`,
  };

  try {
    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create(options);

    // Update ride with order ID
    await prisma.ride.update({
      where: { id: ride.id },
      data: {
        razorpayOrderId: order.id,
      },
    });

    return order;
  } catch (error: any) {
    console.error("Razorpay Order Creation Error:", error);
    throw new Error(error.message || "Failed to create Razorpay order");
  }
};

/**
 * Verifies Razorpay payment signature and updates ride payment status
 */
export const verifyRazorpayPayment = async (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
) => {
  const secret = process.env.RAZORPAY_KEY_SECRET || "";
  
  const body = razorpayOrderId + "|" + razorpayPaymentId;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body.toString())
    .digest("hex");

  const isAuthentic = expectedSignature === razorpaySignature;

  if (isAuthentic) {
    // Payment is successful
    const ride = await prisma.ride.findFirst({
      where: { razorpayOrderId: razorpayOrderId },
    });

    if (!ride) {
      throw new Error("Ride not found for this order");
    }

    await prisma.ride.update({
      where: { id: ride.id },
      data: {
        razorpayPaymentId: razorpayPaymentId,
        razorpaySignature: razorpaySignature,
        paymentStatus: "COMPLETED",
      },
    });

    return { success: true, message: "Payment verified successfully" };
  } else {
    throw new Error("Invalid signature, payment verification failed");
  }
};
