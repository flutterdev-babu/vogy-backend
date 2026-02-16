"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFareEstimate = exports.assignPartnerToRide = exports.updateAgentRideStatus = exports.createAgentManualRide = exports.getAgentPartners = exports.getAgentVendorRides = exports.getOverallRides = void 0;
const prisma_1 = require("../../config/prisma");
const socket_service_1 = require("../socket/socket.service");
/* ============================================
    GET OVERALL RIDES (All rides in system)
============================================ */
const getOverallRides = async (filters) => {
    const where = {};
    if (filters?.status) {
        where.status = filters.status;
    }
    if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters?.startDate)
            where.createdAt.gte = filters.startDate;
        if (filters?.endDate)
            where.createdAt.lte = filters.endDate;
    }
    if (filters?.search) {
        where.OR = [
            { pickupAddress: { contains: filters.search, mode: "insensitive" } },
            { dropAddress: { contains: filters.search, mode: "insensitive" } },
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
                },
            },
            partner: {
                select: {
                    id: true,
                    customId: true,
                    name: true,
                    phone: true,
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
            vehicle: {
                select: {
                    id: true,
                    customId: true,
                    registrationNumber: true,
                    vehicleModel: true,
                },
            },
            agent: {
                select: {
                    id: true,
                    customId: true,
                    name: true,
                },
            },
            vehicleType: {
                select: {
                    id: true,
                    name: true,
                    displayName: true,
                    category: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
    return rides;
};
exports.getOverallRides = getOverallRides;
/* ============================================
    GET AGENT VENDOR RIDES (Rides from agent's vendors)
============================================ */
const getAgentVendorRides = async (agentId, filters) => {
    const vendors = await prisma_1.prisma.vendor.findMany({
        where: { agentId },
        select: { id: true },
    });
    const vendorIds = vendors.map(v => v.id);
    const where = {
        vendorId: { in: vendorIds },
    };
    if (filters?.status) {
        where.status = filters.status;
    }
    if (filters?.vendorId) {
        where.vendorId = filters.vendorId;
    }
    const rides = await prisma_1.prisma.ride.findMany({
        where,
        include: {
            user: {
                select: { id: true, name: true, phone: true },
            },
            partner: {
                select: { id: true, customId: true, name: true, phone: true },
            },
            vendor: {
                select: { id: true, customId: true, name: true, companyName: true },
            },
            vehicle: {
                select: { id: true, customId: true, registrationNumber: true, vehicleModel: true },
            },
            vehicleType: true,
        },
        orderBy: { createdAt: "desc" },
    });
    return rides;
};
exports.getAgentVendorRides = getAgentVendorRides;
/* ============================================
    GET AGENT PARTNERS (Partners under agent's vendors)
============================================ */
const getAgentPartners = async (agentId, filters) => {
    const vendors = await prisma_1.prisma.vendor.findMany({
        where: { agentId },
        select: { id: true },
    });
    const vendorIds = vendors.map(v => v.id);
    const vehicles = await prisma_1.prisma.vehicle.findMany({
        where: { vendorId: { in: vendorIds } },
        select: { id: true },
    });
    const vehicleIds = vehicles.map(v => v.id);
    const where = {
        vehicleId: { in: vehicleIds },
    };
    if (filters?.status) {
        where.status = filters.status;
    }
    if (filters?.search) {
        where.OR = [
            { name: { contains: filters.search, mode: "insensitive" } },
            { phone: { contains: filters.search } },
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
            status: true,
            hasOwnVehicle: true,
            ownVehicleNumber: true,
            ownVehicleModel: true,
            rating: true,
            totalEarnings: true,
            vehicle: {
                select: {
                    id: true,
                    customId: true,
                    registrationNumber: true,
                    vehicleModel: true,
                    vendor: {
                        select: { id: true, customId: true, name: true, companyName: true },
                    },
                },
            },
            _count: { select: { rides: true } },
            createdAt: true,
        },
        orderBy: { createdAt: "desc" },
    });
    return partners;
};
exports.getAgentPartners = getAgentPartners;
/* ============================================
    CREATE AGENT MANUAL RIDE
============================================ */
const createAgentManualRide = async (agentId, data) => {
    // Get city code for ID generation
    const cityCodeEntry = await prisma_1.prisma.cityCode.findUnique({
        where: { id: data.cityCodeId },
    });
    if (!cityCodeEntry) {
        throw new Error("Invalid city code ID");
    }
    const { generateEntityCustomId } = require("../city/city.service");
    const customId = await generateEntityCustomId(cityCodeEntry.code, "RIDE");
    let user = await prisma_1.prisma.user.findUnique({
        where: { phone: data.userPhone },
    });
    if (!user) {
        const { generateUnique4DigitOtp } = require("../../utils/generateUniqueOtp");
        const uniqueOtp = await generateUnique4DigitOtp();
        user = await prisma_1.prisma.user.create({
            data: {
                name: data.userName,
                phone: data.userPhone,
                uniqueOtp: uniqueOtp,
            },
        });
    }
    const ride = await prisma_1.prisma.ride.create({
        data: {
            userId: user.id,
            vehicleTypeId: data.vehicleTypeId,
            vendorId: data.vendorId,
            partnerId: data.partnerId,
            vehicleId: data.vehicleId,
            agentId: agentId,
            pickupAddress: data.pickupAddress,
            pickupLat: data.pickupLat,
            pickupLng: data.pickupLng,
            dropAddress: data.dropAddress,
            dropLat: data.dropLat,
            dropLng: data.dropLng,
            distanceKm: data.distanceKm,
            baseFare: data.baseFare,
            perKmPrice: data.perKmPrice,
            totalFare: data.totalFare,
            riderEarnings: data.partnerAmount,
            commission: data.totalFare - data.partnerAmount,
            paymentMode: data.paymentMode,
            status: data.scheduledDateTime ? "SCHEDULED" : "INITIATED",
            isManualBooking: true,
            scheduledDateTime: data.scheduledDateTime || null,
            bookingNotes: data.bookingNotes || null,
            acceptedAt: data.scheduledDateTime ? null : new Date(),
            assignedByAdminId: agentId,
            cityCodeId: data.cityCodeId,
            customId: customId,
        },
        include: {
            user: true,
            partner: true,
            vendor: true,
            vehicle: true,
            vehicleType: true,
        },
    });
    // Notify user and admins
    (0, socket_service_1.emitManualRideCreated)(ride);
    // If partner is assigned, notify user and partner
    if (ride.partnerId) {
        (0, socket_service_1.emitRiderAssigned)(ride);
    }
    return ride;
};
exports.createAgentManualRide = createAgentManualRide;
/* ============================================
    UPDATE AGENT RIDE STATUS
============================================ */
const updateAgentRideStatus = async (agentId, rideId, status, reason) => {
    const ride = await prisma_1.prisma.ride.findUnique({
        where: { id: rideId },
    });
    if (!ride)
        throw new Error("Ride not found");
    // Authorization check
    const managedVendors = await prisma_1.prisma.vendor.findMany({
        where: { agentId },
        select: { id: true },
    });
    const managedVendorIds = managedVendors.map(v => v.id);
    const isAuthorized = ride.agentId === agentId || (ride.vendorId && managedVendorIds.includes(ride.vendorId));
    if (!isAuthorized) {
        throw new Error("Unauthorized to update this ride information");
    }
    const updateData = { status };
    if (status === "ARRIVED") {
        updateData.arrivedAt = new Date();
    }
    if (status === "STARTED") {
        updateData.startTime = new Date();
    }
    if (status === "COMPLETED") {
        updateData.endTime = new Date();
        updateData.paymentStatus = "COMPLETED";
    }
    if (status === "CANCELLED" && reason) {
        updateData.bookingNotes = (ride.bookingNotes || "") + ` | Cancelled: ${reason}`;
    }
    const updatedRide = await prisma_1.prisma.ride.update({
        where: { id: rideId },
        data: updateData,
        include: {
            user: true,
            partner: true,
            vendor: true,
            vehicle: true,
            vehicleType: true,
        },
    });
    if (updatedRide.status === "ACCEPTED")
        (0, socket_service_1.emitRideAccepted)(updatedRide);
    if (updatedRide.status === "ARRIVED")
        (0, socket_service_1.emitRideArrived)(updatedRide);
    if (updatedRide.status === "STARTED")
        (0, socket_service_1.emitRideStarted)(updatedRide);
    if (updatedRide.status === "COMPLETED")
        (0, socket_service_1.emitRideCompleted)(updatedRide);
    if (updatedRide.status === "CANCELLED")
        (0, socket_service_1.emitRideCancelled)(updatedRide, "USER");
    if (status === "COMPLETED" && ride.partnerId && ride.riderEarnings) {
        await prisma_1.prisma.partner.update({
            where: { id: ride.partnerId },
            data: { totalEarnings: { increment: ride.riderEarnings } },
        });
    }
    return updatedRide;
};
exports.updateAgentRideStatus = updateAgentRideStatus;
/* ============================================
    ASSIGN PARTNER TO RIDE
============================================ */
const assignPartnerToRide = async (agentId, rideId, partnerId, vehicleId) => {
    const ride = await prisma_1.prisma.ride.findUnique({
        where: { id: rideId },
    });
    if (!ride)
        throw new Error("Ride not found");
    // Authorization check
    const managedVendors = await prisma_1.prisma.vendor.findMany({
        where: { agentId },
        select: { id: true },
    });
    const managedVendorIds = managedVendors.map(v => v.id);
    const isAuthorized = ride.agentId === agentId || (ride.vendorId && managedVendorIds.includes(ride.vendorId));
    if (!isAuthorized) {
        throw new Error("Unauthorized to assign partner to this ride");
    }
    if (ride.partnerId)
        throw new Error("Ride already has a partner assigned");
    const partner = await prisma_1.prisma.partner.findUnique({ where: { id: partnerId } });
    if (!partner)
        throw new Error("Partner not found");
    const vehicle = await prisma_1.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle)
        throw new Error("Vehicle not found");
    const updatedRide = await prisma_1.prisma.ride.update({
        where: { id: rideId },
        data: {
            partnerId,
            vehicleId,
            vendorId: vehicle.vendorId,
            status: "ACCEPTED",
            acceptedAt: new Date(),
        },
        include: {
            user: true,
            partner: true,
            vendor: true,
            vehicle: true,
            vehicleType: true,
        },
    });
    // Notify user and partner about the assignment
    (0, socket_service_1.emitRiderAssigned)(updatedRide);
    return updatedRide;
};
exports.assignPartnerToRide = assignPartnerToRide;
/* ============================================
    GET FARE ESTIMATE (For Agent Manual Booking)
============================================ */
const getFareEstimate = async (distanceKm) => {
    // Get active pricing config
    const pricingConfig = await prisma_1.prisma.pricingConfig.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
    });
    if (!pricingConfig) {
        throw new Error("Pricing configuration not found");
    }
    // Get all active vehicle types
    const vehicleTypes = await prisma_1.prisma.vehicleType.findMany({
        where: { isActive: true },
        orderBy: { pricePerKm: "asc" },
    });
    // Calculate fare for each vehicle type
    const estimates = vehicleTypes.map((vt) => {
        const baseFare = vt.baseFare ?? pricingConfig.baseFare ?? 20;
        const totalFare = baseFare + (vt.pricePerKm * distanceKm);
        const partnerAmount = (totalFare * pricingConfig.riderPercentage) / 100;
        return {
            vehicleTypeId: vt.id,
            category: vt.category,
            name: vt.name,
            displayName: vt.displayName,
            baseFare,
            perKmPrice: vt.pricePerKm,
            totalFare: Math.round(totalFare * 100) / 100,
            partnerAmount: Math.round(partnerAmount * 100) / 100,
            distanceKm,
        };
    });
    return {
        distanceKm,
        estimates,
        pricingConfig: {
            baseFare: pricingConfig.baseFare,
            riderPercentage: pricingConfig.riderPercentage,
        },
    };
};
exports.getFareEstimate = getFareEstimate;
