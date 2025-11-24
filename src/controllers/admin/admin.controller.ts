import { Response } from "express";
import { AuthedRequest } from "../../middleware/auth.middleware";
import {
  createVehicleType,
  getAllVehicleTypes,
  getVehicleTypeById,
  updateVehicleType,
  deleteVehicleType,
  getPricingConfig,
  updatePricingConfig,
  getAllRides,
  getRideById as getAdminRideById,
  updateUserUniqueOtpByAdmin,
  getAllUsers,
  getUserById,
} from "../../services/admin/admin.service";

export default {
  /* ============================================
      VEHICLE TYPE MANAGEMENT
  ============================================ */

  createVehicleType: async (req: AuthedRequest, res: Response) => {
    try {
      const { name, displayName, pricePerKm } = req.body;

      if (!name || !displayName || !pricePerKm) {
        return res.status(400).json({
          success: false,
          message: "Name, displayName, and pricePerKm are required",
        });
      }

      const vehicleType = await createVehicleType({
        name,
        displayName,
        pricePerKm: parseFloat(pricePerKm),
      });

      return res.status(201).json({
        success: true,
        message: "Vehicle type created successfully",
        data: vehicleType,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to create vehicle type",
      });
    }
  },

  getAllVehicleTypes: async (req: AuthedRequest, res: Response) => {
    try {
      const vehicleTypes = await getAllVehicleTypes();

      return res.status(200).json({
        success: true,
        message: "Vehicle types retrieved successfully",
        data: vehicleTypes,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to get vehicle types",
      });
    }
  },

  getVehicleTypeById: async (req: AuthedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const vehicleType = await getVehicleTypeById(id);

      return res.status(200).json({
        success: true,
        message: "Vehicle type retrieved successfully",
        data: vehicleType,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to get vehicle type",
      });
    }
  },

  updateVehicleType: async (req: AuthedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { displayName, pricePerKm, isActive } = req.body;

      const vehicleType = await updateVehicleType(id, {
        displayName,
        pricePerKm: pricePerKm ? parseFloat(pricePerKm) : undefined,
        isActive,
      });

      return res.status(200).json({
        success: true,
        message: "Vehicle type updated successfully",
        data: vehicleType,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to update vehicle type",
      });
    }
  },

  deleteVehicleType: async (req: AuthedRequest, res: Response) => {
    try {
      const { id } = req.params;

      await deleteVehicleType(id);

      return res.status(200).json({
        success: true,
        message: "Vehicle type deleted successfully",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to delete vehicle type",
      });
    }
  },

  /* ============================================
      PRICING CONFIGURATION
  ============================================ */

  getPricingConfig: async (req: AuthedRequest, res: Response) => {
    try {
      const config = await getPricingConfig();

      return res.status(200).json({
        success: true,
        message: "Pricing config retrieved successfully",
        data: config,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to get pricing config",
      });
    }
  },

  updatePricingConfig: async (req: AuthedRequest, res: Response) => {
    try {
      const { riderPercentage, appCommission } = req.body;

      if (!riderPercentage || !appCommission) {
        return res.status(400).json({
          success: false,
          message: "Rider percentage and app commission are required",
        });
      }

      const config = await updatePricingConfig({
        riderPercentage: parseFloat(riderPercentage),
        appCommission: parseFloat(appCommission),
      });

      return res.status(200).json({
        success: true,
        message: "Pricing config updated successfully",
        data: config,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to update pricing config",
      });
    }
  },

  /* ============================================
      RIDE MANAGEMENT
  ============================================ */

  getAllRides: async (req: AuthedRequest, res: Response) => {
    try {
      const { status, vehicleType, userId, riderId } = req.query;

      const rides = await getAllRides({
        status: status as string,
        vehicleType: vehicleType as string,
        userId: userId as string,
        riderId: riderId as string,
      });

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
      const { id } = req.params;

      const ride = await getAdminRideById(id);

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

  /* ============================================
      USER MANAGEMENT
  ============================================ */

  getAllUsers: async (req: AuthedRequest, res: Response) => {
    try {
      const users = await getAllUsers();

      return res.status(200).json({
        success: true,
        message: "Users retrieved successfully",
        data: users,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to get users",
      });
    }
  },

  getUserById: async (req: AuthedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const user = await getUserById(id);

      return res.status(200).json({
        success: true,
        message: "User retrieved successfully",
        data: user,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to get user",
      });
    }
  },

  updateUserUniqueOtp: async (req: AuthedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const user = await updateUserUniqueOtpByAdmin(id);

      return res.status(200).json({
        success: true,
        message: "User unique OTP updated successfully",
        data: user,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to update user unique OTP",
      });
    }
  },
};

