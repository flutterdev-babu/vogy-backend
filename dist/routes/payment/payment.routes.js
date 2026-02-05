"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = __importDefault(require("../../controllers/payment/payment.controller"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Create Razorpay order
router.post("/create-order", (0, auth_middleware_1.authMiddleware)(["USER"]), payment_controller_1.default.createOrder);
// Verify Razorpay payment
router.post("/verify-payment", (0, auth_middleware_1.authMiddleware)(["USER"]), payment_controller_1.default.verifyPayment);
exports.default = router;
