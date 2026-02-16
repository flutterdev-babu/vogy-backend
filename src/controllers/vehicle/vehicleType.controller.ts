import { Request, Response } from "express";
import * as vehicleTypeService from "../../services/vehicle/vehicleType.service";

export default {
  async create(req: Request, res: Response) {
    try {
      const vehicleType = await vehicleTypeService.createVehicleType(req.body);
      res.status(201).json({ success: true, data: vehicleType });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async getAll(req: Request, res: Response) {
    try {
      const vehicleTypes = await vehicleTypeService.getAllVehicleTypes();
      res.json({ success: true, data: vehicleTypes });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const vehicleType = await vehicleTypeService.getVehicleTypeById(req.params.id);
      if (!vehicleType) return res.status(404).json({ success: false, message: "Vehicle type not found" });
      res.json({ success: true, data: vehicleType });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const vehicleType = await vehicleTypeService.updateVehicleType(req.params.id, req.body);
      res.json({ success: true, data: vehicleType });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      await vehicleTypeService.deleteVehicleType(req.params.id);
      res.json({ success: true, message: "Vehicle type deleted successfully" });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },
};
