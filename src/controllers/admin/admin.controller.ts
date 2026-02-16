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
  getAllRiders,
  getRiderById,
  getScheduledRides,
  assignRiderToRide,
} from "../../services/admin/admin.service";

export default {
  /* ============================================
      VEHICLE TYPE MANAGEMENT
  ============================================ */

  createVehicleType: async (req: AuthedRequest, res: Response) => {
    try {
      const { category, name, displayName, pricePerKm, baseFare } = req.body;

      if (!category || !name || !displayName || pricePerKm === undefined) {
        return res.status(400).json({
          success: false,
          message: "category, name, displayName, and pricePerKm are required",
        });
      }

      const vehicleType = await createVehicleType({
        category,
        name,
        displayName,
        pricePerKm: parseFloat(pricePerKm),
        baseFare: baseFare ? parseFloat(baseFare) : undefined,
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
      // --- MOCK DATA FALLBACK ---
      console.log("Using mock vehicle types due to error:", error.message);
      return res.status(200).json({
        success: true,
        message: "Vehicle types retrieved (MOCK)",
        data: [
          { id: "vt1", name: "BIKE", displayName: "Bike", pricePerKm: 10, isActive: true },
          { id: "vt2", name: "AUTO", displayName: "Auto", pricePerKm: 15, isActive: true },
          { id: "vt3", name: "MACRO", displayName: "Macro", pricePerKm: 20, isActive: true },
          { id: "vt4", name: "MINI", displayName: "Mini", pricePerKm: 25, isActive: true },
          { id: "vt5", name: "PRIME", displayName: "Prime", pricePerKm: 30, isActive: true },
        ],
      });
      // --------------------------
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
      const { displayName, pricePerKm, baseFare, isActive } = req.body;

      const vehicleType = await updateVehicleType(id, {
        displayName,
        pricePerKm: pricePerKm !== undefined ? parseFloat(pricePerKm) : undefined,
        baseFare: baseFare !== undefined ? parseFloat(baseFare) : undefined,
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
      // --- MOCK DATA FALLBACK ---
      console.log("Using mock pricing config due to error:", error.message);
      return res.status(200).json({
        success: true,
        message: "Pricing config retrieved (MOCK)",
        data: { baseFare: 20, riderPercentage: 80, appCommission: 20 },
      });
      // --------------------------
    }
  },

  updatePricingConfig: async (req: AuthedRequest, res: Response) => {
    try {
      const { baseFare, riderPercentage, appCommission } = req.body;

      if (riderPercentage === undefined || appCommission === undefined) {
        return res.status(400).json({
          success: false,
          message: "Rider percentage and app commission are required",
        });
      }

      const config = await updatePricingConfig({
        baseFare: baseFare ? parseFloat(baseFare) : undefined,
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
      // --- MOCK DATA FALLBACK ---
      console.log("Using mock rides due to error:", error.message);
      return res.status(200).json({
        success: true,
        message: "Rides retrieved (MOCK)",
        data: [
          { id: "ride1", status: "COMPLETED", totalFare: 250, commission: 50, createdAt: new Date().toISOString(), user: { name: "Alice" }, vehicleType: { displayName: "Sedan" } },
          { id: "ride2", status: "PENDING", totalFare: 150, commission: 30, createdAt: new Date().toISOString(), user: { name: "Bob" }, vehicleType: { displayName: "Bike" } },
          { id: "ride3", status: "COMPLETED", totalFare: 500, commission: 100, createdAt: new Date(Date.now() - 86400000).toISOString(), user: { name: "Charlie" }, vehicleType: { displayName: "SUV" } },
        ],
      });
      // --------------------------
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
      // --- MOCK DATA FALLBACK ---
      console.log("Using mock users due to error:", error.message);
      return res.status(200).json({
        success: true,
        message: "Users retrieved (MOCK)",
        data: [
          { id: "u1", name: "Alice", phone: "9876543210", email: "alice@example.com" },
          { id: "u2", name: "Bob", phone: "9876543211", email: "bob@example.com" },
        ],
      });
      // --------------------------
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

  /* ============================================
      RIDER MANAGEMENT
  ============================================ */

  getAllRiders: async (req: AuthedRequest, res: Response) => {
    try {
      const riders = await getAllRiders();

      return res.status(200).json({
        success: true,
        message: "Riders retrieved successfully",
        data: riders,
      });
    } catch (error: any) {
      // --- MOCK DATA FALLBACK ---
      console.log("Using mock riders due to error:", error.message);
      return res.status(200).json({
        success: true,
        message: "Riders retrieved (MOCK)",
        data: [
          { id: "r1", name: "Rider Mike", phone: "8888888888", isOnline: true },
          { id: "r2", name: "Rider Sarah", phone: "7777777777", isOnline: false },
        ],
      });
      // --------------------------
    }
  },

  getRiderById: async (req: AuthedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const rider = await getRiderById(id);

      return res.status(200).json({
        success: true,
        message: "Rider retrieved successfully",
        data: rider,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to get rider",
      });
    }
  },

  /* ============================================
      SCHEDULED RIDE MANAGEMENT
  ============================================ */

  getScheduledRides: async (req: AuthedRequest, res: Response) => {
    try {
      const rides = await getScheduledRides();

      return res.status(200).json({
        success: true,
        message: "Scheduled rides retrieved successfully",
        data: rides,
      });
    } catch (error: any) {
      // --- MOCK DATA FALLBACK ---
      console.log("Using mock scheduled rides due to error:", error.message);
      return res.status(200).json({
        success: true,
        message: "Scheduled rides retrieved (MOCK)",
        data: [],
      });
      // --------------------------
    }
  },

  assignRiderToRide: async (req: AuthedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { riderId } = req.body;

      if (!riderId) {
        return res.status(400).json({
          success: false,
          message: "Rider ID is required",
        });
      }

      const adminId = req.user?.id;
      const ride = await assignRiderToRide(id, riderId, adminId);

      return res.status(200).json({
        success: true,
        message: "Rider assigned to ride successfully",
        data: ride,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to assign rider to ride",
      });
    }
  },
};
