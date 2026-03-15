import { Response } from "express";
import { AuthedRequest } from "../../middleware/auth.middleware";
import * as agentCouponService from "../../services/admin/agentCoupon.service";

export default {
  createCoupon: async (req: AuthedRequest, res: Response) => {
    try {
      const {
        couponCode,
        description,
        discountValue,
        minBookingAmount,
        maxDiscountAmount,
        validFrom,
        validTo,
      } = req.body;

      if (
        !couponCode ||
        discountValue === undefined ||
        minBookingAmount === undefined ||
        maxDiscountAmount === undefined ||
        !validFrom ||
        !validTo
      ) {
        return res.status(400).json({
          success: false,
          message:
            "couponCode, discountValue, minBookingAmount, maxDiscountAmount, validFrom, and validTo are all required",
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
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  getAllCoupons: async (req: AuthedRequest, res: Response) => {
    try {
      const { agentId, isActive } = req.query;
      
      const filters: any = {};
      if (agentId) filters.agentId = agentId as string;
      if (isActive !== undefined) filters.isActive = isActive === "true";

      const coupons = await agentCouponService.getAllAgentCoupons(filters);
      res.json({ success: true, data: coupons });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  getCouponById: async (req: AuthedRequest, res: Response) => {
    try {
      const coupon = await agentCouponService.getAgentCouponById(req.params.id);
      res.json({ success: true, data: coupon });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message });
    }
  },

  updateCoupon: async (req: AuthedRequest, res: Response) => {
    try {
      const {
        description,
        discountValue,
        minBookingAmount,
        maxDiscountAmount,
        validFrom,
        validTo,
        isActive,
      } = req.body;

      const updateData: any = {};
      
      if (description !== undefined) updateData.description = description;
      if (discountValue !== undefined) updateData.discountValue = parseFloat(discountValue);
      if (minBookingAmount !== undefined) updateData.minBookingAmount = parseFloat(minBookingAmount);
      if (maxDiscountAmount !== undefined) updateData.maxDiscountAmount = parseFloat(maxDiscountAmount);
      if (validFrom !== undefined) updateData.validFrom = new Date(validFrom);
      if (validTo !== undefined) updateData.validTo = new Date(validTo);
      if (isActive !== undefined) updateData.isActive = isActive;

      const coupon = await agentCouponService.updateAgentCoupon(req.params.id, updateData);
      res.json({ success: true, data: coupon });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  toggleCouponStatus: async (req: AuthedRequest, res: Response) => {
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
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  deleteCoupon: async (req: AuthedRequest, res: Response) => {
    try {
      await agentCouponService.deleteAgentCoupon(req.params.id);
      res.json({ success: true, message: "Coupon deleted successfully" });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },
};
