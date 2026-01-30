import { prisma } from "../../config/prisma";
import { PaymentMode, PaymentStatus } from "@prisma/client";

/* ============================================
    CREATE BILLING FOR CORPORATE
============================================ */
export const createBilling = async (
  corporateId: string,
  billingPeriodStart: Date,
  billingPeriodEnd: Date
) => {
  // Validate corporate
  const corporate = await prisma.corporate.findUnique({
    where: { id: corporateId },
  });

  if (!corporate) throw new Error("Corporate not found");

  // Calculate total amount from rides in the billing period
  const ridesInPeriod = await prisma.ride.aggregate({
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
  const billing = await prisma.corporateBilling.create({
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

/* ============================================
    RECORD PAYMENT
============================================ */
export const recordPayment = async (
  corporateId: string,
  amount: number,
  paymentMode: PaymentMode,
  transactionId?: string,
  notes?: string
) => {
  // Validate corporate
  const corporate = await prisma.corporate.findUnique({
    where: { id: corporateId },
  });

  if (!corporate) throw new Error("Corporate not found");

  // Create payment record
  const payment = await prisma.corporatePayment.create({
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

  await prisma.corporate.update({
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

/* ============================================
    UPDATE BILLING PAYMENTS (Helper)
============================================ */
const updateBillingPayments = async (corporateId: string, paymentAmount: number) => {
  // Get outstanding billings ordered by period end (oldest first)
  const outstandingBillings = await prisma.corporateBilling.findMany({
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
    if (remainingAmount <= 0) break;

    const outstandingAmount = billing.totalAmount - billing.paidAmount;
    const paymentForThisBilling = Math.min(remainingAmount, outstandingAmount);

    const newPaidAmount = billing.paidAmount + paymentForThisBilling;
    const newStatus: PaymentStatus = 
      newPaidAmount >= billing.totalAmount ? "COMPLETED" : "PARTIAL";

    await prisma.corporateBilling.update({
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
export const getOutstandingPayments = async (corporateId?: string) => {
  const where: any = {
    status: { in: ["PENDING", "PARTIAL"] },
  };

  if (corporateId) {
    where.corporateId = corporateId;
  }

  const billings = await prisma.corporateBilling.findMany({
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
  const totalOutstanding = billingsWithOutstanding.reduce(
    (sum, b) => sum + b.outstandingAmount,
    0
  );

  return {
    billings: billingsWithOutstanding,
    totalOutstanding,
    count: billings.length,
  };
};

/* ============================================
    GET PAYMENT HISTORY
============================================ */
export const getPaymentHistory = async (corporateId?: string, filters?: {
  startDate?: Date;
  endDate?: Date;
  paymentMode?: PaymentMode;
}) => {
  const where: any = {};

  if (corporateId) {
    where.corporateId = corporateId;
  }

  if (filters?.paymentMode) {
    where.paymentMode = filters.paymentMode;
  }

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  const payments = await prisma.corporatePayment.findMany({
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

/* ============================================
    GET BILLING SUMMARY
============================================ */
export const getBillingSummary = async (corporateId: string) => {
  const corporate = await prisma.corporate.findUnique({
    where: { id: corporateId },
    select: {
      id: true,
      companyName: true,
      creditLimit: true,
      creditUsed: true,
      creditBalance: true,
    },
  });

  if (!corporate) throw new Error("Corporate not found");

  // Get billing stats
  const billingStats = await prisma.corporateBilling.aggregate({
    where: { corporateId },
    _sum: {
      totalAmount: true,
      paidAmount: true,
    },
    _count: true,
  });

  // Get outstanding count
  const outstandingCount = await prisma.corporateBilling.count({
    where: {
      corporateId,
      status: { in: ["PENDING", "PARTIAL"] },
    },
  });

  // Get payment stats
  const paymentStats = await prisma.corporatePayment.aggregate({
    where: { corporateId },
    _sum: {
      amount: true,
    },
    _count: true,
  });

  // Get ride stats
  const rideStats = await prisma.ride.aggregate({
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

/* ============================================
    GET ALL BILLINGS
============================================ */
export const getAllBillings = async (filters?: {
  corporateId?: string;
  status?: PaymentStatus;
  startDate?: Date;
  endDate?: Date;
}) => {
  const where: any = {};

  if (filters?.corporateId) {
    where.corporateId = filters.corporateId;
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.startDate || filters?.endDate) {
    where.billingPeriodEnd = {};
    if (filters.startDate) where.billingPeriodEnd.gte = filters.startDate;
    if (filters.endDate) where.billingPeriodEnd.lte = filters.endDate;
  }

  const billings = await prisma.corporateBilling.findMany({
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

/* ============================================
    GET BILLING BY ID
============================================ */
export const getBillingById = async (billingId: string) => {
  const billing = await prisma.corporateBilling.findUnique({
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

  if (!billing) throw new Error("Billing not found");

  // Get rides for this billing period
  const rides = await prisma.ride.findMany({
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
