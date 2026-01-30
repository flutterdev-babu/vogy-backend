import { Response } from "express";
import { AuthedRequest } from "../../middleware/auth.middleware";
import * as billingService from "../../services/billing/billing.service";

export default {
  /* ============================================
      BILLING MANAGEMENT
  ============================================ */

  async createBilling(req: AuthedRequest, res: Response) {
    try {
      const { corporateId, billingPeriodStart, billingPeriodEnd } = req.body;
      
      if (!corporateId || !billingPeriodStart || !billingPeriodEnd) {
        return res.status(400).json({
          success: false,
          message: "corporateId, billingPeriodStart, and billingPeriodEnd are required",
        });
      }

      const billing = await billingService.createBilling(
        corporateId,
        new Date(billingPeriodStart),
        new Date(billingPeriodEnd)
      );
      res.status(201).json({ success: true, data: billing });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async recordPayment(req: AuthedRequest, res: Response) {
    try {
      const { corporateId, amount, paymentMode, transactionId, notes } = req.body;
      
      if (!corporateId || amount === undefined || !paymentMode) {
        return res.status(400).json({
          success: false,
          message: "corporateId, amount, and paymentMode are required",
        });
      }

      const payment = await billingService.recordPayment(
        corporateId,
        amount,
        paymentMode,
        transactionId,
        notes
      );
      res.status(201).json({ success: true, data: payment });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async getOutstandingPayments(req: AuthedRequest, res: Response) {
    try {
      const { corporateId } = req.query;
      const result = await billingService.getOutstandingPayments(corporateId as string);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getPaymentHistory(req: AuthedRequest, res: Response) {
    try {
      const { corporateId, startDate, endDate, paymentMode } = req.query;
      const result = await billingService.getPaymentHistory(corporateId as string, {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        paymentMode: paymentMode as any,
      });
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getBillingSummary(req: AuthedRequest, res: Response) {
    try {
      const { corporateId } = req.params;
      const summary = await billingService.getBillingSummary(corporateId);
      res.json({ success: true, data: summary });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getAllBillings(req: AuthedRequest, res: Response) {
    try {
      const { corporateId, status, startDate, endDate } = req.query;
      const billings = await billingService.getAllBillings({
        corporateId: corporateId as string,
        status: status as any,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });
      res.json({ success: true, data: billings });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getBillingById(req: AuthedRequest, res: Response) {
    try {
      const billing = await billingService.getBillingById(req.params.id);
      res.json({ success: true, data: billing });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message });
    }
  },
};
