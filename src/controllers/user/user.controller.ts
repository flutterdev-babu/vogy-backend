import { Response } from "express";
import { AuthedRequest } from "../../middleware/auth.middleware";
import {
  getUserProfile,
  updateUserProfile,
  updateUserUniqueOtp,
  getUserUniqueOtp,
} from "../../services/user/user.service";
import {
  createRide,
  getUserRides,
  getRideById,
  cancelRide,
  completeRideWithOtp,
} from "../../services/ride/ride.service";

export default {
  /* ============================================
      USER PROFILE (Already exists)
  ============================================ */
  getProfile: async (req: AuthedRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const user = await getUserProfile(userId);

      return res.status(200).json({
        success: true,
        message: "Profile retrieved successfully",
        data: user,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to get profile",
      });
    }
  },

  updateProfile: async (req: AuthedRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { name, email, profileImage } = req.body;

      if (!name && email === undefined && profileImage === undefined) {
        return res.status(400).json({
          success: false,
          message: "At least one field (name, email, profileImage) is required",
        });
      }

      const updatedUser = await updateUserProfile(userId, {
        name,
        email,
        profileImage,
      });

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: updatedUser,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to update profile",
      });
    }
  },

  /* ============================================
      RIDE MANAGEMENT (USER)
  ============================================ */

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
        cityCodeId, // NEW
      } = req.body;

      if (
        !dropAddress ||
        !distanceKm ||
        !cityCodeId // NEW
      ) {
        return res.status(400).json({
          success: false,
          message: "All fields are required including cityCodeId",
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
        cityCodeId, // NEW
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

  getRides: async (req: AuthedRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { status } = req.query;

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

  getRideById: async (req: AuthedRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { id } = req.params;

      const ride = await getRideById(id, userId);

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

  cancelRide: async (req: AuthedRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { id } = req.params;

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

  completeRide: async (req: AuthedRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { id } = req.params;
      const { userOtp } = req.body;

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
      USER UNIQUE OTP MANAGEMENT
  ============================================ */

  getUniqueOtp: async (req: AuthedRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const user = await getUserUniqueOtp(userId);

      return res.status(200).json({
        success: true,
        message: "Unique OTP retrieved successfully",
        data: user,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to get unique OTP",
      });
    }
  },

  updateUniqueOtp: async (req: AuthedRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const user = await updateUserUniqueOtp(userId);

      return res.status(200).json({
        success: true,
        message: "Unique OTP updated successfully",
        data: user,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to update unique OTP",
      });
    }
  },
};
