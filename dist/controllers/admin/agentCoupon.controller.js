"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const agentCouponService = __importStar(require("../../services/admin/agentCoupon.service"));
exports.default = {
    createCoupon: async (req, res) => {
        try {
            const { couponCode, description, discountValue, minBookingAmount, maxDiscountAmount, validFrom, validTo, } = req.body;
            if (!couponCode ||
                discountValue === undefined ||
                minBookingAmount === undefined ||
                maxDiscountAmount === undefined ||
                !validFrom ||
                !validTo) {
                return res.status(400).json({
                    success: false,
                    message: "couponCode, discountValue, minBookingAmount, maxDiscountAmount, validFrom, and validTo are all required",
                });
            }
            const coupon = await agentCouponService.createAgentCoupon({
                couponCode,
                description,
                discountValue: parseFloat(discountValue),
                minBookingAmount: parseFloat(minBookingAmount),
                maxDiscountAmount: parseFloat(maxDiscountAmount),
                validFrom: new Date(validFrom),
                validTo: new Date(validTo),
            });
            res.status(201).json({ success: true, data: coupon });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    getAllCoupons: async (req, res) => {
        try {
            const { agentId, isActive } = req.query;
            const filters = {};
            if (agentId)
                filters.agentId = agentId;
            if (isActive !== undefined)
                filters.isActive = isActive === "true";
            const coupons = await agentCouponService.getAllAgentCoupons(filters);
            res.json({ success: true, data: coupons });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    getCouponById: async (req, res) => {
        try {
            const coupon = await agentCouponService.getAgentCouponById(req.params.id);
            res.json({ success: true, data: coupon });
        }
        catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    },
    updateCoupon: async (req, res) => {
        try {
            const { description, discountValue, minBookingAmount, maxDiscountAmount, validFrom, validTo, isActive, } = req.body;
            const updateData = {};
            if (description !== undefined)
                updateData.description = description;
            if (discountValue !== undefined)
                updateData.discountValue = parseFloat(discountValue);
            if (minBookingAmount !== undefined)
                updateData.minBookingAmount = parseFloat(minBookingAmount);
            if (maxDiscountAmount !== undefined)
                updateData.maxDiscountAmount = parseFloat(maxDiscountAmount);
            if (validFrom !== undefined)
                updateData.validFrom = new Date(validFrom);
            if (validTo !== undefined)
                updateData.validTo = new Date(validTo);
            if (isActive !== undefined)
                updateData.isActive = isActive;
            const coupon = await agentCouponService.updateAgentCoupon(req.params.id, updateData);
            res.json({ success: true, data: coupon });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    toggleCouponStatus: async (req, res) => {
        try {
            const { isActive } = req.body;
            if (isActive === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "isActive is required",
                });
            }
            const coupon = await agentCouponService.updateAgentCoupon(req.params.id, { isActive });
            res.json({ success: true, data: coupon });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    deleteCoupon: async (req, res) => {
        try {
            await agentCouponService.deleteAgentCoupon(req.params.id);
            res.json({ success: true, message: "Coupon deleted successfully" });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
};
