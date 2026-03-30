import { Response } from "express";
import { AuthedRequest } from "../../middleware/auth.middleware";
import { prisma } from "../../config/prisma";
import {
  createRide,
  createManualRide,
  getUserRides,
  getRideById as getUserRideById,
  cancelRide,
  completeRideWithOtp,
  getAvailableRides,
  acceptRide,
  getPartnerRides,
  updateRideStatus,
  validateCouponLogic,
  estimateFare,
} from "../../services/ride/ride.service";
import { createAuditLog, getRequestContext } from "../../services/audit/auditLog.service";
import { generateUnique4DigitOtp } from "../../utils/generateUniqueOtp";

export default {
  /* ============================================
      USER RIDE CONTROLLERS
  ============================================ */

  // Create a new ride request
  createRide: async (req: AuthedRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      console.log('--- CREATE RIDE REQUEST ---');
      console.log('User ID:', userId);
      console.log('Payload:', req.body);

      const {
        vehicleTypeId,
        pickupLat,
        pickupLng,
        pickupAddress,
        dropLat,
        dropLng,
        dropAddress,
        distanceKm,
        cityCodeId, // NEW
        rideType,
        altMobile,
        paymentMode,
        corporateId,
        agentCode,
        couponCode,
        expectedFare,
        advanceAmount,
        transactionId,
      } = req.body;

      // Validate required fields
      if (!vehicleTypeId) return res.status(400).json({ success: false, message: "vehicleTypeId is required" });
      if (pickupLat === undefined) return res.status(400).json({ success: false, message: "pickupLat is required" });
      if (pickupLng === undefined) return res.status(400).json({ success: false, message: "pickupLng is required" });
      if (!pickupAddress) return res.status(400).json({ success: false, message: "pickupAddress is required" });
      if (dropLat === undefined) return res.status(400).json({ success: false, message: "dropLat is required" });
      if (dropLng === undefined) return res.status(400).json({ success: false, message: "dropLng is required" });
      if (!dropAddress) return res.status(400).json({ success: false, message: "dropAddress is required" });
      if (distanceKm === undefined) return res.status(400).json({ success: false, message: "distanceKm is required" });
      if (!cityCodeId) return res.status(400).json({ success: false, message: "cityCodeId is required" });

      const ride = await createRide(userId, {
        vehicleTypeId,
        pickupLat: parseFloat(pickupLat),
        pickupLng: parseFloat(pickupLng),
        pickupAddress,
        dropLat: parseFloat(dropLat),
        dropLng: parseFloat(dropLng),
        dropAddress,
        distanceKm: parseFloat(distanceKm),
        cityCodeId, // NEW
        rideType,
        altMobile,
        paymentMode,
        corporateId,
        agentCode,
        couponCode,
        expectedFare: expectedFare ? parseFloat(expectedFare) : undefined,
        advanceAmount: advanceAmount ? parseFloat(advanceAmount) : undefined,
        transactionId,
      });

      createAuditLog({ userId, userName: req.user?.name, userRole: "USER", action: "CREATE", module: "RIDE", entityId: ride.id, description: `User created ride from ${pickupAddress} to ${dropAddress}`, ...getRequestContext(req) });

      return res.status(201).json({
        success: true,
        message: "Ride created successfully",
        data: ride,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to create ride",
      });
    }
  },

  // Create a manual/scheduled ride request
  createManualRide: async (req: AuthedRequest, res: Response) => {
    try {
      console.log("🚀 Entering createManualRide controller");
      let userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // If the caller is an ADMIN (or Agent/Vendor), they are booking on behalf of a user
      if (req.user?.role === "ADMIN" || req.user?.role === "AGENT" || req.user?.role === "PARTNER" || req.user?.role === "VENDOR") {
        const { userPhone, userName, email } = req.body;
        if (!userPhone || !userName) {
          return res.status(400).json({ success: false, message: "userPhone and userName are required for manual bookings" });
        }

        console.log(`👤 Booking on behalf of user: ${userPhone} (${userName})`);
        let user = await prisma.user.findUnique({ where: { phone: userPhone } });
        if (!user) {
          console.log("🆕 User not found, creating new user...");
          const uniqueOtp = await generateUnique4DigitOtp();
          user = await prisma.user.create({
            data: { phone: userPhone, name: userName, email: email || null, uniqueOtp }
          });
          console.log(`✅ New user created: ${user.id}`);
        } else if (!user.name || user.name === "User") {
          console.log("📝 Updating existing user name...");
          user = await prisma.user.update({
            where: { id: user.id },
            data: { name: userName, ...(email ? { email } : {}) }
          });
        }
        userId = user.id;
      }

      console.log(`📍 Calling createManualRide service for userId: ${userId}`);


      const {
        vehicleTypeId,
        pickupLat,
        pickupLng,
        pickupAddress,
        dropLat,
        dropLng,
        dropAddress,
        distanceKm,
        scheduledDateTime,
        bookingNotes,
        cityCodeId, // NEW
        rideType,
        altMobile,
        paymentMode,
        corporateId,
        agentCode,
        couponCode,
        expectedFare,
        advanceAmount,
        transactionId,
      } = req.body;

      // Validate required fields
      if (
        !vehicleTypeId ||
        pickupLat === undefined ||
        pickupLng === undefined ||
        !pickupAddress ||
        dropLat === undefined ||
        dropLng === undefined ||
        !dropAddress ||
        distanceKm === undefined ||
        !scheduledDateTime ||
        !cityCodeId // NEW
      ) {
        return res.status(400).json({
          success: false,
          message:
            "vehicleTypeId, pickupLat, pickupLng, pickupAddress, dropLat, dropLng, dropAddress, distanceKm, scheduledDateTime, and cityCodeId are required",
        });
      }

      const ride = await createManualRide(userId, {
        vehicleTypeId,
        pickupLat: parseFloat(pickupLat),
        pickupLng: parseFloat(pickupLng),
        pickupAddress,
        dropLat: parseFloat(dropLat),
        dropLng: parseFloat(dropLng),
        dropAddress,
        distanceKm: parseFloat(distanceKm),
        scheduledDateTime: new Date(scheduledDateTime),
        bookingNotes,
        cityCodeId, // NEW
        rideType,
        altMobile,
        paymentMode,
        corporateId,
        agentCode,
        couponCode,
        expectedFare: expectedFare ? parseFloat(expectedFare) : undefined,
        advanceAmount: advanceAmount ? parseFloat(advanceAmount) : undefined,
        transactionId,
      });

      console.log(`✨ Ride created successfully: ${ride.id}`);
      return res.status(201).json({
        success: true,
        message: "Scheduled ride booked successfully",
        data: ride,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to create scheduled ride",
      });
    }
  },

  // Estimate fare before booking (no ride created)
  estimateFare: async (req: AuthedRequest, res: Response) => {
    try {
      const { distanceKm, cityCodeId, couponCode, rideType } = req.body;

      if (distanceKm === undefined || !cityCodeId) {
        return res.status(400).json({
          success: false,
          message: "distanceKm and cityCodeId are required",
        });
      }

      const fareData = await estimateFare({
        distanceKm: parseFloat(distanceKm),
        cityCodeId,
        couponCode,
        rideType,
      });

      return res.status(200).json({
        success: true,
        data: fareData,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to estimate fare",
      });
    }
  },

  // Validate a coupon before ride booking
  validateCoupon: async (req: AuthedRequest, res: Response) => {
    try {
      const { couponCode, cityCodeId, totalFare } = req.body;

      if (!couponCode || !cityCodeId || totalFare === undefined) {
        return res.status(400).json({
          success: false,
          message: "couponCode, cityCodeId, and totalFare are required for validation",
        });
      }

      const couponData = await validateCouponLogic(couponCode, cityCodeId, parseFloat(totalFare));

      return res.status(200).json({
        success: true,
        message: "Coupon applied successfully",
        data: couponData,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to validate coupon",
      });
    }
  },

  // Get all rides for a user
  getUserRides: async (req: AuthedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const { status } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const rides = await getUserRides(userId, status as string);

      return res.status(200).json({
        success: true,
        message: "Rides retrieved successfully",
        data: rides,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to get rides",
      });
    }
  },

  // Get a specific ride by ID
  getRideById: async (req: AuthedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const ride = await getUserRideById(id, userId);

      return res.status(200).json({
        success: true,
        message: "Ride retrieved successfully",
        data: ride,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to get ride",
      });
    }
  },

  // Cancel a ride
  cancelRide: async (req: AuthedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const ride = await cancelRide(id, userId);

      createAuditLog({ userId, userName: req.user?.name, userRole: "USER", action: "STATUS_CHANGE", module: "RIDE", entityId: id, description: `User cancelled ride`, newData: { status: "CANCELLED" }, ...getRequestContext(req) });

      return res.status(200).json({
        success: true,
        message: "Ride cancelled successfully",
        data: ride,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to cancel ride",
      });
    }
  },

  // Complete ride with user's OTP
  completeRide: async (req: AuthedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { userOtp } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (!userOtp) {
        return res.status(400).json({
          success: false,
          message: "User OTP is required",
        });
      }

      const ride = await completeRideWithOtp(id, userId, userOtp);

      return res.status(200).json({
        success: true,
        message: "Ride completed successfully",
        data: ride,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to complete ride",
      });
    }
  },

  /* ============================================
      PARTNER RIDE CONTROLLERS
  ============================================ */

  // Get available rides for partner
  getAvailableRides: async (req: AuthedRequest, res: Response) => {
    try {
      const partnerId = req.user?.id;
      const { lat, lng, vehicleTypeId } = req.query;

      if (!partnerId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (lat === undefined || lng === undefined) {
        return res.status(400).json({
          success: false,
          message: "Partner location (lat, lng) is required",
        });
      }

      const { prisma } = require("../../config/prisma");
      const partner = await prisma.partner.findUnique({
        where: { id: partnerId },
        select: { cityCodeId: true }
      });

      const rides = await getAvailableRides(
        parseFloat(lat as string),
        parseFloat(lng as string),
        vehicleTypeId as string | undefined,
        partner?.cityCodeId || undefined
      );

      return res.status(200).json({
        success: true,
        message: "Available rides retrieved successfully",
        data: rides,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to get available rides",
      });
    }
  },

  // Accept a ride
  acceptRide: async (req: AuthedRequest, res: Response) => {
    try {
      const partnerId = req.user?.id;
      const { id } = req.params;

      if (!partnerId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const ride = await acceptRide(id, partnerId);

      createAuditLog({ userId: partnerId, userName: req.user?.name, userRole: "PARTNER", action: "STATUS_CHANGE", module: "RIDE", entityId: id, description: `Partner accepted ride`, newData: { status: "ACCEPTED", partnerId }, ...getRequestContext(req) });

      return res.status(200).json({
        success: true,
        message: "Ride accepted successfully",
        data: ride,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to accept ride",
      });
    }
  },

  // Get all rides for a partner
  getPartnerRides: async (req: AuthedRequest, res: Response) => {
    try {
      const partnerId = req.user?.id;
      const { status } = req.query;

      if (!partnerId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const rides = await getPartnerRides(partnerId, status as string);

      return res.status(200).json({
        success: true,
        message: "Rides retrieved successfully",
        data: rides,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to get rides",
      });
    }
  },

  // Update ride status (ARRIVED, STARTED, ONGOING, COMPLETED, CANCELLED)
  updateRideStatus: async (req: AuthedRequest, res: Response) => {
    try {
      const partnerId = req.user?.id;
      const { id } = req.params;
      const { status, userOtp, startingKm, endingKm } = req.body;

      if (!partnerId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const validStatuses = ["ARRIVED", "STARTED", "ONGOING", "COMPLETED", "CANCELLED"];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be ARRIVED, STARTED, ONGOING, COMPLETED, or CANCELLED",
        });
      }

      const ride = await updateRideStatus(
        id,
        partnerId,
        status,
        userOtp,
        startingKm ? parseFloat(startingKm) : undefined,
        endingKm ? parseFloat(endingKm) : undefined
      );

      createAuditLog({ userId: partnerId, userName: req.user?.name, userRole: "PARTNER", action: "STATUS_CHANGE", module: "RIDE", entityId: id, description: `Partner updated ride to ${status}`, newData: { status }, ...getRequestContext(req) });

      return res.status(200).json({
        success: true,
        message: "Ride status updated successfully",
        data: ride,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to update ride status",
      });
    }
  },

  // Update partner's current location
  updateLocation: async (req: AuthedRequest, res: Response) => {
    try {
      const partnerId = req.user?.id;
      const { lat, lng } = req.body;

      if (!partnerId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (lat === undefined || lng === undefined) {
        return res.status(400).json({
          success: false,
          message: "lat and lng are required",
        });
      }

      const { prisma } = require("../../config/prisma");
      const partner = await prisma.partner.update({
        where: { id: partnerId },
        data: {
          currentLat: parseFloat(lat),
          currentLng: parseFloat(lng),
        },
        select: {
          id: true,
          customId: true,
          name: true,
          currentLat: true,
          currentLng: true,
          isOnline: true,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Location updated successfully",
        data: partner,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to update location",
      });
    }
  },

  // Toggle partner online/offline status
  toggleOnlineStatus: async (req: AuthedRequest, res: Response) => {
    try {
      const partnerId = req.user?.id;
      const { isOnline, lat, lng } = req.body;

      if (!partnerId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (isOnline === undefined) {
        return res.status(400).json({
          success: false,
          message: "isOnline is required",
        });
      }

      const { prisma } = require("../../config/prisma");

      // If going online, require location
      if (isOnline && (lat === undefined || lng === undefined)) {
        return res.status(400).json({
          success: false,
          message: "Location (lat, lng) is required when going online",
        });
      }

      const updateData: any = { isOnline };
      if (isOnline && lat !== undefined && lng !== undefined) {
        updateData.currentLat = parseFloat(lat);
        updateData.currentLng = parseFloat(lng);
      }

      const partner = await prisma.partner.update({
        where: { id: partnerId },
        data: updateData,
        select: {
          id: true,
          customId: true,
          name: true,
          isOnline: true,
          currentLat: true,
          currentLng: true,
          hasOwnVehicle: true,
          vehicle: {
            select: {
              id: true,
              customId: true,
              registrationNumber: true,
              vehicleModel: true,
            },
          },
        },
      });

      return res.status(200).json({
        success: true,
        message: isOnline ? "You are now online" : "You are now offline",
        data: partner,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to update online status",
      });
    }
  },

  // Public booking from landing page
  publicBook: async (req: any, res: Response) => {
    try {
      const {
        userName,
        userPhone,
        pickupAddress,
        dropAddress,
        pickupLat,
        pickupLng,
        dropLat,
        dropLng,
        distanceKm,
        scheduledDateTime,
        rideType,
        vehicleTypeId,
        cityCodeId,
        passengers
      } = req.body;

      if (!userPhone || !userName || !pickupAddress || !vehicleTypeId || !cityCodeId) {
        return res.status(400).json({
          success: false,
          message: "Required fields missing (name, phone, pickup, vehicle type, city)"
        });
      }

      // 1. Find or create user
      let user = await prisma.user.findUnique({ where: { phone: userPhone } });
      if (!user) {
        const uniqueOtp = await generateUnique4DigitOtp();
        user = await prisma.user.create({
          data: { phone: userPhone, name: userName, uniqueOtp }
        });
      } else if (!user.name || user.name === "User") {
        // Update name if it was a placeholder
        user = await prisma.user.update({
          where: { id: user.id },
          data: { name: userName }
        });
      }

      // 2. Create ride via service
      const ride = await createManualRide(user.id, {
        vehicleTypeId,
        pickupLat: parseFloat(pickupLat) || 0,
        pickupLng: parseFloat(pickupLng) || 0,
        pickupAddress,
        dropLat: parseFloat(dropLat) || 0,
        dropLng: parseFloat(dropLng) || 0,
        dropAddress: dropAddress || "Not specified",
        distanceKm: parseFloat(distanceKm) || 0,
        scheduledDateTime: new Date(scheduledDateTime),
        rideType: rideType || "LOCAL",
        bookingNotes: `Public Booking. Passengers: ${passengers || 'Not specified'}`,
        cityCodeId,
      });

      return res.status(201).json({
        success: true,
        message: "Ride booked successfully",
        data: ride,
      });
    } catch (error: any) {
      console.error("Public Booking Error:", error);
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to book ride",
      });
    }
  },
};
