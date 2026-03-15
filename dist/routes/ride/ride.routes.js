"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ride_controller_1 = __importDefault(require("../../controllers/ride/ride.controller"));
const router = (0, express_1.Router)();
/* ===============================
        COMMON RIDE ROUTES
================================ */
// Validate a coupon before ride booking (Public)
router.post("/validate-coupon", ride_controller_1.default.validateCoupon);
exports.default = router;
