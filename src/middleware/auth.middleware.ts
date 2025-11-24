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

      // fetch user by role
      const role = payload.role as string;
      let account = null;
      if (role === "USER") account = await prisma.user.findUnique({ where: { id: payload.id } });
      else if (role === "RIDER") account = await prisma.rider.findUnique({ where: { id: payload.id } });
      else if (role === "ADMIN") account = await prisma.admin.findUnique({ where: { id: payload.id } });

      if (!account) return res.status(401).json({ success: false, message: "Account not found" });

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
