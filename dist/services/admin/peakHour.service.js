"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPeakHourAdjustment = exports.deletePeakHourCharge = exports.updatePeakHourCharge = exports.getPeakHourChargeById = exports.getAllPeakHourCharges = exports.createPeakHourCharge = void 0;
const prisma_1 = require("../../config/prisma");
const client_1 = require("@prisma/client");
/* ============================================
    PEAK HOUR CHARGE CRUD OPERATIONS
============================================ */
const createPeakHourCharge = async (data) => {
    // Verify vehicle type exists
    const vehicleType = await prisma_1.prisma.vehicleType.findUnique({
        where: { id: data.vehicleTypeId },
    });
    if (!vehicleType)
        throw new Error("Vehicle type not found");
    // Create peak hour charge
    const peakHourCharge = await prisma_1.prisma.peakHourCharge.create({
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
exports.createPeakHourCharge = createPeakHourCharge;
const getAllPeakHourCharges = async (filters) => {
    const where = {};
    if (filters?.vehicleTypeId)
        where.vehicleTypeId = filters.vehicleTypeId;
    if (filters?.cityCodeId)
        where.cityCodeIds = { has: filters.cityCodeId };
    if (filters?.isActive !== undefined)
        where.isActive = filters.isActive;
    return await prisma_1.prisma.peakHourCharge.findMany({
        where,
        include: {
            vehicleType: true,
        },
        orderBy: { createdAt: "desc" },
    });
};
exports.getAllPeakHourCharges = getAllPeakHourCharges;
const getPeakHourChargeById = async (id) => {
    const peakHourCharge = await prisma_1.prisma.peakHourCharge.findUnique({
        where: { id },
        include: {
            vehicleType: true,
        },
    });
    if (!peakHourCharge)
        throw new Error("Peak hour charge configuration not found");
    return peakHourCharge;
};
exports.getPeakHourChargeById = getPeakHourChargeById;
const updatePeakHourCharge = async (id, data) => {
    return await prisma_1.prisma.peakHourCharge.update({
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
exports.updatePeakHourCharge = updatePeakHourCharge;
const deletePeakHourCharge = async (id) => {
    await prisma_1.prisma.peakHourCharge.delete({
        where: { id },
    });
    return { message: "Peak hour charge configuration deleted successfully" };
};
exports.deletePeakHourCharge = deletePeakHourCharge;
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
const getPeakHourAdjustment = async (cityCodeId, vehicleTypeId, referenceTime = new Date()) => {
    // Convert referenceTime to current day (DayOfWeek enum) and time string (HH:mm)
    const daysMap = [
        client_1.DayOfWeek.SUNDAY,
        client_1.DayOfWeek.MONDAY,
        client_1.DayOfWeek.TUESDAY,
        client_1.DayOfWeek.WEDNESDAY,
        client_1.DayOfWeek.THURSDAY,
        client_1.DayOfWeek.FRIDAY,
        client_1.DayOfWeek.SATURDAY,
    ];
    const currentDay = daysMap[referenceTime.getDay()];
    const currentTimeStr = referenceTime.toTimeString().substring(0, 5); // "HH:mm"
    // Find all active peak hour charges for this city and vehicle type
    const configs = await prisma_1.prisma.peakHourCharge.findMany({
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
        if (!isApplicableDay)
            continue;
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
exports.getPeakHourAdjustment = getPeakHourAdjustment;
