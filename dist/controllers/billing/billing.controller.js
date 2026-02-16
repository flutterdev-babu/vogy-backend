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
const billingService = __importStar(require("../../services/billing/billing.service"));
exports.default = {
    /* ============================================
        BILLING MANAGEMENT
    ============================================ */
    async createBilling(req, res) {
        try {
            const { corporateId, billingPeriodStart, billingPeriodEnd } = req.body;
            if (!corporateId || !billingPeriodStart || !billingPeriodEnd) {
                return res.status(400).json({
                    success: false,
                    message: "corporateId, billingPeriodStart, and billingPeriodEnd are required",
                });
            }
            const billing = await billingService.createBilling(corporateId, new Date(billingPeriodStart), new Date(billingPeriodEnd));
            res.status(201).json({ success: true, data: billing });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async recordPayment(req, res) {
        try {
            const { corporateId, amount, paymentMode, transactionId, notes } = req.body;
            if (!corporateId || amount === undefined || !paymentMode) {
                return res.status(400).json({
                    success: false,
                    message: "corporateId, amount, and paymentMode are required",
                });
            }
            const payment = await billingService.recordPayment(corporateId, amount, paymentMode, transactionId, notes);
            res.status(201).json({ success: true, data: payment });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    async getOutstandingPayments(req, res) {
        try {
            const { corporateId } = req.query;
            const result = await billingService.getOutstandingPayments(corporateId);
            res.json({ success: true, data: result });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    async getPaymentHistory(req, res) {
        try {
            const { corporateId, startDate, endDate, paymentMode } = req.query;
            const result = await billingService.getPaymentHistory(corporateId, {
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                paymentMode: paymentMode,
            });
            res.json({ success: true, data: result });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    async getBillingSummary(req, res) {
        try {
            const { corporateId } = req.params;
            const summary = await billingService.getBillingSummary(corporateId);
            res.json({ success: true, data: summary });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    async getAllBillings(req, res) {
        try {
            const { corporateId, status, startDate, endDate } = req.query;
            const billings = await billingService.getAllBillings({
                corporateId: corporateId,
                status: status,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
            });
            res.json({ success: true, data: billings });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    async getBillingById(req, res) {
        try {
            const billing = await billingService.getBillingById(req.params.id);
            res.json({ success: true, data: billing });
        }
        catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    },
};
