"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRazorpayPayment = exports.createRazorpayOrder = void 0;
const prisma_1 = require("../../config/prisma");
const razorpay_1 = require("../../config/razorpay");
const crypto_1 = __importDefault(require("crypto"));
/**
 * Creates a Razorpay order for a specific ride
 */
const createRazorpayOrder = async (rideId) => {
    const ride = await prisma_1.prisma.ride.findUnique({
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
        const razorpay = (0, razorpay_1.getRazorpayInstance)();
        const order = await razorpay.orders.create(options);
        // Update ride with order ID
        await prisma_1.prisma.ride.update({
            where: { id: ride.id },
            data: {
                razorpayOrderId: order.id,
            },
        });
        return order;
    }
    catch (error) {
        console.error("Razorpay Order Creation Error:", error);
        throw new Error(error.message || "Failed to create Razorpay order");
    }
};
exports.createRazorpayOrder = createRazorpayOrder;
/**
 * Verifies Razorpay payment signature and updates ride payment status
 */
const verifyRazorpayPayment = async (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
    const secret = process.env.RAZORPAY_KEY_SECRET || "";
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto_1.default
        .createHmac("sha256", secret)
        .update(body.toString())
        .digest("hex");
    const isAuthentic = expectedSignature === razorpaySignature;
    if (isAuthentic) {
        // Payment is successful
        const ride = await prisma_1.prisma.ride.findFirst({
            where: { razorpayOrderId: razorpayOrderId },
        });
        if (!ride) {
            throw new Error("Ride not found for this order");
        }
        await prisma_1.prisma.ride.update({
            where: { id: ride.id },
            data: {
                razorpayPaymentId: razorpayPaymentId,
                razorpaySignature: razorpaySignature,
                paymentStatus: "COMPLETED",
            },
        });
        return { success: true, message: "Payment verified successfully" };
    }
    else {
        throw new Error("Invalid signature, payment verification failed");
    }
};
exports.verifyRazorpayPayment = verifyRazorpayPayment;
