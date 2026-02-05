"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPayment = exports.createOrder = void 0;
const payment_service_1 = require("../../services/payment/payment.service");
const createOrder = async (req, res) => {
    try {
        const { rideId } = req.body;
        if (!rideId) {
            return res.status(400).json({ success: false, message: "Ride ID is required" });
        }
        const order = await (0, payment_service_1.createRazorpayOrder)(rideId);
        return res.status(200).json({ success: true, data: order });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.createOrder = createOrder;
const verifyPayment = async (req, res) => {
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({
                success: false,
                message: "razorpayOrderId, razorpayPaymentId, and razorpaySignature are required"
            });
        }
        const result = await (0, payment_service_1.verifyRazorpayPayment)(razorpayOrderId, razorpayPaymentId, razorpaySignature);
        return res.status(200).json(result);
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.verifyPayment = verifyPayment;
exports.default = {
    createOrder: exports.createOrder,
    verifyPayment: exports.verifyPayment,
};
