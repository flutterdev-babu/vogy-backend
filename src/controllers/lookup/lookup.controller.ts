import { Response } from "express";
import { AuthedRequest } from "../../middleware/auth.middleware";
import * as lookupService from "../../services/lookup/lookup.service";

export default {
  async getVendors(req: AuthedRequest, res: Response) {
    try {
      const { agentId } = req.query;
      const vendors = await lookupService.getVendorsForDropdown(agentId as string);
      res.json({ success: true, data: vendors });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getPartners(req: AuthedRequest, res: Response) {
    try {
      const { vendorId } = req.query;
      const partners = await lookupService.getPartnersForDropdown(vendorId as string);
      res.json({ success: true, data: partners });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getVehicleTypes(req: AuthedRequest, res: Response) {
    try {
      const types = await lookupService.getVehicleTypesForDropdown();
      res.json({ success: true, data: types });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
