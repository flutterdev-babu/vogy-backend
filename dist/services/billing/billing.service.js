"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBillingById = exports.getAllBillings = exports.getBillingSummary = exports.getPaymentHistory = exports.getOutstandingPayments = exports.recordPayment = exports.createBilling = void 0;
const prisma_1 = require("../../config/prisma");
/* ============================================
    CREATE BILLING FOR CORPORATE
============================================ */
const createBilling = async (corporateId, billingPeriodStart, billingPeriodEnd) => {
    // Validate corporate
    const corporate = await prisma_1.prisma.corporate.findUnique({
        where: { id: corporateId },
    });
    if (!corporate)
        throw new Error("Corporate not found");
    // Calculate total amount from rides in the billing period
    const ridesInPeriod = await prisma_1.prisma.ride.aggregate({
        where: {
            corporateId,
            createdAt: {
                gte: billingPeriodStart,
                lte: billingPeriodEnd,
            },
            status: "COMPLETED",
            paymentMode: "CREDIT",
        },
        _sum: {
            totalFare: true,
        },
        _count: true,
    });
    const totalAmount = ridesInPeriod._sum.totalFare || 0;
    if (totalAmount === 0) {
        throw new Error("No completed credit rides found in the billing period");
    }
    // Create billing record
    const billing = await prisma_1.prisma.corporateBilling.create({
        data: {
            corporateId,
            billingPeriodStart,
            billingPeriodEnd,
            totalAmount,
        },
        include: {
            corporate: {
                select: {
                    id: true,
                    companyName: true,
                    contactPerson: true,
                    email: true,
                },
            },
        },
    });
    return {
        ...billing,
        rideCount: ridesInPeriod._count,
    };
};
exports.createBilling = createBilling;
/* ============================================
    RECORD PAYMENT
============================================ */
const recordPayment = async (corporateId, amount, paymentMode, transactionId, notes) => {
    // Validate corporate
    const corporate = await prisma_1.prisma.corporate.findUnique({
        where: { id: corporateId },
    });
    if (!corporate)
        throw new Error("Corporate not found");
    // Create payment record
    const payment = await prisma_1.prisma.corporatePayment.create({
        data: {
            corporateId,
            amount,
            paymentMode,
            transactionId: transactionId || null,
            notes: notes || null,
        },
        include: {
            corporate: {
                select: {
                    id: true,
                    companyName: true,
                },
            },
        },
    });
    // Update corporate credit balance
    const newCreditUsed = Math.max(0, corporate.creditUsed - amount);
    const newCreditBalance = corporate.creditLimit - newCreditUsed;
    await prisma_1.prisma.corporate.update({
        where: { id: corporateId },
        data: {
            creditUsed: newCreditUsed,
            creditBalance: newCreditBalance > 0 ? newCreditBalance : 0,
        },
    });
    // Update outstanding billings (FIFO order)
    await updateBillingPayments(corporateId, amount);
    return payment;
};
exports.recordPayment = recordPayment;
/* ============================================
    UPDATE BILLING PAYMENTS (Helper)
============================================ */
const updateBillingPayments = async (corporateId, paymentAmount) => {
    // Get outstanding billings ordered by period end (oldest first)
    const outstandingBillings = await prisma_1.prisma.corporateBilling.findMany({
        where: {
            corporateId,
            status: { in: ["PENDING", "PARTIAL"] },
        },
        orderBy: {
            billingPeriodEnd: "asc",
        },
    });
    let remainingAmount = paymentAmount;
    for (const billing of outstandingBillings) {
        if (remainingAmount <= 0)
            break;
        const outstandingAmount = billing.totalAmount - billing.paidAmount;
        const paymentForThisBilling = Math.min(remainingAmount, outstandingAmount);
        const newPaidAmount = billing.paidAmount + paymentForThisBilling;
        const newStatus = newPaidAmount >= billing.totalAmount ? "COMPLETED" : "PARTIAL";
        await prisma_1.prisma.corporateBilling.update({
            where: { id: billing.id },
            data: {
                paidAmount: newPaidAmount,
                status: newStatus,
            },
        });
        remainingAmount -= paymentForThisBilling;
    }
};
/* ============================================
    GET OUTSTANDING PAYMENTS
============================================ */
const getOutstandingPayments = async (corporateId) => {
    const where = {
        status: { in: ["PENDING", "PARTIAL"] },
    };
    if (corporateId) {
        where.corporateId = corporateId;
    }
    const billings = await prisma_1.prisma.corporateBilling.findMany({
        where,
        include: {
            corporate: {
                select: {
                    id: true,
                    companyName: true,
                    contactPerson: true,
                    phone: true,
                    email: true,
                },
            },
        },
        orderBy: {
            billingPeriodEnd: "asc",
        },
    });
    // Calculate outstanding amount for each billing
    const billingsWithOutstanding = billings.map((billing) => ({
        ...billing,
        outstandingAmount: billing.totalAmount - billing.paidAmount,
    }));
    // Calculate totals
    const totalOutstanding = billingsWithOutstanding.reduce((sum, b) => sum + b.outstandingAmount, 0);
    return {
        billings: billingsWithOutstanding,
        totalOutstanding,
        count: billings.length,
    };
};
exports.getOutstandingPayments = getOutstandingPayments;
/* ============================================
    GET PAYMENT HISTORY
============================================ */
const getPaymentHistory = async (corporateId, filters) => {
    const where = {};
    if (corporateId) {
        where.corporateId = corporateId;
    }
    if (filters?.paymentMode) {
        where.paymentMode = filters.paymentMode;
    }
    if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate)
            where.createdAt.gte = filters.startDate;
        if (filters.endDate)
            where.createdAt.lte = filters.endDate;
    }
    const payments = await prisma_1.prisma.corporatePayment.findMany({
        where,
        include: {
            corporate: {
                select: {
                    id: true,
                    companyName: true,
                    contactPerson: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    // Calculate total
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    return {
        payments,
        totalAmount,
        count: payments.length,
    };
};
exports.getPaymentHistory = getPaymentHistory;
/* ============================================
    GET BILLING SUMMARY
============================================ */
const getBillingSummary = async (corporateId) => {
    const corporate = await prisma_1.prisma.corporate.findUnique({
        where: { id: corporateId },
        select: {
            id: true,
            companyName: true,
            creditLimit: true,
            creditUsed: true,
            creditBalance: true,
        },
    });
    if (!corporate)
        throw new Error("Corporate not found");
    // Get billing stats
    const billingStats = await prisma_1.prisma.corporateBilling.aggregate({
        where: { corporateId },
        _sum: {
            totalAmount: true,
            paidAmount: true,
        },
        _count: true,
    });
    // Get outstanding count
    const outstandingCount = await prisma_1.prisma.corporateBilling.count({
        where: {
            corporateId,
            status: { in: ["PENDING", "PARTIAL"] },
        },
    });
    // Get payment stats
    const paymentStats = await prisma_1.prisma.corporatePayment.aggregate({
        where: { corporateId },
        _sum: {
            amount: true,
        },
        _count: true,
    });
    // Get ride stats
    const rideStats = await prisma_1.prisma.ride.aggregate({
        where: { corporateId, status: "COMPLETED" },
        _sum: {
            totalFare: true,
        },
        _count: true,
    });
    return {
        corporate,
        billing: {
            totalBilled: billingStats._sum.totalAmount || 0,
            totalPaid: billingStats._sum.paidAmount || 0,
            outstandingAmount: (billingStats._sum.totalAmount || 0) - (billingStats._sum.paidAmount || 0),
            totalBillings: billingStats._count,
            outstandingBillings: outstandingCount,
        },
        payments: {
            totalPayments: paymentStats._sum.amount || 0,
            paymentCount: paymentStats._count,
        },
        rides: {
            totalRides: rideStats._count,
            totalFare: rideStats._sum.totalFare || 0,
        },
    };
};
exports.getBillingSummary = getBillingSummary;
/* ============================================
    GET ALL BILLINGS
============================================ */
const getAllBillings = async (filters) => {
    const where = {};
    if (filters?.corporateId) {
        where.corporateId = filters.corporateId;
    }
    if (filters?.status) {
        where.status = filters.status;
    }
    if (filters?.startDate || filters?.endDate) {
        where.billingPeriodEnd = {};
        if (filters.startDate)
            where.billingPeriodEnd.gte = filters.startDate;
        if (filters.endDate)
            where.billingPeriodEnd.lte = filters.endDate;
    }
    const billings = await prisma_1.prisma.corporateBilling.findMany({
        where,
        include: {
            corporate: {
                select: {
                    id: true,
                    companyName: true,
                    contactPerson: true,
                    phone: true,
                    email: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    return billings.map((billing) => ({
        ...billing,
        outstandingAmount: billing.totalAmount - billing.paidAmount,
    }));
};
exports.getAllBillings = getAllBillings;
/* ============================================
    GET BILLING BY ID
============================================ */
const getBillingById = async (billingId) => {
    const billing = await prisma_1.prisma.corporateBilling.findUnique({
        where: { id: billingId },
        include: {
            corporate: {
                select: {
                    id: true,
                    companyName: true,
                    contactPerson: true,
                    phone: true,
                    email: true,
                    address: true,
                    gstNumber: true,
                },
            },
        },
    });
    if (!billing)
        throw new Error("Billing not found");
    // Get rides for this billing period
    const rides = await prisma_1.prisma.ride.findMany({
        where: {
            corporateId: billing.corporateId,
            createdAt: {
                gte: billing.billingPeriodStart,
                lte: billing.billingPeriodEnd,
            },
            status: "COMPLETED",
            paymentMode: "CREDIT",
        },
        select: {
            id: true,
            pickupAddress: true,
            dropAddress: true,
            distanceKm: true,
            totalFare: true,
            createdAt: true,
        },
        orderBy: {
            createdAt: "asc",
        },
    });
    return {
        ...billing,
        outstandingAmount: billing.totalAmount - billing.paidAmount,
        rides,
        rideCount: rides.length,
    };
};
exports.getBillingById = getBillingById;
