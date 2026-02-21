"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecentActivity = exports.getEntityStatusOverview = exports.getRideAnalytics = exports.getRevenueAnalytics = exports.getAdminDashboard = exports.createManualRideByAdmin = exports.createPartnerByAdmin = exports.createVendorByAdmin = exports.deleteAttachment = exports.updateAttachmentStatus = exports.getAllAttachments = exports.createAttachment = exports.updateCityCode = exports.createCityCode = exports.getAllCityCodes = exports.updateCorporate = exports.getCorporateById = exports.getAllCorporates = exports.updateVendor = exports.getVendorById = exports.getAllVendors = exports.getUserById = exports.getAllUsers = exports.updateUserUniqueOtpByAdmin = exports.verifyAttachmentByAdmin = exports.getRideOtpByAdmin = exports.updateRideStatusByAdmin = exports.getRideById = exports.getAllRides = exports.assignPartnerToRide = exports.getScheduledRides = exports.getPartnerById = exports.getAllPartners = exports.updatePricingConfig = exports.getPricingConfig = exports.deleteVehicleType = exports.updateVehicleType = exports.getVehicleTypeById = exports.getAllVehicleTypes = exports.createVehicleType = void 0;
const prisma_1 = require("../../config/prisma");
const generateUniqueOtp_1 = require("../../utils/generateUniqueOtp");
const socket_service_1 = require("../socket/socket.service");
const vendorAuthService = __importStar(require("../auth/vendor.auth.service"));
const partnerAuthService = __importStar(require("../auth/partner.auth.service"));
const city_service_1 = require("../city/city.service");
/* ============================================
    VEHICLE TYPE MANAGEMENT
============================================ */
const createVehicleType = async (data) => {
    // Validate category
    const validCategories = ["BIKE", "AUTO", "CAR"];
    if (!validCategories.includes(data.category)) {
        throw new Error("Invalid category. Must be BIKE, AUTO, or CAR.");
    }
    // Check if vehicle type with this name already exists
    const exists = await prisma_1.prisma.vehicleType.findUnique({
        where: { name: data.name },
    });
    if (exists) {
        throw new Error("Vehicle type with this name already exists");
    }
    const vehicleType = await prisma_1.prisma.vehicleType.create({
        data: {
            category: data.category,
            name: data.name,
            displayName: data.displayName,
            pricePerKm: data.pricePerKm,
            baseFare: data.baseFare ?? null,
        },
    });
    return vehicleType;
};
exports.createVehicleType = createVehicleType;
const getAllVehicleTypes = async () => {
    const vehicleTypes = await prisma_1.prisma.vehicleType.findMany({
        orderBy: { createdAt: "desc" },
    });
    return vehicleTypes;
};
exports.getAllVehicleTypes = getAllVehicleTypes;
const getVehicleTypeById = async (id) => {
    const vehicleType = await prisma_1.prisma.vehicleType.findUnique({
        where: { id },
    });
    if (!vehicleType) {
        throw new Error("Vehicle type not found");
    }
    return vehicleType;
};
exports.getVehicleTypeById = getVehicleTypeById;
const updateVehicleType = async (id, data) => {
    const vehicleType = await prisma_1.prisma.vehicleType.findUnique({
        where: { id },
    });
    if (!vehicleType) {
        throw new Error("Vehicle type not found");
    }
    const updated = await prisma_1.prisma.vehicleType.update({
        where: { id },
        data: {
            ...(data.displayName && { displayName: data.displayName }),
            ...(data.pricePerKm !== undefined && { pricePerKm: data.pricePerKm }),
            ...(data.baseFare !== undefined && { baseFare: data.baseFare }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
    });
    return updated;
};
exports.updateVehicleType = updateVehicleType;
const deleteVehicleType = async (id) => {
    const vehicleType = await prisma_1.prisma.vehicleType.findUnique({
        where: { id },
    });
    if (!vehicleType) {
        throw new Error("Vehicle type not found");
    }
    await prisma_1.prisma.vehicleType.delete({
        where: { id },
    });
    return { message: "Vehicle type deleted successfully" };
};
exports.deleteVehicleType = deleteVehicleType;
/* ============================================
    PRICING CONFIGURATION
============================================ */
const getPricingConfig = async () => {
    let config = await prisma_1.prisma.pricingConfig.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
    });
    // If no config exists, create default one
    if (!config) {
        config = await prisma_1.prisma.pricingConfig.create({
            data: {
                riderPercentage: 80,
                appCommission: 20,
            },
        });
    }
    return config;
};
exports.getPricingConfig = getPricingConfig;
const updatePricingConfig = async (data) => {
    // Validate percentages
    if (data.riderPercentage + data.appCommission !== 100) {
        throw new Error("Rider percentage and app commission must sum to 100%");
    }
    // Deactivate old configs
    await prisma_1.prisma.pricingConfig.updateMany({
        where: { isActive: true },
        data: { isActive: false },
    });
    // Create new active config
    const config = await prisma_1.prisma.pricingConfig.create({
        data: {
            baseFare: data.baseFare ?? 20,
            riderPercentage: data.riderPercentage,
            appCommission: data.appCommission,
            isActive: true,
        },
    });
    return config;
};
exports.updatePricingConfig = updatePricingConfig;
/* ============================================
    PARTNER MANAGEMENT
============================================ */
const getAllPartners = async (filters) => {
    const where = {};
    if (filters?.status) {
        where.status = filters.status;
    }
    if (filters?.verificationStatus) {
        where.verificationStatus = filters.verificationStatus;
    }
    if (filters?.isOnline !== undefined) {
        where.isOnline = filters.isOnline;
    }
    if (filters?.search) {
        where.OR = [
            { name: { contains: filters.search, mode: "insensitive" } },
            { phone: { contains: filters.search } },
            { email: { contains: filters.search, mode: "insensitive" } },
            { customId: { contains: filters.search, mode: "insensitive" } },
        ];
    }
    const partners = await prisma_1.prisma.partner.findMany({
        where,
        select: {
            id: true,
            customId: true,
            name: true,
            phone: true,
            email: true,
            profileImage: true,
            status: true,
            verificationStatus: true,
            isOnline: true,
            rating: true,
            totalEarnings: true,
            hasOwnVehicle: true,
            ownVehicleNumber: true,
            ownVehicleModel: true,
            createdAt: true,
            vehicle: {
                select: {
                    id: true,
                    customId: true,
                    registrationNumber: true,
                    vehicleModel: true,
                },
            },
            _count: {
                select: {
                    rides: true,
                }
            }
        },
        orderBy: { createdAt: "desc" },
    });
    return partners;
};
exports.getAllPartners = getAllPartners;
const getPartnerById = async (partnerId) => {
    const partner = await prisma_1.prisma.partner.findUnique({
        where: { id: partnerId },
        include: {
            vehicle: {
                include: {
                    vehicleType: true,
                    vendor: true,
                },
            },
            ownVehicleType: true,
            rides: {
                select: {
                    id: true,
                    status: true,
                    totalFare: true,
                    riderEarnings: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "desc" },
                take: 20,
            },
        },
    });
    if (!partner) {
        throw new Error("Partner not found");
    }
    return partner;
};
exports.getPartnerById = getPartnerById;
/* ============================================
    SCHEDULED RIDE MANAGEMENT
============================================ */
const getScheduledRides = async () => {
    const rides = await prisma_1.prisma.ride.findMany({
        where: {
            status: "SCHEDULED",
            isManualBooking: true,
            partnerId: null,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                },
            },
            vehicleType: true,
        },
        orderBy: { scheduledDateTime: "asc" },
    });
    return rides;
};
exports.getScheduledRides = getScheduledRides;
const assignPartnerToRide = async (rideId, partnerId, adminId) => {
    // Verify partner exists
    const partner = await prisma_1.prisma.partner.findUnique({
        where: { id: partnerId },
        include: {
            vehicle: true
        }
    });
    if (!partner) {
        throw new Error("Partner not found");
    }
    // Verify ride exists and is scheduled
    const ride = await prisma_1.prisma.ride.findUnique({
        where: { id: rideId },
    });
    if (!ride) {
        throw new Error("Ride not found");
    }
    if (ride.status !== "SCHEDULED" && ride.status !== "UPCOMING") {
        throw new Error("Ride is already assigned or in progress");
    }
    if (ride.partnerId) {
        throw new Error("Ride already has a partner assigned");
    }
    // Assign partner to ride
    const updatedRide = await prisma_1.prisma.ride.update({
        where: { id: rideId },
        data: {
            partnerId: partnerId,
            assignedByAdminId: adminId,
            status: "ACCEPTED",
            acceptedAt: new Date(),
            // If partner has an assigned vehicle, link it
            ...(partner.vehicleId && { vehicleId: partner.vehicleId }),
            // If partner has an assigned vehicle, use its vendor
            ...(partner.vehicle?.vendorId && { vendorId: partner.vehicle.vendorId }),
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
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
                    profileImage: true,
                    rating: true,
                },
            },
            vehicle: {
                select: {
                    id: true,
                    customId: true,
                    registrationNumber: true,
                    vehicleModel: true,
                },
            },
            vehicleType: true,
        },
    });
    // Emit socket event to notify user and partner
    // Note: Function renamed or logic updated to emitRiderAssigned with Partner data
    (0, socket_service_1.emitRiderAssigned)(updatedRide);
    return updatedRide;
};
exports.assignPartnerToRide = assignPartnerToRide;
/* ============================================
    ADMIN RIDE MANAGEMENT
============================================ */
const getAllRides = async (filters) => {
    const where = {
        ...(filters?.status && { status: filters.status }),
        ...(filters?.vehicleType && {
            vehicleType: {
                name: filters.vehicleType,
            },
        }),
        ...(filters?.userId && { userId: filters.userId }),
        ...(filters?.partnerId && { partnerId: filters.partnerId }),
    };
    if (filters?.search) {
        where.OR = [
            { customId: { contains: filters.search, mode: "insensitive" } },
            { user: { name: { contains: filters.search, mode: "insensitive" } } },
            { partner: { name: { contains: filters.search, mode: "insensitive" } } },
        ];
    }
    const rides = await prisma_1.prisma.ride.findMany({
        where,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
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
                },
            },
            vehicleType: true,
            vehicle: {
                select: {
                    id: true,
                    customId: true,
                    registrationNumber: true,
                    vehicleModel: true,
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
        },
        orderBy: { createdAt: "desc" },
    });
    return rides;
};
exports.getAllRides = getAllRides;
const getRideById = async (id) => {
    const ride = await prisma_1.prisma.ride.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
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
                },
            },
            vehicleType: true,
            vehicle: {
                select: {
                    id: true,
                    customId: true,
                    registrationNumber: true,
                    vehicleModel: true,
                    color: true,
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
        },
    });
    if (!ride) {
        throw new Error("Ride not found");
    }
    return ride;
};
exports.getRideById = getRideById;
const updateRideStatusByAdmin = async (rideId, status) => {
    const ride = await prisma_1.prisma.ride.update({
        where: { id: rideId },
        data: { status },
        include: {
            user: true,
            partner: true,
        }
    });
    return ride;
};
exports.updateRideStatusByAdmin = updateRideStatusByAdmin;
const getRideOtpByAdmin = async (rideId) => {
    const ride = await prisma_1.prisma.ride.findUnique({
        where: { id: rideId },
        select: { userOtp: true }
    });
    if (!ride)
        throw new Error("Ride not found");
    return ride.userOtp;
};
exports.getRideOtpByAdmin = getRideOtpByAdmin;
/* ============================================
    ATTACHMENT VERIFICATION
============================================ */
const verifyAttachmentByAdmin = async (attachmentId, verificationStatus, adminId) => {
    const attachment = await prisma_1.prisma.attachment.update({
        where: { id: attachmentId },
        data: {
            verificationStatus,
            ...(adminId && { updatedByAdminId: adminId })
        },
    });
    return attachment;
};
exports.verifyAttachmentByAdmin = verifyAttachmentByAdmin;
const updateUserUniqueOtpByAdmin = async (userId) => {
    // Check if user exists
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        throw new Error("User not found");
    }
    // Generate new unique OTP
    const newUniqueOtp = await (0, generateUniqueOtp_1.generateUnique4DigitOtp)();
    // Update user's unique OTP
    const updatedUser = await prisma_1.prisma.user.update({
        where: { id: userId },
        data: {
            uniqueOtp: newUniqueOtp,
        },
        select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            uniqueOtp: true,
            updatedAt: true,
        },
    });
    return updatedUser;
};
exports.updateUserUniqueOtpByAdmin = updateUserUniqueOtpByAdmin;
const getAllUsers = async () => {
    const users = await prisma_1.prisma.user.findMany({
        select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            uniqueOtp: true,
            createdAt: true,
            updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
    });
    return users;
};
exports.getAllUsers = getAllUsers;
const getUserById = async (userId) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            uniqueOtp: true,
            createdAt: true,
            updatedAt: true,
            rides: {
                select: {
                    id: true,
                    status: true,
                    totalFare: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "desc" },
            },
        },
    });
    if (!user) {
        throw new Error("User not found");
    }
    return user;
};
exports.getUserById = getUserById;
/* ============================================
    VENDOR MANAGEMENT (Moved to Admin)
============================================ */
const getAllVendors = async (filters) => {
    const where = {
        isDeleted: filters?.includeDeleted ? undefined : false,
    };
    if (filters?.search) {
        where.OR = [
            { name: { contains: filters.search, mode: "insensitive" } },
            { companyName: { contains: filters.search, mode: "insensitive" } },
            { phone: { contains: filters.search } },
            { customId: { contains: filters.search, mode: "insensitive" } },
        ];
    }
    if (filters?.status) {
        where.status = filters.status;
    }
    if (filters?.verificationStatus) {
        where.verificationStatus = filters.verificationStatus;
    }
    return await prisma_1.prisma.vendor.findMany({
        where,
        include: {
            _count: {
                select: {
                    vehicles: true,
                    partners: true,
                    rides: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
};
exports.getAllVendors = getAllVendors;
const getVendorById = async (id) => {
    const vendor = await prisma_1.prisma.vendor.findUnique({
        where: { id },
        include: {
            vehicles: true,
            partners: true,
        },
    });
    if (!vendor)
        throw new Error("Vendor not found");
    return vendor;
};
exports.getVendorById = getVendorById;
const updateVendor = async (id, data, adminId) => {
    return await prisma_1.prisma.vendor.update({
        where: { id },
        data: {
            ...data,
            ...(adminId && { updatedByAdminId: adminId })
        },
    });
};
exports.updateVendor = updateVendor;
/* ============================================
    CORPORATE MANAGEMENT (Moved to Admin)
============================================ */
const getAllCorporates = async (filters) => {
    const where = {};
    if (filters?.status) {
        where.status = filters.status;
    }
    if (filters?.agentId) {
        where.agentId = filters.agentId;
    }
    if (filters?.search) {
        where.OR = [
            { companyName: { contains: filters.search, mode: "insensitive" } },
            { contactPerson: { contains: filters.search, mode: "insensitive" } },
            { phone: { contains: filters.search } },
        ];
    }
    return await prisma_1.prisma.corporate.findMany({
        where,
        orderBy: { createdAt: "desc" },
    });
};
exports.getAllCorporates = getAllCorporates;
const getCorporateById = async (id) => {
    const corporate = await prisma_1.prisma.corporate.findUnique({
        where: { id },
        include: {
            rides: true,
            billings: true,
            payments: true,
        },
    });
    if (!corporate)
        throw new Error("Corporate not found");
    return corporate;
};
exports.getCorporateById = getCorporateById;
const updateCorporate = async (id, data) => {
    return await prisma_1.prisma.corporate.update({
        where: { id },
        data,
    });
};
exports.updateCorporate = updateCorporate;
/* ============================================
    CITY CODE MANAGEMENT (Moved to Admin)
============================================ */
const getAllCityCodes = async () => {
    return await prisma_1.prisma.cityCode.findMany({
        include: {
            pricing: {
                include: {
                    vehicleType: true,
                },
            },
        },
        orderBy: { cityName: "asc" },
    });
};
exports.getAllCityCodes = getAllCityCodes;
const createCityCode = async (data) => {
    return await prisma_1.prisma.cityCode.create({
        data,
    });
};
exports.createCityCode = createCityCode;
const updateCityCode = async (id, data) => {
    return await prisma_1.prisma.cityCode.update({
        where: { id },
        data,
    });
};
exports.updateCityCode = updateCityCode;
const createAttachment = async (data) => {
    let cityCode = data.cityCode;
    // Resolve City Code if missing but referenceId is provided
    if (!cityCode && data.referenceId && data.referenceType) {
        if (data.referenceType === "VENDOR") {
            const v = await prisma_1.prisma.vendor.findUnique({ where: { id: data.referenceId }, include: { cityCode: true } });
            cityCode = v?.cityCode?.code;
        }
        else if (data.referenceType === "PARTNER") {
            const p = await prisma_1.prisma.partner.findUnique({ where: { id: data.referenceId }, include: { cityCode: true } });
            cityCode = p?.cityCode?.code;
        }
        else if (data.referenceType === "VEHICLE") {
            const vh = await prisma_1.prisma.vehicle.findUnique({ where: { id: data.referenceId }, include: { cityCode: true } });
            cityCode = vh?.cityCode?.code;
        }
    }
    if (!cityCode)
        throw new Error("City code is required for attachment custom ID generation");
    const customId = await (0, city_service_1.generateEntityCustomId)(cityCode, "ATTACHMENT");
    // Case 1: 3-ID Link Registration Bundle
    if (data.vendorCustomId && data.partnerCustomId && data.vehicleCustomId) {
        const vendor = await prisma_1.prisma.vendor.findUnique({ where: { customId: data.vendorCustomId } });
        if (!vendor)
            throw new Error("Invalid vendor custom ID");
        const partner = await prisma_1.prisma.partner.findUnique({ where: { customId: data.partnerCustomId } });
        if (!partner)
            throw new Error("Invalid partner custom ID");
        const vehicle = await prisma_1.prisma.vehicle.findUnique({ where: { customId: data.vehicleCustomId } });
        if (!vehicle)
            throw new Error("Invalid vehicle custom ID");
        return await prisma_1.prisma.attachment.create({
            data: {
                customId,
                vendorId: vendor.id,
                partnerId: partner.id,
                vehicleId: vehicle.id,
                verificationStatus: "UNVERIFIED",
            },
            include: {
                vendor: true,
                partner: true,
                vehicle: true,
            },
        });
    }
    // Case 2: Polymorphic Individual Document Upload
    if (data.referenceType && data.referenceId && data.fileUrl) {
        return await prisma_1.prisma.attachment.create({
            data: {
                customId,
                referenceType: data.referenceType,
                referenceId: data.referenceId, // Prisma will handle string to ObjectId conversion if valid
                fileType: data.fileType,
                fileUrl: data.fileUrl,
                uploadedBy: data.uploadedBy || "ADMIN",
                updatedByAdminId: data.adminId,
                verificationStatus: "UNVERIFIED",
            },
        });
    }
    throw new Error("Invalid attachment data. Provide either 3-ID link or referenceType/referenceId/fileUrl.");
};
exports.createAttachment = createAttachment;
const getAllAttachments = async (filters) => {
    const attachments = await prisma_1.prisma.attachment.findMany({
        where: {
            ...(filters?.vendorId && { vendorId: filters.vendorId }),
            ...(filters?.partnerId && { partnerId: filters.partnerId }),
            ...(filters?.vehicleId && { vehicleId: filters.vehicleId }),
            ...(filters?.verificationStatus && { verificationStatus: filters.verificationStatus }),
        },
        include: {
            vendor: true,
            partner: true,
            vehicle: true,
        },
        orderBy: { createdAt: "desc" },
    });
    return attachments;
};
exports.getAllAttachments = getAllAttachments;
const updateAttachmentStatus = async (id, status, adminId) => {
    return await prisma_1.prisma.attachment.update({
        where: { id },
        data: {
            status,
            ...(adminId && { updatedByAdminId: adminId })
        },
    });
};
exports.updateAttachmentStatus = updateAttachmentStatus;
const deleteAttachment = async (id) => {
    return await prisma_1.prisma.attachment.delete({
        where: { id },
    });
};
exports.deleteAttachment = deleteAttachment;
/* ============================================
    ADMIN ENTITY CREATION
============================================ */
const createVendorByAdmin = async (data) => {
    return await vendorAuthService.registerVendor(data);
};
exports.createVendorByAdmin = createVendorByAdmin;
const createPartnerByAdmin = async (data) => {
    return await partnerAuthService.registerPartner(data);
};
exports.createPartnerByAdmin = createPartnerByAdmin;
const createManualRideByAdmin = async (adminId, data) => {
    // 1. Handle User (Find or Create)
    let user;
    if (data.userId) {
        user = await prisma_1.prisma.user.findUnique({ where: { id: data.userId } });
    }
    else if (data.userPhone) {
        user = await prisma_1.prisma.user.findUnique({ where: { phone: data.userPhone } });
        if (!user) {
            if (!data.userName)
                throw new Error("User name is required for new user creation");
            const uniqueOtp = await (0, generateUniqueOtp_1.generateUnique4DigitOtp)();
            user = await prisma_1.prisma.user.create({
                data: {
                    name: data.userName,
                    phone: data.userPhone,
                    uniqueOtp,
                },
            });
        }
    }
    if (!user)
        throw new Error("User identification failed");
    // 1b. Handle Agent Code
    let agentId = null;
    if (data.agentCode) {
        const agent = await prisma_1.prisma.agent.findUnique({
            where: { agentCode: data.agentCode },
        });
        if (agent) {
            agentId = agent.id;
        }
    }
    // 2. Fare Calculation (Similar to ride.service.ts)
    const vehicleType = await prisma_1.prisma.vehicleType.findUnique({
        where: { id: data.vehicleTypeId },
    });
    if (!vehicleType)
        throw new Error("Vehicle type not found");
    // Check city pricing first
    const cityPricing = await prisma_1.prisma.cityPricing.findUnique({
        where: {
            cityCodeId_vehicleTypeId: {
                cityCodeId: data.cityCodeId,
                vehicleTypeId: data.vehicleTypeId,
            },
        },
    });
    let baseFare, perKmPrice, totalFare;
    if (cityPricing) {
        baseFare = cityPricing.baseFare;
        perKmPrice = cityPricing.perKmAfterBase;
        const billableKm = Math.max(0, data.distanceKm - cityPricing.baseKm);
        totalFare = baseFare + (billableKm * perKmPrice);
    }
    else {
        // Fallback to global config
        const pricingConfig = await prisma_1.prisma.pricingConfig.findFirst({
            where: { isActive: true },
        });
        if (!pricingConfig)
            throw new Error("Pricing configuration not found");
        baseFare = vehicleType.baseFare || pricingConfig.baseFare;
        perKmPrice = vehicleType.pricePerKm;
        totalFare = baseFare + (perKmPrice * data.distanceKm);
    }
    // 3. Generate Custom ID
    const cityCodeEntry = await prisma_1.prisma.cityCode.findUnique({
        where: { id: data.cityCodeId },
    });
    if (!cityCodeEntry)
        throw new Error("Invalid city code ID");
    const customId = await (0, city_service_1.generateEntityCustomId)(cityCodeEntry.code, "RIDE");
    // 4. Create Ride
    const ride = await prisma_1.prisma.ride.create({
        data: {
            userId: user.id,
            vehicleTypeId: data.vehicleTypeId,
            pickupLat: data.pickupLat,
            pickupLng: data.pickupLng,
            pickupAddress: data.pickupAddress,
            dropLat: data.dropLat,
            dropLng: data.dropLng,
            dropAddress: data.dropAddress,
            distanceKm: data.distanceKm,
            baseFare,
            perKmPrice,
            totalFare,
            status: "SCHEDULED",
            isManualBooking: true,
            scheduledDateTime: new Date(data.scheduledDateTime),
            bookingNotes: data.bookingNotes || null,
            cityCodeId: data.cityCodeId,
            customId,
            assignedByAdminId: adminId,
            agentId,
            agentCode: data.agentCode || null,
            corporateId: data.corporateId || null,
            paymentMode: data.paymentMode || "CASH",
            rideType: data.rideType || "LOCAL",
            altMobile: data.altMobile || null,
        },
        include: {
            user: true,
            vehicleType: true,
        },
    });
    // 5. Notify
    (0, socket_service_1.emitManualRideCreated)(ride);
    return ride;
};
exports.createManualRideByAdmin = createManualRideByAdmin;
/* ============================================
    ADMIN DASHBOARD (Global overview)
============================================ */
const getAdminDashboard = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [totalUsers, totalVendors, totalPartners, totalVehicles, totalRides, totalAgents, totalCorporates, completedRides, activeRides, todayRides, todayNewUsers, revenue, todayRevenue, onlinePartners,] = await Promise.all([
        prisma_1.prisma.user.count(),
        prisma_1.prisma.vendor.count(),
        prisma_1.prisma.partner.count(),
        prisma_1.prisma.vehicle.count(),
        prisma_1.prisma.ride.count(),
        prisma_1.prisma.agent.count(),
        prisma_1.prisma.corporate.count(),
        prisma_1.prisma.ride.count({ where: { status: "COMPLETED" } }),
        prisma_1.prisma.ride.count({
            where: {
                status: { in: ["ACCEPTED", "ASSIGNED", "STARTED", "ARRIVED", "ONGOING"] },
            },
        }),
        prisma_1.prisma.ride.count({ where: { createdAt: { gte: today } } }),
        prisma_1.prisma.user.count({ where: { createdAt: { gte: today } } }),
        prisma_1.prisma.ride.aggregate({
            where: { status: "COMPLETED" },
            _sum: { totalFare: true, riderEarnings: true, commission: true },
        }),
        prisma_1.prisma.ride.aggregate({
            where: { status: "COMPLETED", createdAt: { gte: today } },
            _sum: { totalFare: true, commission: true },
        }),
        prisma_1.prisma.partner.count({ where: { isOnline: true } }),
    ]);
    return {
        entities: {
            users: totalUsers,
            vendors: totalVendors,
            partners: totalPartners,
            vehicles: totalVehicles,
            agents: totalAgents,
            corporates: totalCorporates,
            onlinePartners,
        },
        rides: {
            total: totalRides,
            completed: completedRides,
            active: activeRides,
            today: todayRides,
        },
        revenue: {
            total: revenue._sum.totalFare || 0,
            partnerEarnings: revenue._sum.riderEarnings || 0,
            commission: revenue._sum.commission || 0,
            todayRevenue: todayRevenue._sum.totalFare || 0,
            todayCommission: todayRevenue._sum.commission || 0,
        },
        todayNewUsers,
    };
};
exports.getAdminDashboard = getAdminDashboard;
/* ============================================
    ADMIN REVENUE ANALYTICS
============================================ */
const getRevenueAnalytics = async () => {
    // By payment mode
    const byPaymentMode = await prisma_1.prisma.ride.groupBy({
        by: ["paymentMode"],
        where: { status: "COMPLETED" },
        _count: true,
        _sum: { totalFare: true, commission: true },
    });
    // Last 30 days daily
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentRides = await prisma_1.prisma.ride.findMany({
        where: {
            status: "COMPLETED",
            createdAt: { gte: thirtyDaysAgo },
        },
        select: {
            totalFare: true,
            commission: true,
            riderEarnings: true,
            createdAt: true,
        },
        orderBy: { createdAt: "asc" },
    });
    const dailyRevenue = {};
    recentRides.forEach((ride) => {
        const dateKey = ride.createdAt.toISOString().split("T")[0];
        if (!dailyRevenue[dateKey]) {
            dailyRevenue[dateKey] = { revenue: 0, commission: 0, rides: 0 };
        }
        dailyRevenue[dateKey].revenue += ride.totalFare || 0;
        dailyRevenue[dateKey].commission += ride.commission || 0;
        dailyRevenue[dateKey].rides += 1;
    });
    return {
        byPaymentMode: byPaymentMode.map((pm) => ({
            mode: pm.paymentMode,
            count: pm._count,
            revenue: pm._sum.totalFare || 0,
            commission: pm._sum.commission || 0,
        })),
        dailyRevenue: Object.entries(dailyRevenue).map(([date, data]) => ({
            date,
            ...data,
        })),
    };
};
exports.getRevenueAnalytics = getRevenueAnalytics;
/* ============================================
    ADMIN RIDE ANALYTICS
============================================ */
const getRideAnalytics = async () => {
    // Status distribution
    const statusDistribution = await prisma_1.prisma.ride.groupBy({
        by: ["status"],
        _count: true,
    });
    // By vehicle type
    const byVehicleType = await prisma_1.prisma.ride.groupBy({
        by: ["vehicleTypeId"],
        where: { vehicleTypeId: { not: null } },
        _count: true,
        _sum: { totalFare: true },
    });
    // Fetch vehicle type names
    const vehicleTypeIds = byVehicleType.map((vt) => vt.vehicleTypeId).filter(Boolean);
    const vehicleTypes = await prisma_1.prisma.vehicleType.findMany({
        where: { id: { in: vehicleTypeIds } },
        select: { id: true, displayName: true, category: true },
    });
    const vehicleTypeMap = new Map(vehicleTypes.map((vt) => [vt.id, vt]));
    // Manual vs app bookings
    const [manualBookings, appBookings] = await Promise.all([
        prisma_1.prisma.ride.count({ where: { isManualBooking: true } }),
        prisma_1.prisma.ride.count({ where: { isManualBooking: false } }),
    ]);
    return {
        statusDistribution: statusDistribution.map((s) => ({
            status: s.status,
            count: s._count,
        })),
        byVehicleType: byVehicleType.map((vt) => ({
            vehicleTypeId: vt.vehicleTypeId,
            vehicleType: vehicleTypeMap.get(vt.vehicleTypeId || "") || null,
            count: vt._count,
            revenue: vt._sum.totalFare || 0,
        })),
        bookingType: {
            manual: manualBookings,
            app: appBookings,
        },
    };
};
exports.getRideAnalytics = getRideAnalytics;
/* ============================================
    ADMIN ENTITY STATUS OVERVIEW
============================================ */
const getEntityStatusOverview = async () => {
    const [vendorStatus, partnerStatus, corporateStatus] = await Promise.all([
        prisma_1.prisma.vendor.groupBy({
            by: ["status"],
            _count: true,
        }),
        prisma_1.prisma.partner.groupBy({
            by: ["status"],
            _count: true,
        }),
        prisma_1.prisma.corporate.groupBy({
            by: ["status"],
            _count: true,
        }),
    ]);
    return {
        vendors: vendorStatus.map((s) => ({ status: s.status, count: s._count })),
        partners: partnerStatus.map((s) => ({ status: s.status, count: s._count })),
        corporates: corporateStatus.map((s) => ({ status: s.status, count: s._count })),
    };
};
exports.getEntityStatusOverview = getEntityStatusOverview;
/* ============================================
    ADMIN RECENT ACTIVITY
============================================ */
const getRecentActivity = async (limit = 20) => {
    const [recentRides, recentVendors, recentPartners, recentUsers] = await Promise.all([
        prisma_1.prisma.ride.findMany({
            take: limit,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                customId: true,
                status: true,
                totalFare: true,
                createdAt: true,
                user: { select: { id: true, name: true } },
                partner: { select: { id: true, customId: true, name: true } },
            },
        }),
        prisma_1.prisma.vendor.findMany({
            take: 10,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                customId: true,
                name: true,
                companyName: true,
                status: true,
                createdAt: true,
            },
        }),
        prisma_1.prisma.partner.findMany({
            take: 10,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                customId: true,
                name: true,
                status: true,
                createdAt: true,
            },
        }),
        prisma_1.prisma.user.findMany({
            take: 10,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                phone: true,
                createdAt: true,
            },
        }),
    ]);
    return {
        recentRides,
        recentVendors,
        recentPartners,
        recentUsers,
    };
};
exports.getRecentActivity = getRecentActivity;
