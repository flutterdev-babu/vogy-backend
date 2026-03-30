import { prisma } from "../../config/prisma";

/**
 * Fraud Detection Service
 * Scans completed rides for anomalies like time/distance mismatches.
 */

interface FraudAlert {
  rideId: string;
  customId: string;
  reason: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  rideDetails: any;
}

export const getFraudAlerts = async () => {
  const rides = await prisma.ride.findMany({
    where: {
      status: "COMPLETED",
      totalFare: { not: null },
    },
    include: {
      user: { select: { id: true, name: true, phone: true } },
      partner: { select: { id: true, name: true, phone: true, customId: true } },
      vehicleType: { select: { displayName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500, // Scan last 500 completed rides
  });

  const alerts: FraudAlert[] = [];

  for (const ride of rides) {
    // Rule 1: Extremely long ride with very short distance
    if (ride.startTime && ride.endTime && ride.distanceKm) {
      const durationMinutes = (ride.endTime.getTime() - ride.startTime.getTime()) / (1000 * 60);

      // Ride took more than 3 hours but covered less than 5 km (suspicious)
      if (durationMinutes > 180 && ride.distanceKm < 5) {
        alerts.push({
          rideId: ride.id,
          customId: ride.customId || "N/A",
          reason: `Ride took ${Math.round(durationMinutes)} mins but only covered ${ride.distanceKm.toFixed(1)} km`,
          severity: "HIGH",
          rideDetails: {
            date: ride.createdAt,
            userName: ride.user?.name || "N/A",
            partnerName: ride.partner?.name || "N/A",
            partnerId: ride.partner?.customId || "N/A",
            distance: ride.distanceKm,
            duration: Math.round(durationMinutes),
            fare: ride.totalFare,
            pickup: ride.pickupAddress,
            drop: ride.dropAddress,
            vehicleType: ride.vehicleType?.displayName || "N/A",
          },
        });
      }

      // Rule 2: Extremely fast ride — covered too much distance in too little time
      if (durationMinutes > 0 && durationMinutes < 5 && ride.distanceKm > 20) {
        alerts.push({
          rideId: ride.id,
          customId: ride.customId || "N/A",
          reason: `Ride covered ${ride.distanceKm.toFixed(1)} km in only ${Math.round(durationMinutes)} mins (impossible speed)`,
          severity: "HIGH",
          rideDetails: {
            date: ride.createdAt,
            userName: ride.user?.name || "N/A",
            partnerName: ride.partner?.name || "N/A",
            partnerId: ride.partner?.customId || "N/A",
            distance: ride.distanceKm,
            duration: Math.round(durationMinutes),
            fare: ride.totalFare,
            pickup: ride.pickupAddress,
            drop: ride.dropAddress,
            vehicleType: ride.vehicleType?.displayName || "N/A",
          },
        });
      }
    }

    // Rule 3: Zero fare on a completed ride with distance
    if (ride.distanceKm > 2 && (!ride.totalFare || ride.totalFare === 0)) {
      alerts.push({
        rideId: ride.id,
        customId: ride.customId || "N/A",
        reason: `Completed ride of ${ride.distanceKm.toFixed(1)} km has ₹0 fare`,
        severity: "MEDIUM",
        rideDetails: {
          date: ride.createdAt,
          userName: ride.user?.name || "N/A",
          partnerName: ride.partner?.name || "N/A",
          partnerId: ride.partner?.customId || "N/A",
          distance: ride.distanceKm,
          fare: ride.totalFare,
          pickup: ride.pickupAddress,
          drop: ride.dropAddress,
          vehicleType: ride.vehicleType?.displayName || "N/A",
        },
      });
    }

    // Rule 4: Excessively high fare for short distance
    if (ride.totalFare && ride.distanceKm && ride.distanceKm < 5 && ride.totalFare > 2000) {
      alerts.push({
        rideId: ride.id,
        customId: ride.customId || "N/A",
        reason: `Fare of ₹${ride.totalFare.toFixed(0)} for only ${ride.distanceKm.toFixed(1)} km seems excessive`,
        severity: "MEDIUM",
        rideDetails: {
          date: ride.createdAt,
          userName: ride.user?.name || "N/A",
          partnerName: ride.partner?.name || "N/A",
          partnerId: ride.partner?.customId || "N/A",
          distance: ride.distanceKm,
          fare: ride.totalFare,
          pickup: ride.pickupAddress,
          drop: ride.dropAddress,
          vehicleType: ride.vehicleType?.displayName || "N/A",
        },
      });
    }
  }

  // Sort by severity: HIGH first
  const severityOrder: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // NEW: Fetch Active Persistent Fraud Logs (Blocked IPs/Users)
  const fraudLogs = await (prisma as any).fraudLog.findMany({
    where: {
      OR: [
        { attemptCount: { gt: 0 } },
        { lockedUntil: { gt: new Date() } }
      ]
    },
    orderBy: { updatedAt: "desc" },
    take: 50
  });

  return {
    totalAlerts: alerts.length,
    highSeverity: alerts.filter((a) => a.severity === "HIGH").length,
    mediumSeverity: alerts.filter((a) => a.severity === "MEDIUM").length,
    lowSeverity: alerts.filter((a) => a.severity === "LOW").length,
    alerts,
    securityBlocks: (fraudLogs as any[]).map((log: any) => ({
      userId: log.userId,
      ipAddress: log.ipAddress,
      attempts: log.attemptCount,
      isLocked: log.lockedUntil && log.lockedUntil > new Date(),
      lockedUntil: log.lockedUntil,
      updatedAt: log.updatedAt
    }))
  };
};
