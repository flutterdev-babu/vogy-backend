import { prisma } from "../../config/prisma";

export const createVehicleType = async (data: any) => {
  return await prisma.vehicleType.create({ data });
};

export const getAllVehicleTypes = async () => {
  const types = await prisma.vehicleType.findMany({
    orderBy: { category: "asc" },
  });
  
  return types.sort((a, b) => {
    const baseA = a.baseFare || 0;
    const baseB = b.baseFare || 0;
    
    if (baseA !== baseB) {
      return baseA - baseB;
    }
    
    const perKmA = a.pricePerKm || 0;
    const perKmB = b.pricePerKm || 0;
    return perKmA - perKmB;
  });
};

export const getVehicleTypeById = async (id: string) => {
  return await prisma.vehicleType.findUnique({
    where: { id },
  });
};

export const updateVehicleType = async (id: string, data: any) => {
  return await prisma.vehicleType.update({
    where: { id },
    data,
  });
};

export const deleteVehicleType = async (id: string) => {
  // Check if vehicles are using this type
  const vehicleCount = await prisma.vehicle.count({
    where: { vehicleTypeId: id },
  });
  if (vehicleCount > 0) throw new Error("Cannot delete vehicle type in use by vehicles");

  return await prisma.vehicleType.delete({
    where: { id },
  });
};
