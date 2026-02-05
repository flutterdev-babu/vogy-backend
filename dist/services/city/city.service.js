"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCityCodeById = exports.generateEntityCustomId = exports.deleteCityPricing = exports.getCityPricing = exports.setCityPricing = exports.deleteCityCode = exports.updateCityCode = exports.getAgentCityCodes = exports.getAllCityCodes = exports.createCityCode = void 0;
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
    // Generate next serial number
    // For RIDE, we use 4 digits to reach 10 chars (IC + R + CITY + 0001)
    // For others, we keep 2 digits for backward compatibility
    const serialPadding = entityType === "RIDE" ? 4 : 2;
    const serialNumber = String(count + 1).padStart(serialPadding, "0");
    // Format: IC + prefix + cityCode + serial (no hyphen)
    // e.g., ICVBLR01, ICPBLR01, ICABLR01, ICCBLR01, ICRBLR0001
    return `IC${prefix}${cityCode}${serialNumber}`;
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
                    pricing: true,
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
    // Delete associated pricing first
    await prisma_1.prisma.cityPricing.deleteMany({
        where: { cityCodeId },
    });
    await prisma_1.prisma.cityCode.delete({
        where: { id: cityCodeId },
    });
    return { message: "City code deleted successfully" };
};
exports.deleteCityCode = deleteCityCode;
/* ============================================
    SET CITY PRICING (Agent)
============================================ */
const setCityPricing = async (agentId, cityCodeId, data) => {
    // Verify city code ownership
    const cityCode = await prisma_1.prisma.cityCode.findFirst({
        where: { id: cityCodeId, agentId },
    });
    if (!cityCode)
        throw new Error("City code not found or not owned by this agent");
    // Verify vehicle type exists
    const vehicleType = await prisma_1.prisma.vehicleType.findUnique({
        where: { id: data.vehicleTypeId },
    });
    if (!vehicleType)
        throw new Error("Vehicle type not found");
    // Upsert pricing (create or update)
    const pricing = await prisma_1.prisma.cityPricing.upsert({
        where: {
            cityCodeId_vehicleTypeId: {
                cityCodeId,
                vehicleTypeId: data.vehicleTypeId,
            },
        },
        update: {
            baseKm: data.baseKm,
            baseFare: data.baseFare,
            perKmAfterBase: data.perKmAfterBase,
        },
        create: {
            cityCodeId,
            vehicleTypeId: data.vehicleTypeId,
            baseKm: data.baseKm,
            baseFare: data.baseFare,
            perKmAfterBase: data.perKmAfterBase,
        },
        include: {
            vehicleType: {
                select: {
                    id: true,
                    name: true,
                    displayName: true,
                    category: true,
                },
            },
            cityCode: {
                select: {
                    id: true,
                    code: true,
                    cityName: true,
                },
            },
        },
    });
    return pricing;
};
exports.setCityPricing = setCityPricing;
/* ============================================
    GET CITY PRICING
============================================ */
const getCityPricing = async (cityCodeId) => {
    const pricing = await prisma_1.prisma.cityPricing.findMany({
        where: { cityCodeId },
        include: {
            vehicleType: {
                select: {
                    id: true,
                    name: true,
                    displayName: true,
                    category: true,
                },
            },
        },
        orderBy: {
            vehicleType: {
                category: "asc",
            },
        },
    });
    return pricing;
};
exports.getCityPricing = getCityPricing;
/* ============================================
    DELETE CITY PRICING
============================================ */
const deleteCityPricing = async (agentId, cityCodeId, vehicleTypeId) => {
    // Verify city code ownership
    const cityCode = await prisma_1.prisma.cityCode.findFirst({
        where: { id: cityCodeId, agentId },
    });
    if (!cityCode)
        throw new Error("City code not found or not owned by this agent");
    await prisma_1.prisma.cityPricing.delete({
        where: {
            cityCodeId_vehicleTypeId: {
                cityCodeId,
                vehicleTypeId,
            },
        },
    });
    return { message: "Pricing deleted successfully" };
};
exports.deleteCityPricing = deleteCityPricing;
/* ============================================
    GENERATE CUSTOM ID FOR ENTITY
============================================ */
exports.generateEntityCustomId = generateCustomId;
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
            pricing: {
                include: {
                    vehicleType: {
                        select: {
                            id: true,
                            name: true,
                            displayName: true,
                            category: true,
                        },
                    },
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
