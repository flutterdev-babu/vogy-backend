import { Response } from "express";
import { AuthedRequest } from "../../middleware/auth.middleware";
import * as cityService from "../../services/city/city.service";

export default {
  /* ============================================
      PUBLIC ENDPOINTS
  ============================================ */

  async getAllCityCodes(req: AuthedRequest, res: Response) {
    try {
      const cityCodes = await cityService.getAllCityCodes();
      res.json({ success: true, data: cityCodes });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /* ============================================
      AGENT ENDPOINTS
  ============================================ */

  async createCityCode(req: AuthedRequest, res: Response) {
    try {
      const { code, cityName } = req.body;
      if (!code || !cityName) {
        return res.status(400).json({
          success: false,
          message: "code and cityName are required",
        });
      }
      const cityCode = await cityService.createCityCode(req.user.id, { code, cityName });
      res.status(201).json({ success: true, data: cityCode });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async getAgentCityCodes(req: AuthedRequest, res: Response) {
    try {
      const cityCodes = await cityService.getAgentCityCodes(req.user.id);
      res.json({ success: true, data: cityCodes });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getCityCodeById(req: AuthedRequest, res: Response) {
    try {
      const cityCode = await cityService.getCityCodeById(req.params.id);
      res.json({ success: true, data: cityCode });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message });
    }
  },

  async updateCityCode(req: AuthedRequest, res: Response) {
    try {
      const cityCode = await cityService.updateCityCode(req.params.id, req.user.id, req.body);
      res.json({ success: true, data: cityCode });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async deleteCityCode(req: AuthedRequest, res: Response) {
    try {
      const result = await cityService.deleteCityCode(req.params.id, req.user.id);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  /* ============================================
      PRICING ENDPOINTS
  ============================================ */

  async setCityPricing(req: AuthedRequest, res: Response) {
    try {
      const { vehicleTypeId, baseKm, baseFare, perKmAfterBase } = req.body;
      
      if (!vehicleTypeId || baseKm === undefined || baseFare === undefined || perKmAfterBase === undefined) {
        return res.status(400).json({
          success: false,
          message: "vehicleTypeId, baseKm, baseFare, and perKmAfterBase are required",
        });
      }

      const pricing = await cityService.setCityPricing(req.user.id, req.params.cityCodeId, {
        vehicleTypeId,
        baseKm,
        baseFare,
        perKmAfterBase,
      });
      res.json({ success: true, data: pricing });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async getCityPricing(req: AuthedRequest, res: Response) {
    try {
      const pricing = await cityService.getCityPricing(req.params.cityCodeId);
      res.json({ success: true, data: pricing });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async deleteCityPricing(req: AuthedRequest, res: Response) {
    try {
      const { vehicleTypeId } = req.params;
      const result = await cityService.deleteCityPricing(
        req.user.id,
        req.params.cityCodeId,
        vehicleTypeId
      );
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },
};
