import { Response } from "express";
import { AuthedRequest } from "../../middleware/auth.middleware";
import { prisma } from "../../config/prisma";
import { hashPassword } from "../../utils/hash";
import { createAuditLog, getRequestContext } from "../../services/audit/auditLog.service";

// Valid permission codes
export const VALID_PERMISSIONS = [
  "dashboard",
  "rides",
  "partners",
  "vehicles",
  "vendors",
  "attachments",
  "users",
  "corporates",
  "agents",
  "promotions",
  "config",
  "billing",
  "audit_logs",
  "support_tickets",
] as const;

export default {
  // Get all admins
  getAllAdmins: async (req: AuthedRequest, res: Response) => {
    try {
      const admins = await prisma.admin.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          permissions: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
      });
      res.json({ success: true, data: admins });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Get admin by ID
  getAdminById: async (req: AuthedRequest, res: Response) => {
    try {
      const admin = await prisma.admin.findUnique({
        where: { id: req.params.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          permissions: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      if (!admin) {
        return res.status(404).json({ success: false, message: "Admin not found" });
      }
      res.json({ success: true, data: admin });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Create a new admin (with permissions)
  createAdmin: async (req: AuthedRequest, res: Response) => {
    try {
      const { name, email, password, role, permissions } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: "name, email, and password are required" });
      }

      const exists = await prisma.admin.findUnique({ where: { email } });
      if (exists) {
        return res.status(400).json({ success: false, message: "Admin with this email already exists" });
      }

      const hashedPassword = await hashPassword(password);
      const admin = await prisma.admin.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: role || "SUBADMIN",
          permissions: permissions || [],
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          permissions: true,
          createdAt: true,
        },
      });

      createAuditLog({
        userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role,
        action: "CREATE", module: "ADMIN", entityId: admin.id,
        description: `Created admin: ${name} (${email})`, newData: { name, email, role: role || "SUBADMIN", permissions },
        ...getRequestContext(req),
      });

      res.status(201).json({ success: true, message: "Admin created successfully", data: admin });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  // Update admin (name, role, permissions)
  updateAdmin: async (req: AuthedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { name, role, permissions } = req.body;

      const existingAdmin = await prisma.admin.findUnique({
        where: { id },
        select: { id: true, name: true, role: true, permissions: true },
      });

      if (!existingAdmin) {
        return res.status(404).json({ success: false, message: "Admin not found" });
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (role) updateData.role = role;
      if (permissions !== undefined) updateData.permissions = permissions;

      const admin = await prisma.admin.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          permissions: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      createAuditLog({
        userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role,
        action: "UPDATE", module: "ADMIN", entityId: id,
        description: `Updated admin: ${admin.name}`, oldData: existingAdmin, newData: updateData,
        ...getRequestContext(req),
      });

      res.json({ success: true, message: "Admin updated successfully", data: admin });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  // Delete admin
  deleteAdmin: async (req: AuthedRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Prevent deleting yourself
      if (req.user?.id === id) {
        return res.status(400).json({ success: false, message: "You cannot delete your own account" });
      }

      const admin = await prisma.admin.findUnique({ where: { id } });
      if (!admin) {
        return res.status(404).json({ success: false, message: "Admin not found" });
      }

      await prisma.admin.delete({ where: { id } });

      createAuditLog({
        userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role,
        action: "DELETE", module: "ADMIN", entityId: id,
        description: `Deleted admin: ${admin.name}`,
        ...getRequestContext(req),
      });

      res.json({ success: true, message: "Admin deleted successfully" });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  // Get available permission codes
  getPermissions: async (_req: AuthedRequest, res: Response) => {
    const permissions = VALID_PERMISSIONS.map(code => ({
      code,
      label: code.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    }));
    res.json({ success: true, data: permissions });
  },
};
