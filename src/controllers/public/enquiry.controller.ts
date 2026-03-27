import { Request, Response } from "express";
import { createAuditLog } from "../../services/audit/auditLog.service";
import { AuditAction } from "@prisma/client";

export default {
  async submitEnquiry(req: Request, res: Response) {
    try {
      const { name, phone, pickup, drop, rideType, vehicleType, pickupDateTime, passengers, message } = req.body;

      if (!name || !phone || !pickup) {
        return res.status(400).json({
          success: false,
          message: "Name, phone, and pickup location are required",
        });
      }

      const description = `New Enquiry received from ${name} (${phone}) for ${rideType || 'LOCAL'} ride. Vehicle: ${vehicleType || 'Any'}. Date: ${pickupDateTime || 'Not specified'}. Passengers: ${passengers || 'Not specified'}. Pickup: ${pickup}. Drop: ${drop || 'Not provided'}. ${message ? `Message: ${message}` : ''}`;

      // Log the enquiry asynchronously in the audit logs
      await createAuditLog({
        action: AuditAction.CREATE,
        module: "ENQUIRY",
        description,
        newData: { name, phone, pickup, drop, rideType, vehicleType, pickupDateTime, passengers, message },
      });

      res.status(200).json({
        success: true,
        message: "Enquiry submitted successfully",
      });
    } catch (error: any) {
      console.error("Error submitting enquiry:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error submitting enquiry",
      });
    }
  },
};
