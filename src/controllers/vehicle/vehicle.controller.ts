import { Response } from "express";
import { AuthedRequest } from "../../middleware/auth.middleware";
import * as vehicleService from "../../services/vehicle/vehicle.service";
import { prisma } from "../../config/prisma";
import { createAuditLog, getRequestContext } from "../../services/audit/auditLog.service";

export default {
  /* ============================================
      VEHICLE MANAGEMENT
  ============================================ */

  async createVehicle(req: AuthedRequest, res: Response) {
    try {
      // If user is a VENDOR, automatically set vendorId
      if (req.user?.role === "VENDOR") {
        req.body.vendorId = req.user.id;
      }

      const vehicle = await vehicleService.createVehicle(req.body);
      createAuditLog({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "CREATE", module: "VEHICLE", entityId: vehicle.id, description: `Created vehicle: ${req.body.registrationNumber || vehicle.id}`, newData: vehicle, ...getRequestContext(req) });
      res.status(201).json({ success: true, data: vehicle });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async getAllVehicles(req: AuthedRequest, res: Response) {
    try {
      const { vendorId, vehicleTypeId, isAvailable, status, verificationStatus, search, includeDeleted, cityCodeId } = req.query;
      const vehicles = await vehicleService.getAllVehicles({
        vendorId: vendorId as string,
        vehicleTypeId: vehicleTypeId as string,
        isAvailable: isAvailable === "true" ? true : isAvailable === "false" ? false : undefined,
        status: status ? (status as string).toUpperCase() as any : undefined,
        verificationStatus: verificationStatus ? (verificationStatus as string).toUpperCase() as any : undefined,
        search: search as string,
        includeDeleted: includeDeleted === "true",
        cityCodeId: cityCodeId as string,
      });
      res.json({ success: true, data: vehicles });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getVehicleById(req: AuthedRequest, res: Response) {
    try {
      const vehicle = await vehicleService.getVehicleById(req.params.id);
      res.json({ success: true, data: vehicle });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message });
    }
  },

  async updateVehicle(req: AuthedRequest, res: Response) {
    try {
      const adminId = req.user?.id;
      const oldVehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id }, select: { registrationNumber: true, vehicleModel: true, status: true, verificationStatus: true } });
      const vehicle = await vehicleService.updateVehicle(req.params.id, {
        ...req.body,
        updatedByAdminId: adminId
      });
      createAuditLog({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "UPDATE", module: "VEHICLE", entityId: req.params.id, description: `Updated vehicle details`, oldData: oldVehicle, newData: req.body, ...getRequestContext(req) });
      res.json({ success: true, data: vehicle });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async updateVehicleStatus(req: AuthedRequest, res: Response) {
    try {
      const { status } = req.body;
      const adminId = req.user?.id;
      if (!status) {
        return res.status(400).json({ success: false, message: "Status is required" });
      }
      const oldVehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id }, select: { status: true, registrationNumber: true } });
      const vehicle = await vehicleService.updateVehicleStatus(req.params.id, status, adminId);
      createAuditLog({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "STATUS_CHANGE", module: "VEHICLE", entityId: req.params.id, description: `Vehicle status changed to ${status}`, oldData: oldVehicle, newData: { status }, ...getRequestContext(req) });
      res.json({ success: true, data: vehicle });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async updateVehicleVerification(req: AuthedRequest, res: Response) {
    try {
      const { status } = req.body;
      const adminId = req.user?.id;
      if (!status) {
        return res.status(400).json({ success: false, message: "Verification status is required" });
      }
      const oldVehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id }, select: { verificationStatus: true, registrationNumber: true } });
      const vehicle = await vehicleService.updateVehicleVerification(req.params.id, status, adminId);
      createAuditLog({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "STATUS_CHANGE", module: "VEHICLE", entityId: req.params.id, description: `Vehicle verification changed to ${status}`, oldData: oldVehicle, newData: { verificationStatus: status }, ...getRequestContext(req) });
      res.json({ success: true, data: vehicle });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async assignVehicleToVendor(req: AuthedRequest, res: Response) {
    try {
      const { vendorId } = req.body;
      if (!vendorId) {
        return res.status(400).json({ success: false, message: "vendorId is required" });
      }
      const vehicle = await vehicleService.assignVehicleToVendor(req.params.id, vendorId);
      createAuditLog({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "ASSIGNMENT", module: "VEHICLE", entityId: req.params.id, description: `Assigned vehicle to vendor`, newData: { vendorId }, ...getRequestContext(req) });
      res.json({ success: true, data: vehicle });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async getAvailableVehicles(req: AuthedRequest, res: Response) {
    try {
      const { vehicleTypeId } = req.query;
      const vehicles = await vehicleService.getAvailableVehicles(vehicleTypeId as string);
      res.json({ success: true, data: vehicles });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getVehicleRides(req: AuthedRequest, res: Response) {
    try {
      const rides = await vehicleService.getVehicleRides(req.params.id);
      res.json({ success: true, data: rides });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async deleteVehicle(req: AuthedRequest, res: Response) {
    try {
      const adminId = req.user?.id;
      const result = await vehicleService.deleteVehicle(req.params.id, adminId);
      createAuditLog({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: "DELETE", module: "VEHICLE", entityId: req.params.id, description: `Deleted a vehicle`, ...getRequestContext(req) });
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },
};
