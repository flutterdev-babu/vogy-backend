import { prisma } from "../../config/prisma";

/* ============================================
    GENERATE CUSTOM ID
============================================ */
const generateCustomId = async (
  cityCode: string,
  entityType: "VENDOR" | "PARTNER" | "VEHICLE" | "AGENT" | "CORPORATE"
): Promise<string> => {
  const prefixMap = {
    VENDOR: "V",
    PARTNER: "P",
    VEHICLE: "VH",
    AGENT: "A",
    CORPORATE: "C",
  };
  const prefix = prefixMap[entityType];
  
  // Count existing entities with this city code
  let count = 0;
  
  if (entityType === "VENDOR") {
    count = await prisma.vendor.count({
      where: { cityCode: { code: cityCode } },
    });
  } else if (entityType === "PARTNER") {
    count = await prisma.partner.count({
      where: { cityCode: { code: cityCode } },
    });
  } else if (entityType === "VEHICLE") {
    count = await prisma.vehicle.count({
      where: { cityCode: { code: cityCode } },
    });
  } else if (entityType === "AGENT") {
    // Agents manage city codes, so count by cityCodes (plural) relation
    count = await prisma.agent.count({
      where: { cityCodes: { some: { code: cityCode } } },
    });
  } else if (entityType === "CORPORATE") {
    count = await prisma.corporate.count({
      where: { cityCode: { code: cityCode } },
    });
  }
  
  // Generate next serial number (padded to 2 digits)
  const serialNumber = String(count + 1).padStart(2, "0");
  
  // Format: IC + prefix + cityCode + serial (no hyphen)
  // e.g., ICVBLR01, ICPBLR01, ICABLR01, ICCBLR01
  return `IC${prefix}${cityCode}${serialNumber}`;
};


/* ============================================
    CREATE CITY CODE (Agent only)
============================================ */
export const createCityCode = async (
  agentId: string,
  data: {
    code: string;
    cityName: string;
  }
) => {
  // Validate agent
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
  });

  if (!agent) throw new Error("Agent not found");

  // Check if city code already exists
  const existingCode = await prisma.cityCode.findUnique({
    where: { code: data.code.toUpperCase() },
  });

  if (existingCode) throw new Error("City code already exists");

  // Generate agent's custom ID if they don't have one yet (first city code)
  let agentCustomId = agent.customId;
  if (!agentCustomId) {
    agentCustomId = await generateCustomId(data.code.toUpperCase(), "AGENT");
    // Update agent with their custom ID
    await prisma.agent.update({
      where: { id: agentId },
      data: { customId: agentCustomId },
    });
  }

  // Create city code
  const cityCode = await prisma.cityCode.create({
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

/* ============================================
    GET ALL CITY CODES (Public - for signup forms)
============================================ */
export const getAllCityCodes = async () => {
  const cityCodes = await prisma.cityCode.findMany({
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

/* ============================================
    GET AGENT'S CITY CODES
============================================ */
export const getAgentCityCodes = async (agentId: string) => {
  const cityCodes = await prisma.cityCode.findMany({
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

/* ============================================
    UPDATE CITY CODE
============================================ */
export const updateCityCode = async (
  cityCodeId: string,
  agentId: string,
  data: {
    cityName?: string;
    isActive?: boolean;
  }
) => {
  // Verify ownership
  const cityCode = await prisma.cityCode.findFirst({
    where: { id: cityCodeId, agentId },
  });

  if (!cityCode) throw new Error("City code not found or not owned by this agent");

  const updated = await prisma.cityCode.update({
    where: { id: cityCodeId },
    data: {
      ...(data.cityName && { cityName: data.cityName }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

  return updated;
};

/* ============================================
    DELETE CITY CODE
============================================ */
export const deleteCityCode = async (cityCodeId: string, agentId: string) => {
  // Verify ownership and check for dependencies
  const cityCode = await prisma.cityCode.findFirst({
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

  if (!cityCode) throw new Error("City code not found or not owned by this agent");

  if (cityCode._count.vendors > 0 || cityCode._count.partners > 0 || cityCode._count.vehicles > 0) {
    throw new Error("Cannot delete city code with registered entities");
  }

  // Delete associated pricing first
  await prisma.cityPricing.deleteMany({
    where: { cityCodeId },
  });

  await prisma.cityCode.delete({
    where: { id: cityCodeId },
  });

  return { message: "City code deleted successfully" };
};

/* ============================================
    SET CITY PRICING (Agent)
============================================ */
export const setCityPricing = async (
  agentId: string,
  cityCodeId: string,
  data: {
    vehicleTypeId: string;
    baseKm: number;
    baseFare: number;
    perKmAfterBase: number;
  }
) => {
  // Verify city code ownership
  const cityCode = await prisma.cityCode.findFirst({
    where: { id: cityCodeId, agentId },
  });

  if (!cityCode) throw new Error("City code not found or not owned by this agent");

  // Verify vehicle type exists
  const vehicleType = await prisma.vehicleType.findUnique({
    where: { id: data.vehicleTypeId },
  });

  if (!vehicleType) throw new Error("Vehicle type not found");

  // Upsert pricing (create or update)
  const pricing = await prisma.cityPricing.upsert({
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

/* ============================================
    GET CITY PRICING
============================================ */
export const getCityPricing = async (cityCodeId: string) => {
  const pricing = await prisma.cityPricing.findMany({
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

/* ============================================
    DELETE CITY PRICING
============================================ */
export const deleteCityPricing = async (
  agentId: string,
  cityCodeId: string,
  vehicleTypeId: string
) => {
  // Verify city code ownership
  const cityCode = await prisma.cityCode.findFirst({
    where: { id: cityCodeId, agentId },
  });

  if (!cityCode) throw new Error("City code not found or not owned by this agent");

  await prisma.cityPricing.delete({
    where: {
      cityCodeId_vehicleTypeId: {
        cityCodeId,
        vehicleTypeId,
      },
    },
  });

  return { message: "Pricing deleted successfully" };
};

/* ============================================
    GENERATE CUSTOM ID FOR ENTITY
============================================ */
export const generateEntityCustomId = generateCustomId;

/* ============================================
    GET CITY CODE BY ID
============================================ */
export const getCityCodeById = async (cityCodeId: string) => {
  const cityCode = await prisma.cityCode.findUnique({
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

  if (!cityCode) throw new Error("City code not found");

  return cityCode;
};
