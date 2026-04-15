/**
 * Ride Expiry Service
 * 
 * Core time-based logic for ride assignment windows.
 * Used by: live-unassigned query, assignment guard, cleanup cron.
 * 
 * DESIGN: Expiry is TIME-BASED (single source of truth).
 * Stored EXPIRED status is secondary (for reporting/history only).
 */

import { prisma } from "../../config/prisma";

// ============================================
// CORE: Effective Pickup Time Calculation
// ============================================

/**
 * Returns the effective pickup time for a ride.
 * Priority: scheduledDateTime > requestedPickupTime > createdAt
 */
export function getEffectivePickupTime(ride: {
  scheduledDateTime?: Date | null;
  requestedPickupTime?: Date | null;
  createdAt: Date;
}): Date {
  if (ride.scheduledDateTime) return new Date(ride.scheduledDateTime);
  if (ride.requestedPickupTime) return new Date(ride.requestedPickupTime);
  return new Date(ride.createdAt);
}

/**
 * Returns the expiry time for a ride (pickup + buffer).
 */
export function getExpiryTime(ride: {
  scheduledDateTime?: Date | null;
  requestedPickupTime?: Date | null;
  createdAt: Date;
}, bufferMinutes: number): Date {
  const pickupTime = getEffectivePickupTime(ride);
  return new Date(pickupTime.getTime() + bufferMinutes * 60 * 1000);
}

/**
 * Checks if a ride has expired based on current time.
 * This is the SINGLE SOURCE OF TRUTH for expiry logic.
 */
export function isRideExpired(ride: {
  scheduledDateTime?: Date | null;
  requestedPickupTime?: Date | null;
  createdAt: Date;
}, bufferMinutes: number): boolean {
  const expiresAt = getExpiryTime(ride, bufferMinutes);
  return new Date() > expiresAt;
}

/**
 * Returns the urgency level for a ride.
 */
export function getUrgencyLevel(ride: {
  scheduledDateTime?: Date | null;
  requestedPickupTime?: Date | null;
  createdAt: Date;
}, bufferMinutes: number): 'GREEN' | 'AMBER' | 'RED' {
  const expiresAt = getExpiryTime(ride, bufferMinutes);
  const now = new Date();
  const remainingMs = expiresAt.getTime() - now.getTime();
  const remainingMinutes = remainingMs / (60 * 1000);

  if (remainingMinutes > 60) return 'GREEN';
  if (remainingMinutes > 30) return 'AMBER';
  return 'RED';
}

// ============================================
// QUERY: Get Live Unassigned Rides
// ============================================

/**
 * Returns only actionable (non-expired, unassigned) rides.
 * Enforces time-based filtering so expired rides NEVER leak through
 * even if the cron hasn't run yet.
 */
export async function getLiveUnassignedRides() {
  // Get the active buffer config
  const config = await prisma.pricingConfig.findFirst({
    where: { isActive: true },
    select: { assignmentBufferMinutes: true },
  });
  const bufferMinutes = config?.assignmentBufferMinutes ?? 120;

  // Fetch all unassigned, non-terminal rides
  const candidates = await prisma.ride.findMany({
    where: {
      status: { in: ['UPCOMING', 'SCHEDULED'] },
      partnerId: null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
      vehicleType: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const now = new Date();

  // Time-based filtering (dynamic, not relying on stored status)
  const liveRides = candidates
    .filter(ride => !isRideExpired(ride, bufferMinutes))
    .map(ride => {
      const effectivePickupTime = getEffectivePickupTime(ride);
      const expiresAt = getExpiryTime(ride, bufferMinutes);
      const timeRemainingMs = expiresAt.getTime() - now.getTime();
      const timeRemainingMinutes = Math.max(0, Math.round(timeRemainingMs / (60 * 1000)));

      return {
        ...ride,
        effectivePickupTime: effectivePickupTime.toISOString(),
        expiresAt: expiresAt.toISOString(),
        timeRemainingMinutes,
        urgencyLevel: getUrgencyLevel(ride, bufferMinutes),
      };
    })
    // Sort by urgency: nearest expiry first
    .sort((a, b) => a.timeRemainingMinutes - b.timeRemainingMinutes);

  return {
    rides: liveRides,
    bufferMinutes,
    totalCount: liveRides.length,
  };
}

// ============================================
// GUARD: Assignment Validation
// ============================================

/**
 * Validates that a ride is still assignable (not expired).
 * Must be called BEFORE any assignment operation.
 * Throws if ride is expired.
 */
export async function validateRideAssignable(rideId: string): Promise<void> {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    select: {
      status: true,
      partnerId: true,
      scheduledDateTime: true,
      requestedPickupTime: true,
      createdAt: true,
    },
  });

  if (!ride) throw new Error('Ride not found');

  const config = await prisma.pricingConfig.findFirst({
    where: { isActive: true },
    select: { assignmentBufferMinutes: true },
  });
  const bufferMinutes = config?.assignmentBufferMinutes ?? 120;

  if (isRideExpired(ride, bufferMinutes)) {
    // Also mark as EXPIRED in DB for consistency
    await prisma.ride.update({
      where: { id: rideId },
      data: { status: 'EXPIRED' },
    });
    throw new Error('Ride has expired and cannot be assigned. The assignment window has closed.');
  }
}

// ============================================
// CRON: Cleanup Job (Secondary)
// ============================================

/**
 * Periodically marks expired rides as EXPIRED in the database.
 * This is for REPORTING/HISTORY only. 
 * Primary expiry enforcement is in queries and assignment guards.
 */
async function expireStaleRides(): Promise<number> {
  try {
    const config = await prisma.pricingConfig.findFirst({
      where: { isActive: true },
      select: { assignmentBufferMinutes: true },
    });
    const bufferMinutes = config?.assignmentBufferMinutes ?? 120;

    // Get candidates
    const candidates = await prisma.ride.findMany({
      where: {
        status: { in: ['UPCOMING', 'SCHEDULED'] },
        partnerId: null,
      },
      select: {
        id: true,
        scheduledDateTime: true,
        requestedPickupTime: true,
        createdAt: true,
      },
    });

    // Filter expired ones
    const expiredIds = candidates
      .filter(ride => isRideExpired(ride, bufferMinutes))
      .map(r => r.id);

    if (expiredIds.length > 0) {
      await prisma.ride.updateMany({
        where: { id: { in: expiredIds } },
        data: { status: 'EXPIRED' },
      });
      console.log(`[Ride Expiry] Marked ${expiredIds.length} ride(s) as EXPIRED`);
    }

    return expiredIds.length;
  } catch (error) {
    console.error('[Ride Expiry] Cron error:', error);
    return 0;
  }
}

// ============================================
// STARTUP: Initialize Cron
// ============================================

let expiryInterval: NodeJS.Timeout | null = null;

/**
 * Start the ride expiry cron job.
 * Runs every 5 minutes.
 */
export function startRideExpiryCron() {
  console.log('[Ride Expiry] Starting cron job (every 5 minutes)');

  // Run immediately on startup
  expireStaleRides();

  // Then every 5 minutes
  expiryInterval = setInterval(() => {
    expireStaleRides();
  }, 5 * 60 * 1000);
}

/**
 * Stop the ride expiry cron job.
 */
export function stopRideExpiryCron() {
  if (expiryInterval) {
    clearInterval(expiryInterval);
    expiryInterval = null;
    console.log('[Ride Expiry] Cron job stopped');
  }
}
