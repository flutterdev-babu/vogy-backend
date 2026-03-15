import { prisma } from "../../config/prisma";
import { DayOfWeek } from "@prisma/client";

/* ============================================
    PEAK HOUR CHARGE CRUD OPERATIONS
============================================ */

export const createPeakHourCharge = async (data: {
  name?: string;
  vehicleTypeId: string;
  cityCodeIds: string[];
  slots: {
    startTime: string;
    endTime: string;
    fixedExtra?: number;
    percentageExtra?: number;
  }[];
  days?: DayOfWeek[];
}) => {
  // Verify vehicle type exists
  const vehicleType = await prisma.vehicleType.findUnique({
    where: { id: data.vehicleTypeId },
  });
  if (!vehicleType) throw new Error("Vehicle type not found");

  // Create peak hour charge
  const peakHourCharge = await prisma.peakHourCharge.create({
    data: {
      name: data.name,
      vehicleTypeId: data.vehicleTypeId,
      cityCodeIds: data.cityCodeIds,
      slots: data.slots.map(slot => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        fixedExtra: slot.fixedExtra || 0,
        percentageExtra: slot.percentageExtra || 0,
      })),
      days: data.days || [],
    },
    include: {
      vehicleType: true,
    },
  });

  return peakHourCharge;
};

export const getAllPeakHourCharges = async (filters?: {
  vehicleTypeId?: string;
  cityCodeId?: string;
  isActive?: boolean;
}) => {
  const where: any = {};
  if (filters?.vehicleTypeId) where.vehicleTypeId = filters.vehicleTypeId;
  if (filters?.cityCodeId) where.cityCodeIds = { has: filters.cityCodeId };
  if (filters?.isActive !== undefined) where.isActive = filters.isActive;

  return await prisma.peakHourCharge.findMany({
    where,
    include: {
      vehicleType: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getPeakHourChargeById = async (id: string) => {
  const peakHourCharge = await prisma.peakHourCharge.findUnique({
    where: { id },
    include: {
      vehicleType: true,
    },
  });

  if (!peakHourCharge) throw new Error("Peak hour charge configuration not found");

  return peakHourCharge;
};

export const updatePeakHourCharge = async (
  id: string,
  data: {
    name?: string;
    cityCodeIds?: string[];
    slots?: {
      startTime: string;
      endTime: string;
      fixedExtra?: number;
      percentageExtra?: number;
    }[];
    days?: DayOfWeek[];
    isActive?: boolean;
  }
) => {
  return await prisma.peakHourCharge.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.cityCodeIds && { cityCodeIds: data.cityCodeIds }),
      ...(data.slots && {
        slots: data.slots.map(slot => ({
          startTime: slot.startTime,
          endTime: slot.endTime,
          fixedExtra: slot.fixedExtra || 0,
          percentageExtra: slot.percentageExtra || 0,
        })),
      }),
      ...(data.days && { days: data.days }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    include: {
      vehicleType: true,
    },
  });
};

export const deletePeakHourCharge = async (id: string) => {
  await prisma.peakHourCharge.delete({
    where: { id },
  });
  return { message: "Peak hour charge configuration deleted successfully" };
};

/* ============================================
    PRICING LOGIC
============================================ */

/**
 * Calculates the total peak hour adjustment for a given location, vehicle, and time.
 * @param cityCodeId 
 * @param vehicleTypeId 
 * @param referenceTime The time to check against (defaults to now)
 * @returns Object containing total fixed extra and total percentage extra
 */
export const getPeakHourAdjustment = async (
  cityCodeId: string,
  vehicleTypeId: string,
  referenceTime: Date = new Date()
) => {
  // Convert referenceTime to current day (DayOfWeek enum) and time string (HH:mm)
  const daysMap: DayOfWeek[] = [
    DayOfWeek.SUNDAY,
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.SATURDAY,
  ];
  
  const currentDay = daysMap[referenceTime.getDay()];
  const currentTimeStr = referenceTime.toTimeString().substring(0, 5); // "HH:mm"

  // Find all active peak hour charges for this city and vehicle type
  const configs = await prisma.peakHourCharge.findMany({
    where: {
      cityCodeIds: { has: cityCodeId },
      vehicleTypeId: vehicleTypeId,
      isActive: true,
    },
  });

  let totalFixedExtra = 0;
  let totalPercentageExtra = 0;

  for (const config of configs) {
    // Check if configuration applies to the current day
    // If config.days is empty, it applies to all days
    const isApplicableDay = config.days.length === 0 || config.days.includes(currentDay);
    if (!isApplicableDay) continue;

    // Check slots
    for (const slot of config.slots) {
      if (currentTimeStr >= slot.startTime && currentTimeStr <= slot.endTime) {
        totalFixedExtra += slot.fixedExtra;
        totalPercentageExtra += slot.percentageExtra;
      }
    }
  }

  return {
    fixedExtra: totalFixedExtra,
    percentageExtra: totalPercentageExtra,
  };
};
