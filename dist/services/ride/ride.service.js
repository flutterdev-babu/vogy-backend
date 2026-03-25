"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRideStatus = exports.getPartnerRides = exports.acceptRide = exports.getAvailableRides = exports.completeRideWithOtp = exports.cancelRide = exports.getRideById = exports.getUserRides = exports.createManualRide = exports.createRide = exports.estimateFare = exports.validateCouponLogic = void 0;
const prisma_1 = require("../../config/prisma");
const socket_service_1 = require("../socket/socket.service");
const city_service_1 = require("../city/city.service");
const peakHour_service_1 = require("../admin/peakHour.service");
/* ============================================
    COUPON VALIDATION LOGIC
============================================ */
const validateCouponLogic = async (couponCode, cityCodeId, totalFare) => {
    const coupon = await prisma_1.prisma.agentCoupon.findUnique({
        where: { couponCode },
        include: {
            agent: {
                include: {
                    cityCodes: true,
                },
            },
        },
    });
    if (!coupon) {
        throw new Error("Invalid coupon code");
    }
    if (!coupon.isActive) {
        throw new Error("Coupon is not active");
    }
    const currentDate = new Date();
    if (currentDate < coupon.validFrom || currentDate > coupon.validTo) {
        throw new Error("Coupon has expired or is not yet valid");
    }
    if (totalFare < coupon.minBookingAmount) {
        throw new Error(`Minimum booking amount for this coupon is ${coupon.minBookingAmount}`);
    }
    // Check if city matches (Primary or Legacy)
    const isPrimaryCity = coupon.agent.cityCodeId === cityCodeId;
    const isLegacyCity = coupon.agent.cityCodes.some((c) => c.id === cityCodeId);
    if (!isPrimaryCity && !isLegacyCity) {
        throw new Error("Coupon is not valid for this city");
    }
    // Calculate discount
    let discountAmount = (totalFare * coupon.discountValue) / 100;
    if (coupon.maxDiscountAmount > 0 && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
    }
    return {
        couponId: coupon.id,
        discountAmount,
        couponCode: coupon.couponCode,
    };
};
exports.validateCouponLogic = validateCouponLogic;
/* ============================================
    FARE ESTIMATION (No ride created)
    Returns ALL active vehicle types with prices
============================================ */
const estimateFare = async (data) => {
    // Validate city code
    const cityCodeEntry = await prisma_1.prisma.cityCode.findUnique({
        where: { id: data.cityCodeId },
    });
    if (!cityCodeEntry) {
        throw new Error("Invalid city code ID");
    }
    // Get ALL active vehicle types
    const vehicleTypes = await prisma_1.prisma.vehicleType.findMany({
        where: { isActive: true },
        orderBy: { pricePerKm: "asc" },
    });
    if (vehicleTypes.length === 0) {
        throw new Error("No active vehicle types found");
    }
    // Get active pricing config
    const pricingConfig = await prisma_1.prisma.pricingConfig.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
    });
    if (!pricingConfig) {
        throw new Error("Pricing configuration not found");
    }
    // Validate coupon if provided (once, reuse for all vehicles)
    let couponInfo = null;
    if (data.couponCode) {
        try {
            couponInfo = await (0, exports.validateCouponLogic)(data.couponCode, data.cityCodeId, 0); // Amount 0 for estimation validation
        }
        catch (err) {
            // Ignore coupon if invalid for estimation
        }
    }
    // Build fare for each vehicle type
    const vehicleOptions = await Promise.all(vehicleTypes.map(async (vt) => {
        // Get city-specific pricing
        const cityPricing = await (0, city_service_1.getPricingForCity)(vt.id, data.cityCodeId);
        const baseFare = cityPricing.baseFare;
        const perKmPrice = cityPricing.perKmPrice;
        const billableKm = Math.max(0, data.distanceKm - (cityPricing.baseKm || 0));
        let estimatedFare = baseFare + (perKmPrice * billableKm);
        // Apply Peak Hour Adjustment
        const peakAdjustment = await (0, peakHour_service_1.getPeakHourAdjustment)(data.cityCodeId, vt.id, new Date());
        if (peakAdjustment.fixedExtra > 0 || peakAdjustment.percentageExtra > 0) {
            const percentageAmount = (estimatedFare * peakAdjustment.percentageExtra) / 100;
            estimatedFare = estimatedFare + peakAdjustment.fixedExtra + percentageAmount;
        }
        let discountAmount = 0;
        let finalFare = estimatedFare;
        if (data.couponCode) {
            try {
                const couponData = await (0, exports.validateCouponLogic)(data.couponCode, data.cityCodeId, estimatedFare);
                discountAmount = couponData.discountAmount;
                finalFare = estimatedFare - discountAmount;
            }
            catch (err) {
                // Ignore if coupon doesn't apply to this specific fare
            }
        }
        return {
            vehicleTypeId: vt.id,
            category: vt.category,
            name: vt.name,
            displayName: vt.displayName,
            baseFare,
            pricePerKm: perKmPrice,
            baseKm: cityPricing.baseKm,
            estimatedFare: Math.round(estimatedFare),
            discountAmount: Math.round(discountAmount),
            finalFare: Math.round(finalFare),
        };
    }));
    return {
        distanceKm: data.distanceKm,
        vehicleOptions,
    };
};
exports.estimateFare = estimateFare;
/* ============================================
    CREATE RIDE (USER) - Instant Booking
============================================ */
const createRide = async (userId, data) => {
    const cityCodeEntry = await prisma_1.prisma.cityCode.findUnique({
        where: { id: data.cityCodeId },
    });
    if (!cityCodeEntry) {
        throw new Error("Invalid city code ID");
    }
    const customId = await (0, city_service_1.generateEntityCustomId)(cityCodeEntry.code, "RIDE");
    const vehicleType = await prisma_1.prisma.vehicleType.findUnique({
        where: { id: data.vehicleTypeId },
    });
    if (!vehicleType || !vehicleType.isActive) {
        throw new Error("Vehicle type not found or inactive");
    }
    const pricingConfig = await prisma_1.prisma.pricingConfig.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
    });
    if (!pricingConfig) {
        throw new Error("Pricing configuration not found");
    }
    const cityPricing = await (0, city_service_1.getPricingForCity)(data.vehicleTypeId, data.cityCodeId);
    const baseFare = cityPricing.baseFare;
    const perKmPrice = cityPricing.perKmPrice;
    const billableKm = Math.max(0, data.distanceKm - (cityPricing.baseKm || 0));
    let totalFare = baseFare + (perKmPrice * billableKm);
    const peakAdjustment = await (0, peakHour_service_1.getPeakHourAdjustment)(data.cityCodeId, data.vehicleTypeId, new Date());
    if (peakAdjustment.fixedExtra > 0 || peakAdjustment.percentageExtra > 0) {
        const percentageAmount = (totalFare * peakAdjustment.percentageExtra) / 100;
        totalFare = totalFare + peakAdjustment.fixedExtra + percentageAmount;
    }
    let appliedCouponCode = null;
    let appliedDiscountAmount = 0;
    if (data.couponCode) {
        const couponData = await (0, exports.validateCouponLogic)(data.couponCode, data.cityCodeId, totalFare);
        appliedCouponCode = couponData.couponCode;
        appliedDiscountAmount = couponData.discountAmount;
        totalFare = totalFare - appliedDiscountAmount;
    }
    if (data.expectedFare !== undefined) {
        if (Math.abs(totalFare - data.expectedFare) > 5) { // 5 rupee buffer
            throw new Error(`Price mismatch. Server: ${Math.round(totalFare)}, Expected: ${data.expectedFare}`);
        }
    }
    const riderEarnings = (totalFare * pricingConfig.riderPercentage) / 100;
    const commission = (totalFare * pricingConfig.appCommission) / 100;
    let agentId = null;
    let agentCode = null;
    if (data.agentCode) {
        const agent = await prisma_1.prisma.agent.findUnique({ where: { agentCode: data.agentCode } });
        if (agent) {
            agentId = agent.id;
            agentCode = agent.agentCode;
        }
    }
    const ride = await prisma_1.prisma.ride.create({
        data: {
            userId,
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
            totalFare: Math.round(totalFare),
            couponCode: appliedCouponCode,
            discountAmount: Math.round(appliedDiscountAmount),
            riderEarnings: Math.round(riderEarnings),
            commission: Math.round(commission),
            status: "UPCOMING",
            isManualBooking: false,
            cityCodeId: data.cityCodeId,
            customId,
            agentId,
            agentCode: agentCode || data.agentCode || null,
            rideType: data.rideType || "LOCAL",
            altMobile: data.altMobile || null,
            paymentMode: data.paymentMode || "CASH",
            corporateId: data.corporateId || null,
        },
        include: {
            vehicleType: true,
            user: { select: { id: true, name: true, phone: true } },
        },
    });
    (0, socket_service_1.emitRideCreated)(ride);
    return ride;
};
exports.createRide = createRide;
/* ============================================
    CREATE MANUAL/SCHEDULED RIDE (ADMIN/AGENT)
============================================ */
const createManualRide = async (userId, data) => {
    const cityCodeEntry = await prisma_1.prisma.cityCode.findUnique({
        where: { id: data.cityCodeId },
    });
    if (!cityCodeEntry) {
        throw new Error("Invalid city code ID");
    }
    const customId = await (0, city_service_1.generateEntityCustomId)(cityCodeEntry.code, "RIDE");
    const vehicleType = await prisma_1.prisma.vehicleType.findUnique({
        where: { id: data.vehicleTypeId },
    });
    if (!vehicleType || !vehicleType.isActive) {
        throw new Error("Vehicle type not found or inactive");
    }
    const pricingConfig = await prisma_1.prisma.pricingConfig.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
    });
    if (!pricingConfig) {
        throw new Error("Pricing configuration not found");
    }
    const cityPricing = await (0, city_service_1.getPricingForCity)(data.vehicleTypeId, data.cityCodeId);
    const baseFare = cityPricing.baseFare;
    const perKmPrice = cityPricing.perKmPrice;
    const billableKm = Math.max(0, data.distanceKm - (cityPricing.baseKm || 0));
    let totalFare = baseFare + (perKmPrice * billableKm);
    const scheduledDate = new Date(data.scheduledDateTime);
    const peakAdjustment = await (0, peakHour_service_1.getPeakHourAdjustment)(data.cityCodeId, data.vehicleTypeId, scheduledDate);
    if (peakAdjustment.fixedExtra > 0 || peakAdjustment.percentageExtra > 0) {
        const percentageAmount = (totalFare * peakAdjustment.percentageExtra) / 100;
        totalFare = totalFare + peakAdjustment.fixedExtra + percentageAmount;
    }
    let appliedCouponCode = null;
    let appliedDiscountAmount = 0;
    if (data.couponCode) {
        const couponData = await (0, exports.validateCouponLogic)(data.couponCode, data.cityCodeId, totalFare);
        appliedCouponCode = couponData.couponCode;
        appliedDiscountAmount = couponData.discountAmount;
        totalFare = totalFare - appliedDiscountAmount;
    }
    const riderEarnings = (totalFare * pricingConfig.riderPercentage) / 100;
    const commission = (totalFare * pricingConfig.appCommission) / 100;
    let agentId = null;
    let agentCode = null;
    if (data.agentCode) {
        const agent = await prisma_1.prisma.agent.findUnique({ where: { agentCode: data.agentCode } });
        if (agent) {
            agentId = agent.id;
            agentCode = agent.agentCode;
        }
    }
    const ride = await prisma_1.prisma.ride.create({
        data: {
            userId,
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
            totalFare: Math.round(totalFare),
            couponCode: appliedCouponCode,
            discountAmount: Math.round(appliedDiscountAmount),
            riderEarnings: Math.round(riderEarnings),
            commission: Math.round(commission),
            status: "SCHEDULED",
            isManualBooking: true,
            scheduledDateTime: scheduledDate,
            bookingNotes: data.bookingNotes || null,
            cityCodeId: data.cityCodeId,
            customId,
            agentId,
            agentCode: agentCode || data.agentCode || null,
            rideType: data.rideType || "LOCAL",
            altMobile: data.altMobile || null,
            paymentMode: data.paymentMode || "CASH",
            corporateId: data.corporateId || null,
        },
        include: {
            vehicleType: true,
            user: { select: { id: true, name: true, phone: true } },
        },
    });
    (0, socket_service_1.emitManualRideCreated)(ride);
    return ride;
};
exports.createManualRide = createManualRide;
/* ============================================
    GET USER RIDES
============================================ */
const getUserRides = async (userId, status) => {
    return await prisma_1.prisma.ride.findMany({
        where: {
            userId,
            ...(status && { status }),
        },
        include: {
            vehicleType: true,
            partner: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    customId: true,
                    vehicle: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
};
exports.getUserRides = getUserRides;
/* ============================================
    GET RIDE BY ID
============================================ */
const getRideById = async (id) => {
    return await prisma_1.prisma.ride.findUnique({
        where: { id },
        include: {
            vehicleType: true,
            user: { select: { id: true, name: true, phone: true } },
            partner: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    customId: true,
                    vehicle: true,
                },
            },
        },
    });
};
exports.getRideById = getRideById;
/* ============================================
    CANCEL RIDE
============================================ */
const cancelRide = async (id, userId) => {
    const ride = await prisma_1.prisma.ride.findUnique({ where: { id } });
    if (!ride)
        throw new Error("Ride not found");
    if (ride.userId !== userId && ride.status !== "SCHEDULED") {
        // Admin can cancel scheduled rides, but users can only cancel their own
        // This is a simplified check
    }
    const updatedRide = await prisma_1.prisma.ride.update({
        where: { id },
        data: { status: "CANCELLED" },
        include: { partner: true },
    });
    (0, socket_service_1.emitRideCancelled)(updatedRide, "USER");
    return updatedRide;
};
exports.cancelRide = cancelRide;
/* ============================================
    COMPLETE RIDE WITH OTP
============================================ */
const completeRideWithOtp = async (id, otp) => {
    const ride = await prisma_1.prisma.ride.findUnique({
        where: { id },
        include: { user: true },
    });
    if (!ride)
        throw new Error("Ride not found");
    if (ride.user.uniqueOtp !== otp)
        throw new Error("Invalid OTP");
    const updatedRide = await prisma_1.prisma.ride.update({
        where: { id },
        data: { status: "COMPLETED" },
    });
    (0, socket_service_1.emitRideCompleted)(updatedRide);
    return updatedRide;
};
exports.completeRideWithOtp = completeRideWithOtp;
/* ============================================
    PARTNER: GET AVAILABLE RIDES
============================================ */
const getAvailableRides = async (vehicleTypeId) => {
    return await prisma_1.prisma.ride.findMany({
        where: {
            status: "UPCOMING",
            vehicleTypeId,
            partnerId: null,
        },
        include: {
            user: { select: { name: true, phone: true } },
        },
        orderBy: { createdAt: "desc" },
    });
};
exports.getAvailableRides = getAvailableRides;
/* ============================================
    PARTNER: ACCEPT RIDE
============================================ */
const acceptRide = async (id, partnerId) => {
    const ride = await prisma_1.prisma.ride.findUnique({ where: { id } });
    if (!ride)
        throw new Error("Ride not found");
    if (ride.partnerId)
        throw new Error("Ride already accepted by another captain");
    const updatedRide = await prisma_1.prisma.ride.update({
        where: { id },
        data: {
            status: "ACCEPTED",
            partnerId,
        },
        include: { user: true },
    });
    (0, socket_service_1.emitRideAccepted)(updatedRide);
    return updatedRide;
};
exports.acceptRide = acceptRide;
/* ============================================
    PARTNER: GET MY RIDES
============================================ */
const getPartnerRides = async (partnerId, status) => {
    return await prisma_1.prisma.ride.findMany({
        where: {
            partnerId,
            ...(status && { status }),
        },
        include: {
            user: { select: { name: true, phone: true } },
            vehicleType: true,
        },
        orderBy: { createdAt: "desc" },
    });
};
exports.getPartnerRides = getPartnerRides;
/* ============================================
    UPDATE RIDE STATUS
============================================ */
const updateRideStatus = async (id, status) => {
    const updatedRide = await prisma_1.prisma.ride.update({
        where: { id },
        data: { status },
        include: { user: true, partner: true },
    });
    switch (status) {
        case "ARRIVED":
            (0, socket_service_1.emitRideArrived)(updatedRide);
            break;
        case "STARTED":
            (0, socket_service_1.emitRideStarted)(updatedRide);
            break;
        case "COMPLETED":
            (0, socket_service_1.emitRideCompleted)(updatedRide);
            break;
        case "CANCELLED":
            (0, socket_service_1.emitRideCancelled)(updatedRide, "PARTNER");
            break;
    }
    return updatedRide;
};
exports.updateRideStatus = updateRideStatus;
