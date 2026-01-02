import { Response } from "express";
import { AuthedRequest } from "../../middleware/auth.middleware";
import {
  createRide,
  createManualRide,
  getUserRides,
  getRideById as getUserRideById,
  cancelRide,
  completeRideWithOtp,
  getAvailableRides,
  acceptRide,
  getRiderRides,
  updateRideStatus,
} from "../../services/ride/ride.service";

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

      const {
        vehicleTypeId,
        pickupLat,
        pickupLng,
        pickupAddress,
        dropLat,
        dropLng,
        dropAddress,
        distanceKm,
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
        distanceKm === undefined
      ) {
        return res.status(400).json({
          success: false,
          message:
            "vehicleTypeId, pickupLat, pickupLng, pickupAddress, dropLat, dropLng, dropAddress, and distanceKm are required",
        });
      }

      const ride = await createRide(userId, {
        vehicleTypeId,
        pickupLat: parseFloat(pickupLat),
        pickupLng: parseFloat(pickupLng),
        pickupAddress,
        dropLat: parseFloat(dropLat),
        dropLng: parseFloat(dropLng),
        dropAddress,
        distanceKm: parseFloat(distanceKm),
      });

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
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

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
        !scheduledDateTime
      ) {
        return res.status(400).json({
          success: false,
          message:
            "vehicleTypeId, pickupLat, pickupLng, pickupAddress, dropLat, dropLng, dropAddress, distanceKm, and scheduledDateTime are required",
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
      });

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
      RIDER RIDE CONTROLLERS
  ============================================ */

  // Get available rides for rider
  getAvailableRides: async (req: AuthedRequest, res: Response) => {
    try {
      const riderId = req.user?.id;
      const { lat, lng, vehicleTypeId } = req.query;

      if (!riderId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (lat === undefined || lng === undefined) {
        return res.status(400).json({
          success: false,
          message: "Rider location (lat, lng) is required",
        });
      }

      const rides = await getAvailableRides(
        parseFloat(lat as string),
        parseFloat(lng as string),
        vehicleTypeId as string | undefined
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
      const riderId = req.user?.id;
      const { id } = req.params;

      if (!riderId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const ride = await acceptRide(id, riderId);

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

  // Get all rides for a rider
  getRiderRides: async (req: AuthedRequest, res: Response) => {
    try {
      const riderId = req.user?.id;
      const { status } = req.query;

      if (!riderId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const rides = await getRiderRides(riderId, status as string);

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

  // Update ride status (ARRIVED, STARTED)
  updateRideStatus: async (req: AuthedRequest, res: Response) => {
    try {
      const riderId = req.user?.id;
      const { id } = req.params;
      const { status } = req.body;

      if (!riderId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (!status || !["ARRIVED", "STARTED"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be ARRIVED or STARTED",
        });
      }

      const ride = await updateRideStatus(id, riderId, status);

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
};

