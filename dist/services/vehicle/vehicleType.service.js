"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVehicleType = exports.updateVehicleType = exports.getVehicleTypeById = exports.getAllVehicleTypes = exports.createVehicleType = void 0;
const prisma_1 = require("../../config/prisma");
const createVehicleType = async (data) => {
    return await prisma_1.prisma.vehicleType.create({ data });
};
exports.createVehicleType = createVehicleType;
const getAllVehicleTypes = async () => {
    return await prisma_1.prisma.vehicleType.findMany({
        orderBy: { category: "asc" },
    });
};
exports.getAllVehicleTypes = getAllVehicleTypes;
const getVehicleTypeById = async (id) => {
    return await prisma_1.prisma.vehicleType.findUnique({
        where: { id },
    });
};
exports.getVehicleTypeById = getVehicleTypeById;
const updateVehicleType = async (id, data) => {
    return await prisma_1.prisma.vehicleType.update({
        where: { id },
        data,
    });
};
exports.updateVehicleType = updateVehicleType;
const deleteVehicleType = async (id) => {
    // Check if vehicles are using this type
    const vehicleCount = await prisma_1.prisma.vehicle.count({
        where: { vehicleTypeId: id },
    });
    if (vehicleCount > 0)
        throw new Error("Cannot delete vehicle type in use by vehicles");
    return await prisma_1.prisma.vehicleType.delete({
        where: { id },
    });
};
exports.deleteVehicleType = deleteVehicleType;
