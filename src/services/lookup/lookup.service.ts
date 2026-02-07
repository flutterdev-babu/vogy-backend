import { prisma } from "../../config/prisma";

export const getVendorsForDropdown = async (agentId?: string) => {
  return await prisma.vendor.findMany({
    where: agentId ? { agentId } : {},
    select: {
      id: true,
      customId: true,
      name: true,
      companyName: true,
    },
    orderBy: { name: "asc" },
  });
};

export const getPartnersForDropdown = async (vendorId?: string) => {
  return await prisma.partner.findMany({
    where: vendorId ? { vendorId } : {},
    select: {
      id: true,
      customId: true,
      name: true,
      phone: true,
    },
    orderBy: { name: "asc" },
  });
};

export const getVehicleTypesForDropdown = async () => {
  return await prisma.vehicleType.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      displayName: true,
      category: true,
    },
    orderBy: { category: "asc" },
  });
};
