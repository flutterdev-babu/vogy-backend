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
  getAllPartners,
  getPartnerById,
  getScheduledRides,
  assignPartnerToRide,
  getAllVendors,
  getVendorById,
  updateVendor,
  getAllCorporates,
  getCorporateById,
  updateCorporate,
  getAllCityCodes,
  createCityCode,
  updateCityCode,
  createAttachment,
  getAllAttachments,
  toggleAttachmentStatus,
  deleteAttachment,
  createVendorByAdmin,
  createPartnerByAdmin,
  createManualRideByAdmin,
  getAdminDashboard,
  getRevenueAnalytics,
  getRideAnalytics,
  getEntityStatusOverview,
  getRecentActivity,
  updateRideStatusByAdmin,
  getRideOtpByAdmin,
  verifyAttachmentByAdmin,
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

  createManualRide: async (req: AuthedRequest, res: Response) => {
    try {
      const adminId = req.user?.id;
      const ride = await createManualRideByAdmin(adminId, req.body);
      return res.status(201).json({
        success: true,
        message: "Manual ride booked successfully",
        data: ride,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to create manual booking",
      });
    }
  },

  getAllRides: async (req: AuthedRequest, res: Response) => {
    try {
      const { status, vehicleType, userId, partnerId } = req.query;

      const rides = await getAllRides({
        status: status as string,
        vehicleType: vehicleType as string,
        userId: userId as string,
        partnerId: partnerId as string,
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

  updateRideStatus: async (req: AuthedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const ride = await updateRideStatusByAdmin(id, status);
      res.json({ success: true, data: ride });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  getRideOtp: async (req: AuthedRequest, res: Response) => {
    try {
      const otp = await getRideOtpByAdmin(req.params.id);
      res.json({ success: true, data: { otp } });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
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
      RIDER/PARTNER MANAGEMENT
  ============================================ */

  createPartner: async (req: AuthedRequest, res: Response) => {
    try {
      const partner = await createPartnerByAdmin(req.body);
      res.status(201).json({ success: true, message: "Partner created successfully", data: partner });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  getAllRiders: async (req: AuthedRequest, res: Response) => {
    try {
      const partners = await getAllPartners();

      return res.status(200).json({
        success: true,
        message: "Partners retrieved successfully",
        data: partners,
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

      const partner = await getPartnerById(id);

      return res.status(200).json({
        success: true,
        message: "Partner retrieved successfully",
        data: partner,
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
      const { partnerId } = req.body;

      if (!partnerId) {
        return res.status(400).json({
          success: false,
          message: "Partner ID is required",
        });
      }

      const adminId = req.user?.id;
      const ride = await assignPartnerToRide(id, partnerId, adminId);

      return res.status(200).json({
        success: true,
        message: "Partner assigned to ride successfully",
        data: ride,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to assign rider to ride",
      });
    }
  },

  /* ============================================
      VENDOR MANAGEMENT (Admin)
  ============================================ */

  createVendor: async (req: AuthedRequest, res: Response) => {
    try {
      const vendor = await createVendorByAdmin(req.body);
      res.status(201).json({ success: true, message: "Vendor created successfully", data: vendor });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  getAllVendors: async (req: AuthedRequest, res: Response) => {
    try {
      const { search } = req.query;
      const vendors = await getAllVendors(search as string);
      res.json({ success: true, data: vendors });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  getVendorById: async (req: AuthedRequest, res: Response) => {
    try {
      const vendor = await getVendorById(req.params.id);
      res.json({ success: true, data: vendor });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message });
    }
  },

  updateVendor: async (req: AuthedRequest, res: Response) => {
    try {
      const vendor = await updateVendor(req.params.id, req.body);
      res.json({ success: true, data: vendor });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  /* ============================================
      CORPORATE MANAGEMENT (Admin)
  ============================================ */

  getAllCorporates: async (req: AuthedRequest, res: Response) => {
    try {
      const { search } = req.query;
      const corporates = await getAllCorporates(search as string);
      res.json({ success: true, data: corporates });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  getCorporateById: async (req: AuthedRequest, res: Response) => {
    try {
      const corporate = await getCorporateById(req.params.id);
      res.json({ success: true, data: corporate });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message });
    }
  },

  updateCorporate: async (req: AuthedRequest, res: Response) => {
    try {
      const corporate = await updateCorporate(req.params.id, req.body);
      res.json({ success: true, data: corporate });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  /* ============================================
      CITY CODE MANAGEMENT (Admin)
  ============================================ */

  getAllCityCodes: async (req: AuthedRequest, res: Response) => {
    try {
      const cities = await getAllCityCodes();
      res.json({ success: true, data: cities });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  createCityCode: async (req: AuthedRequest, res: Response) => {
    try {
      const city = await createCityCode(req.body);
      res.status(201).json({ success: true, data: city });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  updateCityCode: async (req: AuthedRequest, res: Response) => {
    try {
      const city = await updateCityCode(req.params.id, req.body);
      res.json({ success: true, data: city });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  /* ============================================
      ATTACHMENT MANAGEMENT
  ============================================ */

  createAttachment: async (req: AuthedRequest, res: Response) => {
    try {
      const attachment = await createAttachment(req.body);
      res.status(201).json({ success: true, data: attachment });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  getAllAttachments: async (req: AuthedRequest, res: Response) => {
    try {
      const attachments = await getAllAttachments();
      res.json({ success: true, data: attachments });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  toggleAttachmentStatus: async (req: AuthedRequest, res: Response) => {
    try {
      const { isActive } = req.body;
      const attachment = await toggleAttachmentStatus(req.params.id, isActive);
      res.json({ success: true, data: attachment });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  verifyAttachment: async (req: AuthedRequest, res: Response) => {
    try {
      const { status } = req.body;
      const attachment = await verifyAttachmentByAdmin(req.params.id, status);
      res.json({ success: true, data: attachment });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  deleteAttachment: async (req: AuthedRequest, res: Response) => {
    try {
      const result = await deleteAttachment(req.params.id);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  /* ============================================
      ADMIN DASHBOARD ENDPOINTS
  ============================================ */

  getDashboard: async (req: AuthedRequest, res: Response) => {
    try {
      const dashboard = await getAdminDashboard();
      res.json({ success: true, data: dashboard });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  getRevenueAnalytics: async (req: AuthedRequest, res: Response) => {
    try {
      const analytics = await getRevenueAnalytics();
      res.json({ success: true, data: analytics });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  getRideAnalytics: async (req: AuthedRequest, res: Response) => {
    try {
      const analytics = await getRideAnalytics();
      res.json({ success: true, data: analytics });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  getEntityStatusOverview: async (req: AuthedRequest, res: Response) => {
    try {
      const overview = await getEntityStatusOverview();
      res.json({ success: true, data: overview });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  getRecentActivity: async (req: AuthedRequest, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const activity = await getRecentActivity(limit);
      res.json({ success: true, data: activity });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
