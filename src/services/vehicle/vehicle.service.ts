import { prisma } from "../../config/prisma";
import { generateEntityCustomId } from "../city/city.service";

/* ============================================
    CREATE VEHICLE (with Partner assignment required)
============================================ */
export const createVehicle = async (data: {
  registrationNumber: string;
  vehicleModel: string;
  vehicleTypeId: string;
  vendorId?: string;
  vendorCustomId?: string; // Optional: lookup vendor by custom ID
  partnerId?: string;
  partnerCustomId?: string; // Optional: lookup partner by custom ID
  cityCodeId: string;   // City code for ID generation
  // New vehicle details
  color?: string;
  fuelType?: "PETROL" | "DIESEL" | "CNG" | "ELECTRIC" | "HYBRID";
  seatingCapacity?: number;
  rtoTaxExpiryDate?: string;  // ISO date string
  speedGovernor?: boolean;
}) => {
  // Check if vehicle with registration number already exists
  const existingVehicle = await prisma.vehicle.findUnique({
    where: { registrationNumber: data.registrationNumber },
  });

  if (existingVehicle) {
    throw new Error("Vehicle with this registration number already exists");
  }

  // Validate vehicleTypeId
  const vehicleType = await prisma.vehicleType.findUnique({
    where: { id: data.vehicleTypeId },
  });

  if (!vehicleType) throw new Error("Invalid vehicle type ID");

  // Validate or lookup vendor
  let linkedVendorId: string | undefined = undefined;
  if (data.vendorId) {
    const vendor = await prisma.vendor.findUnique({
      where: { customId: data.vendorId }
    }) || (
      /^[0-9a-fA-F]{24}$/.test(data.vendorId)
      ? await prisma.vendor.findUnique({ where: { id: data.vendorId } })
      : null
    );
    
    if (!vendor) throw new Error(`Vendor with ID/CustomId "${data.vendorId}" not found`);
    linkedVendorId = vendor.id;
  }

  if (data.vendorCustomId && !linkedVendorId) {
    const vendor = await prisma.vendor.findUnique({
      where: { customId: data.vendorCustomId },
    });
    if (!vendor) throw new Error("Invalid vendor custom ID");
    linkedVendorId = vendor.id;
  }

  // Validate or lookup partner
  let linkedPartnerId: string | null = null;
  if (data.partnerId) {
    const partner = await prisma.partner.findUnique({
      where: { customId: data.partnerId }
    }) || (
      /^[0-9a-fA-F]{24}$/.test(data.partnerId)
      ? await prisma.partner.findUnique({ where: { id: data.partnerId } })
      : null
    );

    if (!partner) throw new Error(`Partner with ID/CustomId "${data.partnerId}" not found`);
    linkedPartnerId = partner.id;
  }

  if (data.partnerCustomId && !linkedPartnerId) {
    const partner = await prisma.partner.findUnique({
      where: { customId: data.partnerCustomId },
    });
    if (!partner) throw new Error("Invalid partner custom ID");
    linkedPartnerId = partner.id;
  }

  if (linkedPartnerId) {
    const partner = await prisma.partner.findUnique({
      where: { id: linkedPartnerId },
    });
    if (!partner) throw new Error("Invalid partner ID");
    if (partner.vehicleId) throw new Error("Partner is already assigned to another vehicle");
  }

  // Validate cityCodeId
  const cityCode = await prisma.cityCode.findUnique({
    where: { id: data.cityCodeId },
  });

  if (!cityCode) throw new Error("Invalid city code ID");

  // Generate custom ID
  const customId = await generateEntityCustomId(cityCode.code, "VEHICLE");

  // Create vehicle with partner assignment
  const vehicle = await prisma.vehicle.create({
    data: {
      customId,
      registrationNumber: data.registrationNumber,
      vehicleModel: data.vehicleModel,
      vehicleTypeId: data.vehicleTypeId,
      vendorId: linkedVendorId,
      cityCodeId: data.cityCodeId,
      // New vehicle details
      color: data.color || null,
      fuelType: data.fuelType || null,
      seatingCapacity: data.seatingCapacity || null,
      rtoTaxExpiryDate: data.rtoTaxExpiryDate ? new Date(data.rtoTaxExpiryDate) : null,
      speedGovernor: data.speedGovernor ?? false,
    },
    include: {
      vehicleType: {
        select: {
          id: true,
          name: true,
          displayName: true,
          category: true,
          pricePerKm: true,
        },
      },
      vendor: {
        select: {
          id: true,
          customId: true,
          name: true,
          companyName: true,
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

  // Assign partner to this vehicle if provided
  if (linkedPartnerId) {
    await prisma.partner.update({
      where: { id: linkedPartnerId },
      data: { 
        vehicleId: vehicle.id,
        cityCodeId: data.cityCodeId,
      },
    });
  }

  // Fetch complete vehicle with partner
  const completeVehicle = await getVehicleById(vehicle.id);

  return completeVehicle;
};

/* ============================================
    GET ALL VEHICLES
============================================ */
export const getAllVehicles = async (filters?: {
  vendorId?: string;
  vehicleTypeId?: string;
  isAvailable?: boolean;
  isActive?: boolean;
  cityCodeId?: string;
  search?: string;
}) => {
  const where: any = {};

  if (filters?.vendorId) {
    where.vendorId = filters.vendorId;
  }

  if (filters?.vehicleTypeId) {
    where.vehicleTypeId = filters.vehicleTypeId;
  }

  if (filters?.isAvailable !== undefined) {
    where.isAvailable = filters.isAvailable;
  }

  if (filters?.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters?.cityCodeId) {
    where.cityCodeId = filters.cityCodeId;
  }

  if (filters?.search) {
    where.OR = [
      { registrationNumber: { contains: filters.search, mode: "insensitive" } },
      { vehicleModel: { contains: filters.search, mode: "insensitive" } },
      { customId: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const vehicles = await prisma.vehicle.findMany({
    where,
    include: {
      vehicleType: {
        select: {
          id: true,
          name: true,
          displayName: true,
          category: true,
          pricePerKm: true,
        },
      },
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
        select: {
          id: true,
          customId: true,
          name: true,
          phone: true,
          status: true,
          isOnline: true,
        },
      },
      cityCode: {
        select: {
          id: true,
          code: true,
          cityName: true,
        },
      },
      _count: {
        select: {
          rides: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return vehicles;
};

/* ============================================
    GET VEHICLE BY ID
============================================ */
export const getVehicleById = async (vehicleId: string) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: {
      vehicleType: {
        select: {
          id: true,
          name: true,
          displayName: true,
          category: true,
          pricePerKm: true,
          baseFare: true,
        },
      },
      vendor: {
        select: {
          id: true,
          customId: true,
          name: true,
          companyName: true,
          phone: true,
          email: true,
        },
      },
      partner: {
        select: {
          id: true,
          customId: true,
          name: true,
          phone: true,
          email: true,
          status: true,
          isOnline: true,
          rating: true,
        },
      },
      cityCode: {
        select: {
          id: true,
          code: true,
          cityName: true,
        },
      },
      _count: {
        select: {
          rides: true,
        },
      },
    },
  });

  if (!vehicle) throw new Error("Vehicle not found");

  return vehicle;
};

/* ============================================
    UPDATE VEHICLE
============================================ */
export const updateVehicle = async (
  vehicleId: string,
  data: {
    vehicleModel?: string;
    vehicleTypeId?: string;
    isAvailable?: boolean;
    isActive?: boolean;
  }
) => {
  // Validate vehicleTypeId if provided
  if (data.vehicleTypeId) {
    const vehicleType = await prisma.vehicleType.findUnique({
      where: { id: data.vehicleTypeId },
    });
    if (!vehicleType) throw new Error("Invalid vehicle type ID");
  }

  const vehicle = await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      ...(data.vehicleModel && { vehicleModel: data.vehicleModel }),
      ...(data.vehicleTypeId && { vehicleTypeId: data.vehicleTypeId }),
      ...(data.isAvailable !== undefined && { isAvailable: data.isAvailable }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    include: {
      vehicleType: {
        select: {
          id: true,
          name: true,
          displayName: true,
          category: true,
          pricePerKm: true,
        },
      },
      vendor: {
        select: {
          id: true,
          customId: true,
          name: true,
          companyName: true,
        },
      },
      partner: {
        select: {
          id: true,
          customId: true,
          name: true,
          phone: true,
          status: true,
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

  return vehicle;
};

/* ============================================
    REASSIGN PARTNER TO VEHICLE
============================================ */
export const reassignPartnerToVehicle = async (vehicleId: string, newPartnerId: string) => {
  // Get vehicle
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: { partner: true },
  });

  if (!vehicle) throw new Error("Vehicle not found");

  // Validate new partner
  const newPartner = await prisma.partner.findUnique({
    where: { customId: newPartnerId }
  }) || (
    /^[0-9a-fA-F]{24}$/.test(newPartnerId)
    ? await prisma.partner.findUnique({ where: { id: newPartnerId } })
    : null
  );

  if (!newPartner) throw new Error(`Partner with ID/CustomId "${newPartnerId}" not found`);

  // Check if new partner is already assigned to another vehicle
  if (newPartner.vehicleId && newPartner.vehicleId !== vehicleId) {
    throw new Error("Partner is already assigned to another vehicle");
  }

  // Unassign old partner if exists
  if (vehicle.partner) {
    await prisma.partner.update({
      where: { id: vehicle.partner.id },
      data: { vehicleId: null },
    });
  }

  // Assign new partner
  await prisma.partner.update({
    where: { id: newPartner.id },
    data: { 
      vehicleId,
      cityCodeId: vehicle.cityCodeId,
    },
  });

  return getVehicleById(vehicleId);
};

/* ============================================
    ASSIGN VEHICLE TO VENDOR
============================================ */
export const assignVehicleToVendor = async (vehicleId: string, vendorId: string) => {
  // Validate vendor
  const vendor = await prisma.vendor.findUnique({
    where: { customId: vendorId }
  }) || (
    /^[0-9a-fA-F]{24}$/.test(vendorId)
    ? await prisma.vendor.findUnique({ where: { id: vendorId } })
    : null
  );

  if (!vendor) throw new Error(`Vendor with ID/CustomId "${vendorId}" not found`);

  const vehicle = await prisma.vehicle.update({
    where: { id: vehicleId },
    data: { vendorId: vendor.id },
    include: {
      vendor: {
        select: {
          id: true,
          customId: true,
          name: true,
          companyName: true,
        },
      },
      vehicleType: {
        select: {
          id: true,
          name: true,
          displayName: true,
        },
      },
    },
  });

  return vehicle;
};

/* ============================================
    GET AVAILABLE VEHICLES
============================================ */
export const getAvailableVehicles = async (vehicleTypeId?: string, cityCodeId?: string) => {
  const where: any = {
    isAvailable: true,
    isActive: true,
  };

  if (vehicleTypeId) {
    where.vehicleTypeId = vehicleTypeId;
  }

  if (cityCodeId) {
    where.cityCodeId = cityCodeId;
  }

  const vehicles = await prisma.vehicle.findMany({
    where,
    include: {
      vehicleType: {
        select: {
          id: true,
          name: true,
          displayName: true,
          category: true,
        },
      },
      vendor: {
        select: {
          id: true,
          customId: true,
          name: true,
          companyName: true,
        },
      },
      partner: {
        select: {
          id: true,
          customId: true,
          name: true,
          phone: true,
          isOnline: true,
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
    orderBy: {
      createdAt: "desc",
    },
  });

  return vehicles;
};

/* ============================================
    GET VEHICLE RIDES
============================================ */
export const getVehicleRides = async (vehicleId: string) => {
  const rides = await prisma.ride.findMany({
    where: { vehicleId },
    include: {
      partner: {
        select: {
          id: true,
          customId: true,
          name: true,
          phone: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      corporate: {
        select: {
          id: true,
          companyName: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return rides;
};

/* ============================================
    DELETE VEHICLE
============================================ */
export const deleteVehicle = async (vehicleId: string) => {
  // Check if vehicle has assigned partner
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: {
      partner: true,
    },
  });

  if (!vehicle) throw new Error("Vehicle not found");

  // Unassign partner if exists
  if (vehicle.partner) {
    await prisma.partner.update({
      where: { id: vehicle.partner.id },
      data: { vehicleId: null },
    });
  }

  // Check if vehicle has rides
  const rideCount = await prisma.ride.count({
    where: { vehicleId },
  });

  if (rideCount > 0) {
    throw new Error("Cannot delete vehicle with existing rides. Consider deactivating instead.");
  }

  await prisma.vehicle.delete({
    where: { id: vehicleId },
  });

  return { message: "Vehicle deleted successfully" };
};
