"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVehicleTypesForDropdown = exports.getPartnersForDropdown = exports.getVendorsForDropdown = void 0;
const prisma_1 = require("../../config/prisma");
const getVendorsForDropdown = async (agentId) => {
    return await prisma_1.prisma.vendor.findMany({
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
exports.getVendorsForDropdown = getVendorsForDropdown;
const getPartnersForDropdown = async (vendorId) => {
    return await prisma_1.prisma.partner.findMany({
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
exports.getPartnersForDropdown = getPartnersForDropdown;
const getVehicleTypesForDropdown = async () => {
    return await prisma_1.prisma.vehicleType.findMany({
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
exports.getVehicleTypesForDropdown = getVehicleTypesForDropdown;
