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
      const { vendorId, vehicleTypeId, isAvailable, isActive, search } = req.query;
      const vehicles = await vehicleService.getAllVehicles({
        vendorId: vendorId as string,
        vehicleTypeId: vehicleTypeId as string,
        isAvailable: isAvailable === "true" ? true : isAvailable === "false" ? false : undefined,
        isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
        search: search as string,
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
      const vehicle = await vehicleService.updateVehicle(req.params.id, req.body);
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
      const result = await vehicleService.deleteVehicle(req.params.id);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },
};
