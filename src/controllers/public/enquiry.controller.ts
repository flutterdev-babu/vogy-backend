import { Request, Response } from "express";
import { createAuditLog } from "../../services/audit/auditLog.service";
import { AuditAction } from "@prisma/client";

export default {
  async submitEnquiry(req: Request, res: Response) {
    try {
      const { phone, pickup, drop, rideType, message } = req.body;

      if (!phone || !pickup) {
        return res.status(400).json({
          success: false,
          message: "Phone and pickup location are required",
        });
      }

      const description = `New Enquiry received from ${phone} for ${rideType || 'LOCAL'} ride. Pickup: ${pickup}. Drop: ${drop || 'Not provided'}. ${message ? `Message: ${message}` : ''}`;

      // Log the enquiry asynchronously in the audit logs
      await createAuditLog({
        action: AuditAction.CREATE,
        module: "ENQUIRY",
        description,
        newData: { phone, pickup, drop, rideType, message },
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
