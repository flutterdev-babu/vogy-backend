import { prisma } from "../../config/prisma";
import { PaymentStatus, AuditAction } from "@prisma/client";

/* ============================================
    CONSTANTS & TYPES
============================================ */
const INTENT_EXPIRY_MINS = 15;
const FRAUD_THRESHOLD = 5;
const FRAUD_COOLDOWN_MINS = 15;

export interface PaymentIntentData {
  amount: number;
  idempotencyKey: string;
  rideDetails: any;
}

/* ============================================
    AUDIT LOGGING UTILITY
============================================ */
export const logPaymentAudit = async (data: {
  userId: string;
  action: AuditAction;
  transactionId?: string;
  entityId?: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  newData?: any;
}) => {
  try {
    await (prisma as any).auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        module: "PAYMENT",
        entityId: data.entityId,
        transactionId: data.transactionId,
        description: data.description,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        newData: data.newData,
      },
    });
  } catch (err) {
    console.error("Failed to create audit log:", err);
  }
};

/* ============================================
    JIT CLEANUP (Expired Intents)
============================================ */
export const cleanupExpiredIntents = async (userId: string) => {
  const now = new Date();
  await (prisma as any).paymentVerification.updateMany({
    where: {
      userId,
      status: PaymentStatus.PENDING,
      expiresAt: { lt: now },
    },
    data: { status: PaymentStatus.EXPIRED },
  });
};

/* ============================================
    FRAUD CHECK
============================================ */
export const checkFraudLock = async (userId: string, ipAddress?: string) => {
  const now = new Date();
  const fraudLog = await (prisma as any).fraudLog.findFirst({
    where: {
      OR: [{ userId }, { ipAddress }],
      lockedUntil: { gt: now },
    },
  });

  if (fraudLog) {
    const minutesLeft = Math.ceil((fraudLog.lockedUntil.getTime() - now.getTime()) / 60000);
    throw new Error(`Too many attempts. For your security, payment verification is blocked for ${minutesLeft} minutes.`);
  }
};

export const recordFailedAttempt = async (userId: string, ipAddress?: string) => {
  const log = await (prisma as any).fraudLog.findFirst({
    where: { OR: [{ userId }, { ipAddress }] },
  });

  if (!log) {
    await (prisma as any).fraudLog.create({
      data: { userId, ipAddress, attemptCount: 1 },
    });
    return;
  }

  const newCount = log.attemptCount + 1;
  if (newCount >= FRAUD_THRESHOLD) {
    const lockedUntil = new Date(Date.now() + FRAUD_COOLDOWN_MINS * 60000);
    await (prisma as any).fraudLog.update({
      where: { id: log.id },
      data: { attemptCount: 0, lockedUntil }, // Reset count but lock
    });
  } else {
    await (prisma as any).fraudLog.update({
      where: { id: log.id },
      data: { attemptCount: newCount },
    });
  }
};

/* ============================================
    PAYMENT INTENT LOGIC
============================================ */
export const initiatePaymentIntent = async (userId: string, data: PaymentIntentData) => {
  // 1. JIT Cleanup
  await cleanupExpiredIntents(userId);

  // 2. Fraud Check
  await checkFraudLock(userId);

  // 3. Check for existing PENDING/VERIFIED intent (Single Intent Guarantee)
  const existingIntent = await (prisma as any).paymentVerification.findFirst({
    where: {
      userId,
      status: { in: [PaymentStatus.PENDING, PaymentStatus.VERIFIED] },
      rides: { none: {} }, // Not yet linked to any ride
    },
    orderBy: { createdAt: "desc" },
  });

  if (existingIntent) {
    // If it's the SAME idempotency key, just return it
    if (existingIntent.idempotencyKey === data.idempotencyKey) {
      return existingIntent;
    }
    // If it's a different one but still pending, return the existing one (Single Intent Guarantee)
    return existingIntent;
  }

  // 4. Create new intent
  const expiresAt = new Date(Date.now() + INTENT_EXPIRY_MINS * 60000);
  return await (prisma as any).paymentVerification.create({
    data: {
      userId,
      amount: data.amount,
      idempotencyKey: data.idempotencyKey,
      rideDetails: data.rideDetails,
      expiresAt,
      status: PaymentStatus.PENDING,
    },
  });
};

/* ============================================
    VERIFICATION LOGIC
============================================ */
export const verifyPaymentIntent = async (
  userId: string,
  verificationId: string,
  transactionId: string,
  context: { ip?: string; userAgent?: string }
) => {
  // 1. Fraud Check
  await checkFraudLock(userId, context.ip);

  // 2. Fetch intent
  const intent = await (prisma as any).paymentVerification.findUnique({
    where: { id: verificationId },
  });

  if (!intent) throw new Error("Payment intent not found");
  if (intent.userId !== userId) throw new Error("Unauthorized");

  // 3. JIT Check Expiry
  if (intent.status === PaymentStatus.PENDING && new Date() > intent.expiresAt) {
    await (prisma as any).paymentVerification.update({
      where: { id: verificationId },
      data: { status: PaymentStatus.EXPIRED },
    });
    throw new Error("Payment window has expired. Please start a new booking.");
  }

  // 4. Handle Idempotency (Already verified)
  if (intent.status === PaymentStatus.VERIFIED || intent.status === PaymentStatus.LINKED) {
    // If it's the same transaction ID, it's a duplicate success
    if (intent.transactionId === transactionId) {
      return intent;
    }
    throw new Error("This payment has already been verified or linked.");
  }

  // 5. Adaptive Tolerance Check (Ship+)
  // User provided transactionId, now we "verify" loosely for now (simulating manual check)
  // In a real system, we might hit a Bank API here.
  // For manual UPI, we enforce UI length and basic format (handled by controller/schema)

  // 6. Atomic Update (Race Condition Protection)
  const updated = await (prisma as any).paymentVerification.updateMany({
    where: {
      id: verificationId,
      status: PaymentStatus.PENDING,
    },
    data: {
      status: PaymentStatus.VERIFIED,
      transactionId,
    },
  });

  if (updated.count === 0) {
    // Someone else updated it or it expired mid-request
    const reFetch = await (prisma as any).paymentVerification.findUnique({ where: { id: verificationId } });
    if (reFetch.status === PaymentStatus.VERIFIED && reFetch.transactionId === transactionId) {
      return reFetch; // Idempotent success
    }
    throw new Error("Conflict: Payment could not be verified. It may have expired or already been processed.");
  }

  const verifiedIntent = await (prisma as any).paymentVerification.findUnique({ where: { id: verificationId } });

  // 7. Audit Logging
  await logPaymentAudit({
    userId,
    action: AuditAction.UPDATE,
    transactionId,
    entityId: verificationId,
    description: `Payment VERIFIED for amount ${intent.amount}`,
    ipAddress: context.ip,
    userAgent: context.userAgent,
    newData: { status: "VERIFIED" },
  });

  return verifiedIntent;
};

/* ============================================
    GET ACTIVE INTENT (Recovery)
============================================ */
export const getActiveIntent = async (userId: string) => {
  await cleanupExpiredIntents(userId);

  return await (prisma as any).paymentVerification.findFirst({
    where: {
      userId,
      status: { in: [PaymentStatus.PENDING, PaymentStatus.VERIFIED] },
      rides: { none: {} },
    },
    orderBy: { createdAt: "desc" },
  });
};
