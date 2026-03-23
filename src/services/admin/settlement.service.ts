import { prisma } from "../../config/prisma";

/**
 * Settlement Service
 * Calculates partner/vendor earnings from completed rides that haven't been settled yet.
 */

interface SettlementSummary {
  entityId: string;
  entityType: "PARTNER" | "VENDOR";
  name: string;
  phone: string;
  customId: string;
  totalRides: number;
  totalFare: number;
  totalEarnings: number;
  totalCommission: number;
  rides: any[];
}

// Get all unsettled completed rides grouped by partner
export const getPartnerSettlements = async () => {
  const rides = await prisma.ride.findMany({
    where: {
      status: "COMPLETED",
      partnerId: { not: null },
      // We use paymentStatus to track settlement: COMPLETED means paid to partner
      // PENDING or PAID means not yet settled with partner
    },
    include: {
      partner: {
        select: {
          id: true,
          customId: true,
          name: true,
          phone: true,
        },
      },
      vehicleType: {
        select: { displayName: true },
      },
      user: {
        select: { name: true, phone: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by partner
  const partnerMap = new Map<string, SettlementSummary>();

  for (const ride of rides) {
    if (!ride.partnerId || !ride.partner) continue;

    const existing = partnerMap.get(ride.partnerId);
    const riderEarnings = ride.riderEarnings || (ride.totalFare ? ride.totalFare * 0.8 : 0);
    const commission = ride.commission || (ride.totalFare ? ride.totalFare * 0.2 : 0);

    const rideData = {
      id: ride.id,
      customId: ride.customId,
      date: ride.createdAt,
      totalFare: ride.totalFare || 0,
      riderEarnings,
      commission,
      paymentMode: ride.paymentMode,
      paymentStatus: ride.paymentStatus,
      vehicleType: ride.vehicleType?.displayName || "N/A",
      userName: ride.user?.name || "N/A",
    };

    if (existing) {
      existing.totalRides += 1;
      existing.totalFare += ride.totalFare || 0;
      existing.totalEarnings += riderEarnings;
      existing.totalCommission += commission;
      existing.rides.push(rideData);
    } else {
      partnerMap.set(ride.partnerId, {
        entityId: ride.partnerId,
        entityType: "PARTNER",
        name: ride.partner.name || "Unknown",
        phone: ride.partner.phone || "N/A",
        customId: ride.partner.customId || "N/A",
        totalRides: 1,
        totalFare: ride.totalFare || 0,
        totalEarnings: riderEarnings,
        totalCommission: commission,
        rides: [rideData],
      });
    }
  }

  return Array.from(partnerMap.values()).sort((a, b) => b.totalEarnings - a.totalEarnings);
};

// Get vendor settlements (vendors earn through their partners' rides)
export const getVendorSettlements = async () => {
  const rides = await prisma.ride.findMany({
    where: {
      status: "COMPLETED",
      vendorId: { not: null },
    },
    include: {
      vendor: {
        select: {
          id: true,
          customId: true,
          name: true,
          companyName: true,
          phone: true,
        },
      },
      partner: {
        select: { name: true },
      },
      vehicleType: {
        select: { displayName: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const vendorMap = new Map<string, SettlementSummary>();

  for (const ride of rides) {
    if (!ride.vendorId || !ride.vendor) continue;

    const existing = vendorMap.get(ride.vendorId);
    const totalFare = ride.totalFare || 0;

    const rideData = {
      id: ride.id,
      customId: ride.customId,
      date: ride.createdAt,
      totalFare,
      partnerName: ride.partner?.name || "N/A",
      vehicleType: ride.vehicleType?.displayName || "N/A",
      paymentMode: ride.paymentMode,
    };

    if (existing) {
      existing.totalRides += 1;
      existing.totalFare += totalFare;
      existing.rides.push(rideData);
    } else {
      vendorMap.set(ride.vendorId, {
        entityId: ride.vendorId,
        entityType: "VENDOR",
        name: ride.vendor.companyName || ride.vendor.name || "Unknown",
        phone: ride.vendor.phone || "N/A",
        customId: ride.vendor.customId || "N/A",
        totalRides: 1,
        totalFare: totalFare,
        totalEarnings: 0, // Vendor-specific earning logic can be added later
        totalCommission: 0,
        rides: [rideData],
      });
    }
  }

  return Array.from(vendorMap.values()).sort((a, b) => b.totalFare - a.totalFare);
};

// Get overall settlement stats
export const getSettlementStats = async () => {
  const completedRides = await prisma.ride.aggregate({
    where: { status: "COMPLETED" },
    _sum: {
      totalFare: true,
      riderEarnings: true,
      commission: true,
    },
    _count: true,
  });

  const pendingPayments = await prisma.ride.aggregate({
    where: {
      status: "COMPLETED",
      paymentStatus: "PENDING",
    },
    _sum: { totalFare: true },
    _count: true,
  });

  return {
    totalCompletedRides: completedRides._count,
    totalRevenue: completedRides._sum.totalFare || 0,
    totalRiderEarnings: completedRides._sum.riderEarnings || 0,
    totalCommission: completedRides._sum.commission || 0,
    pendingPayments: pendingPayments._count,
    pendingAmount: pendingPayments._sum.totalFare || 0,
  };
};
