"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCityCodeById = exports.deleteCityPricing = exports.getCityPricing = exports.setCityPricing = exports.generateEntityCustomId = exports.getPricingForCity = exports.deletePricingGroup = exports.updatePricingGroup = exports.getPricingGroups = exports.createPricingGroup = exports.deleteCityCode = exports.updateCityCode = exports.getAgentCityCodes = exports.getAllCityCodes = exports.createCityCode = void 0;
const prisma_1 = require("../../config/prisma");
/* ============================================
    GENERATE CUSTOM ID
============================================ */
const generateCustomId = async (cityCode, entityType) => {
    const prefixMap = {
        VENDOR: "V",
        PARTNER: "P",
        VEHICLE: "VH",
        AGENT: "A",
        CORPORATE: "C",
        RIDE: "R",
        ATTACHMENT: "AA",
    };
    const prefix = prefixMap[entityType];
    // Count existing entities with this city code
    let count = 0;
    if (entityType === "VENDOR") {
        count = await prisma_1.prisma.vendor.count({
            where: { cityCode: { code: cityCode } },
        });
    }
    else if (entityType === "PARTNER") {
        count = await prisma_1.prisma.partner.count({
            where: { cityCode: { code: cityCode } },
        });
    }
    else if (entityType === "VEHICLE") {
        count = await prisma_1.prisma.vehicle.count({
            where: { cityCode: { code: cityCode } },
        });
    }
    else if (entityType === "AGENT") {
        // Agents manage city codes, so count by cityCodes (plural) relation
        count = await prisma_1.prisma.agent.count({
            where: { cityCodes: { some: { code: cityCode } } },
        });
    }
    else if (entityType === "CORPORATE") {
        count = await prisma_1.prisma.corporate.count({
            where: { cityCode: { code: cityCode } },
        });
    }
    else if (entityType === "RIDE") {
        count = await prisma_1.prisma.ride.count({
            where: { cityCode: { code: cityCode } },
        });
    }
    else if (entityType === "ATTACHMENT") {
        count = await prisma_1.prisma.attachment.count({
            where: { customId: { contains: `ACAA${cityCode}` } }
        });
    }
    // Generate next serial number
    // For RIDE we use 4 digits to reach 10 chars
    // For others, we keep 2 digits
    const serialPadding = (entityType === "RIDE") ? 4 : 2;
    const serialNumber = String(count + 1).padStart(serialPadding, "0");
    // Format: AC + prefix + cityCode + serial (no hyphen)
    // e.g., ACVBLR01, ACPBLR01, ACABLR01, ACCBLR01, ACRBLR0001, ACAABLR01
    return `AC${prefix}${cityCode}${serialNumber}`;
};
/* ============================================
    CREATE CITY CODE (Agent only)
============================================ */
const createCityCode = async (agentId, data) => {
    // Validate agent
    const agent = await prisma_1.prisma.agent.findUnique({
        where: { id: agentId },
    });
    if (!agent)
        throw new Error("Agent not found");
    // Check if city code already exists
    const existingCode = await prisma_1.prisma.cityCode.findUnique({
        where: { code: data.code.toUpperCase() },
    });
    if (existingCode)
        throw new Error("City code already exists");
    // Generate agent's custom ID if they don't have one yet (first city code)
    let agentCustomId = agent.customId;
    if (!agentCustomId) {
        agentCustomId = await generateCustomId(data.code.toUpperCase(), "AGENT");
        // Update agent with their custom ID
        await prisma_1.prisma.agent.update({
            where: { id: agentId },
            data: { customId: agentCustomId },
        });
    }
    // Create city code
    const cityCode = await prisma_1.prisma.cityCode.create({
        data: {
            code: data.code.toUpperCase(),
            cityName: data.cityName,
            agentId,
        },
        include: {
            agent: {
                select: {
                    id: true,
                    customId: true,
                    name: true,
                    phone: true,
                },
            },
        },
    });
    return cityCode;
};
exports.createCityCode = createCityCode;
/* ============================================
    GET ALL CITY CODES (Public - for signup forms)
============================================ */
const getAllCityCodes = async () => {
    const cityCodes = await prisma_1.prisma.cityCode.findMany({
        where: { isActive: true },
        select: {
            id: true,
            code: true,
            cityName: true,
        },
        orderBy: {
            cityName: "asc",
        },
    });
    return cityCodes;
};
exports.getAllCityCodes = getAllCityCodes;
/* ============================================
    GET AGENT'S CITY CODES
============================================ */
const getAgentCityCodes = async (agentId) => {
    const cityCodes = await prisma_1.prisma.cityCode.findMany({
        where: { agentId },
        include: {
            _count: {
                select: {
                    vendors: true,
                    partners: true,
                    vehicles: true,
                },
            },
        },
        orderBy: {
            cityName: "asc",
        },
    });
    return cityCodes;
};
exports.getAgentCityCodes = getAgentCityCodes;
/* ============================================
    UPDATE CITY CODE
============================================ */
const updateCityCode = async (cityCodeId, agentId, data) => {
    // Verify ownership
    const cityCode = await prisma_1.prisma.cityCode.findFirst({
        where: { id: cityCodeId, agentId },
    });
    if (!cityCode)
        throw new Error("City code not found or not owned by this agent");
    const updated = await prisma_1.prisma.cityCode.update({
        where: { id: cityCodeId },
        data: {
            ...(data.cityName && { cityName: data.cityName }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
    });
    return updated;
};
exports.updateCityCode = updateCityCode;
/* ============================================
    DELETE CITY CODE
============================================ */
const deleteCityCode = async (cityCodeId, agentId) => {
    // Verify ownership and check for dependencies
    const cityCode = await prisma_1.prisma.cityCode.findFirst({
        where: { id: cityCodeId, agentId },
        include: {
            _count: {
                select: {
                    vendors: true,
                    partners: true,
                    vehicles: true,
                },
            },
        },
    });
    if (!cityCode)
        throw new Error("City code not found or not owned by this agent");
    if (cityCode._count.vendors > 0 || cityCode._count.partners > 0 || cityCode._count.vehicles > 0) {
        throw new Error("Cannot delete city code with registered entities");
    }
    // Remove this city ID from any pricing groups it was part of
    const pricingGroups = await prisma_1.prisma.vehiclePricingGroup.findMany({
        where: { cityCodeIds: { has: cityCodeId } }
    });
    for (const group of pricingGroups) {
        await prisma_1.prisma.vehiclePricingGroup.update({
            where: { id: group.id },
            data: {
                cityCodeIds: {
                    set: group.cityCodeIds.filter(id => id !== cityCodeId)
                }
            }
        });
    }
    await prisma_1.prisma.cityCode.delete({
        where: { id: cityCodeId },
    });
    return { message: "City code deleted successfully" };
};
exports.deleteCityCode = deleteCityCode;
/* ============================================
    VEHICLE PRICING GROUPS (Admin)
============================================ */
const createPricingGroup = async (data) => {
    // Verify vehicle type exists
    const vehicleType = await prisma_1.prisma.vehicleType.findUnique({
        where: { id: data.vehicleTypeId },
    });
    if (!vehicleType)
        throw new Error("Vehicle type not found");
    // Create pricing group
    const pricingGroup = await prisma_1.prisma.vehiclePricingGroup.create({
        data: {
            vehicleTypeId: data.vehicleTypeId,
            name: data.name,
            baseKm: data.baseKm,
            baseFare: data.baseFare,
            perKmPrice: data.perKmPrice,
            cityCodeIds: data.cityCodeIds,
        },
        include: {
            vehicleType: true,
        },
    });
    return pricingGroup;
};
exports.createPricingGroup = createPricingGroup;
const getPricingGroups = async (vehicleTypeId) => {
    const where = vehicleTypeId ? { vehicleTypeId } : {};
    return await prisma_1.prisma.vehiclePricingGroup.findMany({
        where,
        include: {
            vehicleType: true,
        },
        orderBy: { createdAt: "desc" },
    });
};
exports.getPricingGroups = getPricingGroups;
const updatePricingGroup = async (id, data) => {
    return await prisma_1.prisma.vehiclePricingGroup.update({
        where: { id },
        data,
        include: {
            vehicleType: true,
        },
    });
};
exports.updatePricingGroup = updatePricingGroup;
const deletePricingGroup = async (id) => {
    await prisma_1.prisma.vehiclePricingGroup.delete({
        where: { id },
    });
    return { message: "Pricing group deleted successfully" };
};
exports.deletePricingGroup = deletePricingGroup;
const getPricingForCity = async (vehicleTypeId, cityCodeId) => {
    // Find an active pricing group that contains this city and vehicle type
    const pricingGroup = await prisma_1.prisma.vehiclePricingGroup.findFirst({
        where: {
            vehicleTypeId,
            cityCodeIds: { has: cityCodeId },
            isActive: true,
        },
    });
    if (pricingGroup) {
        return {
            id: pricingGroup.id,
            baseFare: pricingGroup.baseFare,
            perKmPrice: pricingGroup.perKmPrice,
            baseKm: pricingGroup.baseKm,
            name: pricingGroup.name
        };
    }
    // Fallback to vehicle type defaults if no specific group found
    const vehicleType = await prisma_1.prisma.vehicleType.findUnique({
        where: { id: vehicleTypeId },
    });
    if (!vehicleType)
        throw new Error("Vehicle type not found");
    return {
        baseFare: vehicleType.baseFare || 20, // Global default if not set
        perKmPrice: vehicleType.pricePerKm,
        baseKm: 0, // No base distance for manual/default pricing usually?
    };
};
exports.getPricingForCity = getPricingForCity;
/* ============================================
    GENERATE CUSTOM ID FOR ENTITY
============================================ */
exports.generateEntityCustomId = generateCustomId;
/* ============================================
    LEGACY PRICING MAPPING (Shim for controllers)
============================================ */
const setCityPricing = async (agentId, cityCodeId, data) => {
    // Map back to createPricingGroup or similar
    // Since new system uses groups, we look for an existing group for this vehicle type
    // that already has this city, or create a new one.
    const existingGroup = await prisma_1.prisma.vehiclePricingGroup.findFirst({
        where: {
            vehicleTypeId: data.vehicleTypeId,
            cityCodeIds: { has: cityCodeId }
        }
    });
    if (existingGroup) {
        return await (0, exports.updatePricingGroup)(existingGroup.id, {
            baseKm: data.baseKm,
            baseFare: data.baseFare,
            perKmPrice: data.perKmAfterBase
        });
    }
    else {
        return await (0, exports.createPricingGroup)({
            vehicleTypeId: data.vehicleTypeId,
            baseKm: data.baseKm,
            baseFare: data.baseFare,
            perKmPrice: data.perKmAfterBase,
            cityCodeIds: [cityCodeId],
            name: `Pricing for City ${cityCodeId}`
        });
    }
};
exports.setCityPricing = setCityPricing;
const getCityPricing = async (cityCodeId) => {
    // Get all pricing groups for this city
    const groups = await prisma_1.prisma.vehiclePricingGroup.findMany({
        where: { cityCodeIds: { has: cityCodeId } },
        include: { vehicleType: true }
    });
    return groups.map(g => ({
        vehicleTypeId: g.vehicleTypeId,
        vehicleType: g.vehicleType,
        baseKm: g.baseKm,
        baseFare: g.baseFare,
        perKmAfterBase: g.perKmPrice
    }));
};
exports.getCityPricing = getCityPricing;
const deleteCityPricing = async (agentId, cityCodeId, vehicleTypeId) => {
    const group = await prisma_1.prisma.vehiclePricingGroup.findFirst({
        where: {
            vehicleTypeId,
            cityCodeIds: { has: cityCodeId }
        }
    });
    if (!group)
        throw new Error("Pricing group not found");
    // If this group only has this city, delete the group
    if (group.cityCodeIds.length === 1) {
        return await (0, exports.deletePricingGroup)(group.id);
    }
    else {
        // Remove city from group
        return await (0, exports.updatePricingGroup)(group.id, {
            cityCodeIds: group.cityCodeIds.filter(id => id !== cityCodeId)
        });
    }
};
exports.deleteCityPricing = deleteCityPricing;
/* ============================================
    GET CITY CODE BY ID
============================================ */
const getCityCodeById = async (cityCodeId) => {
    const cityCode = await prisma_1.prisma.cityCode.findUnique({
        where: { id: cityCodeId },
        include: {
            agent: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                },
            },
            _count: {
                select: {
                    vendors: true,
                    partners: true,
                    vehicles: true,
                },
            },
        },
    });
    if (!cityCode)
        throw new Error("City code not found");
    return cityCode;
};
exports.getCityCodeById = getCityCodeById;
