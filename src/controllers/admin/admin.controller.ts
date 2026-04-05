import { Response } from "express";
import { AuthedRequest } from "../../middleware/auth.middleware";
import { createAuditLog, getRequestContext } from "../../services/audit/auditLog.service";
import { prisma } from "../../config/prisma";
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
  createUserByAdmin,
  updateUserByAdmin,
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
  deleteCityCode,
  createAttachment,
  getAllAttachments,
  getAttachmentById,
  updateAttachmentStatus,
  deleteAttachment,
  createVendorByAdmin,
  createPartnerByAdmin,
  createAgentByAdmin,
  createManualRideByAdmin,
  getAdminDashboard,
  getRevenueAnalytics,
  getRideAnalytics,
  getEntityStatusOverview,
  getRecentActivity,
  updateRideStatusByAdmin,
  getRideOtpByAdmin,
  verifyAttachmentByAdmin,
  updateRidePaymentStatusByAdmin,
  getActivePartnerLocations, // NEW: added for active partner locations
  getCancellationAnalytics,
  getAuditTimeline,
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

      createAuditLog({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "CREATE", module: "VEHICLE_TYPE", entityId: vehicleType.id, description: `Created vehicle type: ${displayName}`, newData: vehicleType, ...getRequestContext(req) });

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
      const { displayName, pricePerKm, baseFare, isActive } = req.body;

      const oldVehicleType = await getVehicleTypeById(id);
      const vehicleType = await updateVehicleType(id, {
        displayName,
        pricePerKm: pricePerKm !== undefined ? parseFloat(pricePerKm) : undefined,
        baseFare: baseFare !== undefined ? parseFloat(baseFare) : undefined,
        isActive,
      });

      createAuditLog({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "UPDATE", module: "VEHICLE_TYPE", entityId: id, description: `Updated vehicle type: ${vehicleType.displayName}`, oldData: oldVehicleType, newData: req.body, ...getRequestContext(req) });

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

      createAuditLog({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "DELETE", module: "VEHICLE_TYPE", entityId: id, description: `Deleted a vehicle type`, ...getRequestContext(req) });

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

  updateVehiclePricing: async (req: AuthedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { basePrice, pricePerKm } = req.body;
      const vehicleType = await prisma.vehicleType.update({
        where: { id },
        data: {
          baseFare: basePrice !== undefined ? parseFloat(basePrice) : undefined,
          pricePerKm: pricePerKm !== undefined ? parseFloat(pricePerKm) : undefined,
        }
      });
      return res.status(200).json({ success: true, message: "Vehicle pricing updated", data: vehicleType });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  updateAllVehiclesPricing: async (req: AuthedRequest, res: Response) => {
    try {
      const { basePrice, pricePerKm } = req.body;
      const dataToUpdate: any = {};
      if (basePrice !== undefined) dataToUpdate.baseFare = parseFloat(basePrice);
      if (pricePerKm !== undefined) dataToUpdate.pricePerKm = parseFloat(pricePerKm);

      const result = await prisma.vehicleType.updateMany({ data: dataToUpdate });
      return res.status(200).json({ success: true, message: "All vehicle pricings updated", data: result });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
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
      const { baseFare, riderPercentage, appCommission } = req.body;

      if (riderPercentage === undefined || appCommission === undefined) {
        return res.status(400).json({
          success: false,
          message: "Rider percentage and app commission are required",
        });
      }

      const oldConfig = await getPricingConfig();
      const config = await updatePricingConfig({
        baseFare: baseFare ? parseFloat(baseFare) : undefined,
        riderPercentage: parseFloat(riderPercentage),
        appCommission: parseFloat(appCommission),
      });

      createAuditLog({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "UPDATE", module: "PRICING", entityId: config.id, description: `Updated pricing: Rider ${riderPercentage}%, Commission ${appCommission}%`, oldData: oldConfig, newData: config, ...getRequestContext(req) });

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
      VEHICLE PRICING GROUPS (NEW)
  ============================================ */

  createPricingGroup: async (req: AuthedRequest, res: Response) => {
    try {
      const { vehicleTypeId, perKmPrice, cityCodeIds } = req.body;

      if (!vehicleTypeId || perKmPrice === undefined || !cityCodeIds) {
        return res.status(400).json({
          success: false,
          message: "vehicleTypeId, perKmPrice, and cityCodeIds are required",
        });
      }

      const { createPricingGroup } = require("../../services/city/city.service");
      const pricingGroup = await createPricingGroup(req.body);

      createAuditLog({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "CREATE", module: "PRICING_GROUP", entityId: pricingGroup.id, description: `Created pricing group: ${req.body.name || pricingGroup.id}`, newData: pricingGroup, ...getRequestContext(req) });

      return res.status(201).json({
        success: true,
        message: "Vehicle pricing group created successfully",
        data: pricingGroup,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to create pricing group",
      });
    }
  },

  getPricingGroups: async (req: AuthedRequest, res: Response) => {
    try {
      const { vehicleTypeId, serviceType } = req.query;
      const { getPricingGroups } = require("../../services/city/city.service");
      const groups = await getPricingGroups(
        vehicleTypeId as string,
        serviceType as string
      );

      return res.status(200).json({
        success: true,
        data: groups,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to get pricing groups",
      });
    }
  },

  updatePricingGroup: async (req: AuthedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { updatePricingGroup } = require("../../services/city/city.service");
      const group = await updatePricingGroup(id, req.body);

      createAuditLog({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "UPDATE", module: "PRICING_GROUP", entityId: id, description: `Updated pricing group: ${id}`, newData: req.body, ...getRequestContext(req) });

      return res.status(200).json({
        success: true,
        message: "Vehicle pricing group updated successfully",
        data: group,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to update pricing group",
      });
    }
  },

  deletePricingGroup: async (req: AuthedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { deletePricingGroup } = require("../../services/city/city.service");
      const result = await deletePricingGroup(id);

      createAuditLog({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "DELETE", module: "PRICING_GROUP", entityId: id, description: `Deleted pricing group: ${id}`, ...getRequestContext(req) });

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to delete pricing group",
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

      createAuditLog({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "CREATE", module: "RIDE", entityId: ride.id, description: `Created manual ride booking`, newData: ride, ...getRequestContext(req) });

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
      const { status, vehicleType, userId, partnerId, search } = req.query;

      const rides = await getAllRides({
        status: status as string,
        vehicleType: vehicleType as string,
        userId: userId as string,
        partnerId: partnerId as string,
        search: search as string,
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

  updateRideStatus: async (req: AuthedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status, userOtp, startingKm, endingKm, manualDiscount } = req.body;
      const oldRide = await prisma.ride.findUnique({ where: { id }, select: { status: true, startingKm: true, endingKm: true, isLocked: true, ...({ partnerManualDiscount: true } as any) } });

      if (oldRide?.isLocked && req.user?.role !== 'SUPERADMIN') {
        throw new Error("This ride is finalized and locked. Only a SuperAdmin can make changes.");
      }

      const ride = await updateRideStatusByAdmin(
        id,
        status,
        userOtp,
        startingKm ? parseFloat(startingKm) : undefined,
        endingKm ? parseFloat(endingKm) : undefined,
        manualDiscount !== undefined ? parseFloat(manualDiscount) : undefined
      );

      createAuditLog({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "STATUS_CHANGE", module: "RIDE", entityId: id, description: `Ride status changed to ${status}${manualDiscount !== undefined ? ` with discount ${manualDiscount}` : ''}`, oldData: oldRide, newData: { status, startingKm, endingKm, partnerManualDiscount: manualDiscount }, ...getRequestContext(req) });

      res.json({ success: true, data: ride });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  updateRideDetails: async (req: AuthedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { taxes, tollCharges, additionalCharges, driverDiscount, partnerId, paymentStatus, bookingNotes, isLocked } = req.body;

      const oldRide = await prisma.ride.findUnique({ where: { id }, select: { isLocked: true } });
      if (oldRide?.isLocked && req.user?.role !== 'SUPERADMIN') {
        throw new Error("This ride is finalized and locked. Only a SuperAdmin can make changes.");
      }

      const updateData: any = {};
      if (taxes !== undefined) updateData.taxes = parseFloat(taxes);
      if (tollCharges !== undefined) updateData.tollCharges = parseFloat(tollCharges);
      if (additionalCharges !== undefined) updateData.additionalCharges = parseFloat(additionalCharges);
      if (driverDiscount !== undefined) updateData.partnerManualDiscount = parseFloat(driverDiscount);
      if (partnerId !== undefined) updateData.partnerId = partnerId || null;
      if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
      if (bookingNotes !== undefined) updateData.bookingNotes = bookingNotes;
      if (isLocked !== undefined) {
        if (req.user?.role !== 'SUPERADMIN' && oldRide?.isLocked) {
          throw new Error("Only a SuperAdmin can unlock a ride.");
        }
        updateData.isLocked = isLocked;
      }

      const updatedRide = await prisma.ride.update({
        where: { id },
        data: updateData,
        include: { user: true, partner: true, vehicleType: true }
      });

      // Recalculate total logic (sync with backend calculation if we were changing base fares, but here total changes visually first, then we update it)
      const perKmPrice = updatedRide?.perKmPrice ?? 0;
      const baseFare = updatedRide?.baseFare ?? 0;
      const extraKmCharges = Math.max(0, perKmPrice * (updatedRide?.distanceKm ?? 0));
      const taxableAmount = Math.max(0, baseFare + extraKmCharges);
      const gstAmount = taxableAmount * 0.05;

      const newTotal = baseFare + extraKmCharges + gstAmount +
        (updateData.taxes || 0) + (updateData.tollCharges || 0) + (updateData.additionalCharges || 0);

      const finalizedRide = await prisma.ride.update({
        where: { id },
        data: { totalFare: newTotal }
      });

      res.json({ success: true, message: "Ride details updated", data: finalizedRide });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  updateRidePaymentStatus: async (req: AuthedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { paymentStatus, paymentMode } = req.body;
      const adminId = req.user?.id;

      if (!paymentStatus || !paymentMode) {
        return res.status(400).json({
          success: false,
          message: "paymentStatus and paymentMode are required",
        });
      }

      const oldRide = await prisma.ride.findUnique({ where: { id }, select: { paymentStatus: true, paymentMode: true, isLocked: true } });
      if (oldRide?.isLocked && req.user?.role !== 'SUPERADMIN') {
        throw new Error("This ride is finalized and locked. Only a SuperAdmin can make changes.");
      }
      const ride = await updateRidePaymentStatusByAdmin(id, paymentStatus, paymentMode, adminId);

      createAuditLog({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "UPDATE", module: "RIDE", entityId: id, description: `Ride payment updated: ${paymentStatus} via ${paymentMode}`, oldData: oldRide, newData: { paymentStatus, paymentMode }, ...getRequestContext(req) });

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

  createUser: async (req: AuthedRequest, res: Response) => {
    try {
      const user = await createUserByAdmin(req.body);
      createAuditLog({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "CREATE", module: "USER", entityId: user.id, description: `Created user: ${req.body.name || req.body.phone}`, newData: user, ...getRequestContext(req) });
      res.status(201).json({ success: true, message: "User created successfully", data: user });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  updateUser: async (req: AuthedRequest, res: Response) => {
    try {
      const oldUser = await prisma.user.findUnique({ where: { id: req.params.id }, select: { name: true, phone: true, email: true } });
      const user = await updateUserByAdmin(req.params.id, req.body);
      createAuditLog({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "UPDATE", module: "USER", entityId: req.params.id, description: `Updated user details`, oldData: oldUser, newData: req.body, ...getRequestContext(req) });
      res.json({ success: true, message: "User updated successfully", data: user });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  getAllUsers: async (req: AuthedRequest, res: Response) => {
    try {
      const { search } = req.query;
      const users = await getAllUsers({ search: search as string });

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

  /* ============================================
      RIDER/PARTNER MANAGEMENT
  ============================================ */

  createPartner: async (req: AuthedRequest, res: Response) => {
    try {
      const partner = await createPartnerByAdmin(req.body);
      createAuditLog({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "CREATE", module: "PARTNER", entityId: partner.id, description: `Created partner: ${req.body.name || req.body.phone}`, newData: partner, ...getRequestContext(req) });
      res.status(201).json({ success: true, message: "Partner created successfully", data: partner });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  getAllRiders: async (req: AuthedRequest, res: Response) => {
    try {
      const { status, verificationStatus, search, isOnline } = req.query;
      const partners = await getAllPartners({
        status: status as any,
        verificationStatus: verificationStatus as any,
        search: search as string,
        isOnline: isOnline === "true" ? true : isOnline === "false" ? false : undefined,
      });

      return res.status(200).json({
        success: true,
        message: "Partners retrieved successfully",
        data: partners,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to get riders",
      });
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

  getActivePartnerLocations: async (req: AuthedRequest, res: Response) => {
    try {
      const locations = await getActivePartnerLocations();
      return res.status(200).json({
        success: true,
        message: "Active partner locations retrieved successfully",
        data: locations,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to get active partner locations",
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
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to get scheduled rides",
      });
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

      createAuditLog({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "ASSIGNMENT", module: "RIDE", entityId: id, description: `Assigned partner to ride`, newData: { partnerId }, ...getRequestContext(req) });

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
      createAuditLog({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "CREATE", module: "VENDOR", entityId: vendor.id, description: `Created vendor: ${req.body.name || req.body.phone}`, newData: vendor, ...getRequestContext(req) });
      res.status(201).json({ success: true, message: "Vendor created successfully", data: vendor });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  createAgent: async (req: AuthedRequest, res: Response) => {
    try {
      const agent = await createAgentByAdmin(req.body);
      createAuditLog({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "CREATE", module: "AGENT", entityId: agent.id, description: `Created agent: ${req.body.name || req.body.phone}`, newData: agent, ...getRequestContext(req) });
      res.status(201).json({ success: true, message: "Agent created successfully", data: agent });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  getAllVendors: async (req: AuthedRequest, res: Response) => {
    try {
      const { search, status, verificationStatus, includeDeleted } = req.query;
      const vendors = await getAllVendors({
        search: search as string,
        status: status as any,
        verificationStatus: verificationStatus as any,
        includeDeleted: includeDeleted === "true"
      });
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
      const adminId = req.user?.id;
      const oldVendor = await prisma.vendor.findUnique({ where: { id: req.params.id }, select: { name: true, companyName: true, phone: true, email: true, status: true, verificationStatus: true } });
      const vendor = await updateVendor(req.params.id, req.body, adminId);
      createAuditLog({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "UPDATE", module: "VENDOR", entityId: req.params.id, description: `Updated vendor details`, oldData: oldVendor, newData: req.body, ...getRequestContext(req) });
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
      const { search, status, agentId } = req.query;
      const corporates = await getAllCorporates({
        search: search as string,
        status: status as any,
        agentId: agentId as string,
      });
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
      const oldCorp = await prisma.corporate.findUnique({ where: { id: req.params.id }, select: { companyName: true, status: true, verificationStatus: true } });
      const corporate = await updateCorporate(req.params.id, req.body);
      createAuditLog({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "UPDATE", module: "CORPORATE", entityId: req.params.id, description: `Updated corporate: ${oldCorp?.companyName || 'corporate'}`, oldData: oldCorp, newData: req.body, ...getRequestContext(req) });
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
      createAuditLog({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "CREATE", module: "CITY_CODE", entityId: city.id, description: `Created city code: ${req.body.code} - ${req.body.cityName}`, newData: city, ...getRequestContext(req) });
      res.status(201).json({ success: true, data: city });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  updateCityCode: async (req: AuthedRequest, res: Response) => {
    try {
      const oldCity = await prisma.cityCode.findUnique({ where: { id: req.params.id }, select: { code: true, cityName: true, isActive: true } });
      const city = await updateCityCode(req.params.id, req.body);
      createAuditLog({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "UPDATE", module: "CITY_CODE", entityId: req.params.id, description: `Updated city code: ${city.code || req.body.code}`, oldData: oldCity, newData: req.body, ...getRequestContext(req) });
      res.json({ success: true, data: city });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  deleteCityCode: async (req: AuthedRequest, res: Response) => {
    try {
      const oldCity = await prisma.cityCode.findUnique({ where: { id: req.params.id } });
      await deleteCityCode(req.params.id);
      createAuditLog({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "DELETE", module: "CITY_CODE", entityId: req.params.id, description: `Deleted city code: ${oldCity?.code}`, oldData: oldCity, ...getRequestContext(req) });
      res.json({ success: true, message: "City code deleted successfully" });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  /* ============================================
      ATTACHMENT MANAGEMENT
  ============================================ */

  createAttachment: async (req: AuthedRequest, res: Response) => {
    try {
      const adminId = req.user?.id;
      const attachment = await createAttachment({
        ...req.body,
        adminId,
      });
      createAuditLog({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "CREATE", module: "ATTACHMENT", entityId: attachment.id, description: `Created attachment`, newData: attachment, ...getRequestContext(req) });
      res.status(201).json({ success: true, data: attachment });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  getAttachmentById: async (req: AuthedRequest, res: Response) => {
    try {
      const attachment = await getAttachmentById(req.params.id);
      res.json({ success: true, data: attachment });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message });
    }
  },

  getAllAttachments: async (req: AuthedRequest, res: Response) => {
    try {
      const { vendorId, partnerId, vehicleId, verificationStatus } = req.query;
      const attachments = await getAllAttachments({
        vendorId: vendorId as string,
        partnerId: partnerId as string,
        vehicleId: vehicleId as string,
        verificationStatus: verificationStatus as any,
      });
      res.json({ success: true, data: attachments });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  toggleAttachmentStatus: async (req: AuthedRequest, res: Response) => {
    try {
      const { status } = req.body;
      const adminId = req.user?.id;
      if (!status) {
        return res.status(400).json({ success: false, message: "Status is required" });
      }
      const attachment = await updateAttachmentStatus(req.params.id, status, adminId);
      createAuditLog({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "STATUS_CHANGE", module: "ATTACHMENT", entityId: req.params.id, description: `Attachment status changed to ${status}`, newData: { status }, ...getRequestContext(req) });
      res.json({ success: true, data: attachment });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  verifyAttachment: async (req: AuthedRequest, res: Response) => {
    try {
      const { status } = req.body;
      const adminId = req.user?.id;
      if (!status) {
        return res.status(400).json({ success: false, message: "Verification status is required" });
      }
      const attachment = await verifyAttachmentByAdmin(req.params.id, status, adminId);
      createAuditLog({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "STATUS_CHANGE", module: "ATTACHMENT", entityId: req.params.id, description: `Attachment verification: ${status}`, newData: { verificationStatus: status }, ...getRequestContext(req) });
      res.json({ success: true, data: attachment });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  deleteAttachment: async (req: AuthedRequest, res: Response) => {
    try {
      const result = await deleteAttachment(req.params.id);
      createAuditLog({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "DELETE", module: "ATTACHMENT", entityId: req.params.id, description: `Deleted attachment`, ...getRequestContext(req) });
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

  getCancellationAnalytics: async (req: AuthedRequest, res: Response) => {
    try {
      const data = await getCancellationAnalytics();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  getAuditTimeline: async (req: AuthedRequest, res: Response) => {
    try {
      const data = await getAuditTimeline();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },
};
