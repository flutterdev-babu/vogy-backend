import { Response } from "express";
import { AuthedRequest } from "../../middleware/auth.middleware";
import * as auditLogService from "../../services/audit/auditLog.service";

export default {
  /* ============================================
      GET ALL AUDIT LOGS (paginated)
  ============================================ */
  async getAuditLogs(req: AuthedRequest, res: Response) {
    try {
      const {
        module,
        action,
        userId,
        search,
        startDate,
        endDate,
        page,
        limit,
      } = req.query;

      const result = await auditLogService.getAuditLogs({
        module: module as string,
        action: action as string,
        userId: userId as string,
        search: search as string,
        startDate: startDate as string,
        endDate: endDate as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json({
        success: true,
        data: result.logs,
        pagination: result.pagination,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /* ============================================
      GET AUDIT LOG BY ID
  ============================================ */
  async getAuditLogById(req: AuthedRequest, res: Response) {
    try {
      const log = await auditLogService.getAuditLogById(req.params.id);
      res.json({ success: true, data: log });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message });
    }
  },
};
