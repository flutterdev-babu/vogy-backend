import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { prisma } from "../config/prisma";

export type AuthedRequest = Request & { user?: any };

export const authMiddleware = (allowedRoles: string[] = []) => {
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      const auth = req.headers.authorization;
      if (!auth || !auth.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      const token = auth.split(" ")[1];
      const payload = verifyToken(token);
      if (!payload || !payload.id || !payload.role) {
        return res.status(401).json({ success: false, message: "Invalid token" });
      }

      // --- MOCK USER BYPASS ---
      if (payload.id === "mock_admin_id_123") {
        req.user = { id: payload.id, role: payload.role, account: { id: payload.id, name: "Demo Admin", email: "flutterdev.babu@gmail.com", role: "SUPERADMIN" } };
        return next();
      }
      // ------------------------

      // fetch user by role
      const role = payload.role as string;
      let account = null;
      
      switch (role) {
        case "USER":
          account = await prisma.user.findUnique({ where: { id: payload.id } });
          break;
        case "RIDER":
          // RIDER role is now deprecated - treat as PARTNER for backward compatibility
          account = await prisma.partner.findUnique({ where: { id: payload.id } });
          break;
        case "ADMIN":
          account = await prisma.admin.findUnique({ where: { id: payload.id } });
          break;
        case "VENDOR":
          account = await prisma.vendor.findUnique({ where: { id: payload.id } });
          break;
        case "PARTNER":
          account = await prisma.partner.findUnique({ where: { id: payload.id } });
          break;
        case "AGENT":
          account = await prisma.agent.findUnique({ where: { id: payload.id } });
          break;
        case "CORPORATE":
          account = await prisma.corporate.findUnique({ where: { id: payload.id } });
          break;
        default:
          return res.status(401).json({ success: false, message: "Invalid role" });
      }

      if (!account) return res.status(401).json({ success: false, message: "Account not found" });

      // Check if account is suspended (for entities that have status)
      if ("status" in account && account.status === "SUSPENDED") {
        return res.status(403).json({ success: false, message: "Account suspended" });
      }

      // role check
      if (allowedRoles.length && !allowedRoles.includes(role)) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }

      req.user = { id: payload.id, role, account };
      next();
    } catch (err: any) {
      return res.status(401).json({ success: false, message: err.message || "Unauthorized" });
    }
  };
};
