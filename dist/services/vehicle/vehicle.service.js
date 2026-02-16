"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVehicle = exports.getVehicleRides = exports.getAvailableVehicles = exports.assignVehicleToVendor = exports.reassignPartnerToVehicle = exports.updateVehicle = exports.getVehicleById = exports.getAllVehicles = exports.createVehicle = void 0;
const prisma_1 = require("../../config/prisma");
const city_service_1 = require("../city/city.service");
/* ============================================
    CREATE VEHICLE (with Partner assignment required)
============================================ */
const createVehicle = async (data) => {
    // Check if vehicle with registration number already exists
    const existingVehicle = await prisma_1.prisma.vehicle.findUnique({
        where: { registrationNumber: data.registrationNumber },
    });
    if (existingVehicle) {
        throw new Error("Vehicle with this registration number already exists");
    }
    // Validate vehicleTypeId
    const vehicleType = await prisma_1.prisma.vehicleType.findUnique({
        where: { id: data.vehicleTypeId },
    });
    if (!vehicleType)
        throw new Error("Invalid vehicle type ID");
    // Validate vendorId
    const vendor = await prisma_1.prisma.vendor.findUnique({
        where: { id: data.vendorId },
    });
    if (!vendor)
        throw new Error("Invalid vendor ID");
    // Validate partnerId
    const partner = await prisma_1.prisma.partner.findUnique({
        where: { id: data.partnerId },
    });
    if (!partner)
        throw new Error("Invalid partner ID");
    // Check if partner is already assigned to another vehicle
    if (partner.vehicleId) {
        throw new Error("Partner is already assigned to another vehicle");
    }
    // Validate cityCodeId
    const cityCode = await prisma_1.prisma.cityCode.findUnique({
        where: { id: data.cityCodeId },
    });
    if (!cityCode)
        throw new Error("Invalid city code ID");
    // Generate custom ID
    const customId = await (0, city_service_1.generateEntityCustomId)(cityCode.code, "VEHICLE");
    // Create vehicle with partner assignment
    const vehicle = await prisma_1.prisma.vehicle.create({
        data: {
            customId,
            registrationNumber: data.registrationNumber,
            vehicleModel: data.vehicleModel,
            vehicleTypeId: data.vehicleTypeId,
            vendorId: data.vendorId,
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
    // Assign partner to this vehicle
    await prisma_1.prisma.partner.update({
        where: { id: data.partnerId },
        data: {
            vehicleId: vehicle.id,
            cityCodeId: data.cityCodeId,
        },
    });
    // Fetch complete vehicle with partner
    const completeVehicle = await (0, exports.getVehicleById)(vehicle.id);
    return completeVehicle;
};
exports.createVehicle = createVehicle;
/* ============================================
    GET ALL VEHICLES
============================================ */
const getAllVehicles = async (filters) => {
    const where = {};
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
    const vehicles = await prisma_1.prisma.vehicle.findMany({
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
exports.getAllVehicles = getAllVehicles;
/* ============================================
    GET VEHICLE BY ID
============================================ */
const getVehicleById = async (vehicleId) => {
    const vehicle = await prisma_1.prisma.vehicle.findUnique({
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
    if (!vehicle)
        throw new Error("Vehicle not found");
    return vehicle;
};
exports.getVehicleById = getVehicleById;
/* ============================================
    UPDATE VEHICLE
============================================ */
const updateVehicle = async (vehicleId, data) => {
    // Validate vehicleTypeId if provided
    if (data.vehicleTypeId) {
        const vehicleType = await prisma_1.prisma.vehicleType.findUnique({
            where: { id: data.vehicleTypeId },
        });
        if (!vehicleType)
            throw new Error("Invalid vehicle type ID");
    }
    const vehicle = await prisma_1.prisma.vehicle.update({
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
exports.updateVehicle = updateVehicle;
/* ============================================
    REASSIGN PARTNER TO VEHICLE
============================================ */
const reassignPartnerToVehicle = async (vehicleId, newPartnerId) => {
    // Get vehicle
    const vehicle = await prisma_1.prisma.vehicle.findUnique({
        where: { id: vehicleId },
        include: { partner: true },
    });
    if (!vehicle)
        throw new Error("Vehicle not found");
    // Validate new partner
    const newPartner = await prisma_1.prisma.partner.findUnique({
        where: { id: newPartnerId },
    });
    if (!newPartner)
        throw new Error("Partner not found");
    // Check if new partner is already assigned to another vehicle
    if (newPartner.vehicleId && newPartner.vehicleId !== vehicleId) {
        throw new Error("Partner is already assigned to another vehicle");
    }
    // Unassign old partner if exists
    if (vehicle.partner) {
        await prisma_1.prisma.partner.update({
            where: { id: vehicle.partner.id },
            data: { vehicleId: null },
        });
    }
    // Assign new partner
    await prisma_1.prisma.partner.update({
        where: { id: newPartnerId },
        data: {
            vehicleId,
            cityCodeId: vehicle.cityCodeId,
        },
    });
    return (0, exports.getVehicleById)(vehicleId);
};
exports.reassignPartnerToVehicle = reassignPartnerToVehicle;
/* ============================================
    ASSIGN VEHICLE TO VENDOR
============================================ */
const assignVehicleToVendor = async (vehicleId, vendorId) => {
    // Validate vendor
    const vendor = await prisma_1.prisma.vendor.findUnique({
        where: { id: vendorId },
    });
    if (!vendor)
        throw new Error("Vendor not found");
    const vehicle = await prisma_1.prisma.vehicle.update({
        where: { id: vehicleId },
        data: { vendorId },
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
exports.assignVehicleToVendor = assignVehicleToVendor;
/* ============================================
    GET AVAILABLE VEHICLES
============================================ */
const getAvailableVehicles = async (vehicleTypeId, cityCodeId) => {
    const where = {
        isAvailable: true,
        isActive: true,
    };
    if (vehicleTypeId) {
        where.vehicleTypeId = vehicleTypeId;
    }
    if (cityCodeId) {
        where.cityCodeId = cityCodeId;
    }
    const vehicles = await prisma_1.prisma.vehicle.findMany({
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
exports.getAvailableVehicles = getAvailableVehicles;
/* ============================================
    GET VEHICLE RIDES
============================================ */
const getVehicleRides = async (vehicleId) => {
    const rides = await prisma_1.prisma.ride.findMany({
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
exports.getVehicleRides = getVehicleRides;
/* ============================================
    DELETE VEHICLE
============================================ */
const deleteVehicle = async (vehicleId) => {
    // Check if vehicle has assigned partner
    const vehicle = await prisma_1.prisma.vehicle.findUnique({
        where: { id: vehicleId },
        include: {
            partner: true,
        },
    });
    if (!vehicle)
        throw new Error("Vehicle not found");
    // Unassign partner if exists
    if (vehicle.partner) {
        await prisma_1.prisma.partner.update({
            where: { id: vehicle.partner.id },
            data: { vehicleId: null },
        });
    }
    // Check if vehicle has rides
    const rideCount = await prisma_1.prisma.ride.count({
        where: { vehicleId },
    });
    if (rideCount > 0) {
        throw new Error("Cannot delete vehicle with existing rides. Consider deactivating instead.");
    }
    await prisma_1.prisma.vehicle.delete({
        where: { id: vehicleId },
    });
    return { message: "Vehicle deleted successfully" };
};
exports.deleteVehicle = deleteVehicle;
