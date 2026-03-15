import { Response } from "express";
import { AuthedRequest } from "../../middleware/auth.middleware";
import * as vehicleService from "../../services/vehicle/vehicle.service";

export default {
  /* ============================================
      VEHICLE MANAGEMENT
  ============================================ */

  async createVehicle(req: AuthedRequest, res: Response) {
    try {
      const vehicle = await vehicleService.createVehicle(req.body);
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
      const vehicle = await vehicleService.updateVehicle(req.params.id, {
        ...req.body,
        updatedByAdminId: adminId
      });
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
      const vehicle = await vehicleService.updateVehicleStatus(req.params.id, status, adminId);
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
      const vehicle = await vehicleService.updateVehicleVerification(req.params.id, status, adminId);
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
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },
};
