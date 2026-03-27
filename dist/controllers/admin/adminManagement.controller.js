"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_PERMISSIONS = void 0;
const prisma_1 = require("../../config/prisma");
const hash_1 = require("../../utils/hash");
const auditLog_service_1 = require("../../services/audit/auditLog.service");
// Valid permission codes
exports.VALID_PERMISSIONS = [
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
];
exports.default = {
    // Get all admins
    getAllAdmins: async (req, res) => {
        try {
            const admins = await prisma_1.prisma.admin.findMany({
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
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    // Get admin by ID
    getAdminById: async (req, res) => {
        try {
            const admin = await prisma_1.prisma.admin.findUnique({
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
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    // Create a new admin (with permissions)
    createAdmin: async (req, res) => {
        try {
            const { name, email, password, role, permissions } = req.body;
            if (!name || !email || !password) {
                return res.status(400).json({ success: false, message: "name, email, and password are required" });
            }
            const exists = await prisma_1.prisma.admin.findUnique({ where: { email } });
            if (exists) {
                return res.status(400).json({ success: false, message: "Admin with this email already exists" });
            }
            const hashedPassword = await (0, hash_1.hashPassword)(password);
            const admin = await prisma_1.prisma.admin.create({
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
            (0, auditLog_service_1.createAuditLog)({
                userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role,
                action: "CREATE", module: "ADMIN", entityId: admin.id,
                description: `Created admin: ${name} (${email})`, newData: { name, email, role: role || "SUBADMIN", permissions },
                ...(0, auditLog_service_1.getRequestContext)(req),
            });
            res.status(201).json({ success: true, message: "Admin created successfully", data: admin });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    // Update admin (name, role, permissions)
    updateAdmin: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, role, permissions } = req.body;
            const existingAdmin = await prisma_1.prisma.admin.findUnique({
                where: { id },
                select: { id: true, name: true, role: true, permissions: true },
            });
            if (!existingAdmin) {
                return res.status(404).json({ success: false, message: "Admin not found" });
            }
            const updateData = {};
            if (name)
                updateData.name = name;
            if (role)
                updateData.role = role;
            if (permissions !== undefined)
                updateData.permissions = permissions;
            const admin = await prisma_1.prisma.admin.update({
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
            (0, auditLog_service_1.createAuditLog)({
                userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role,
                action: "UPDATE", module: "ADMIN", entityId: id,
                description: `Updated admin: ${admin.name}`, oldData: existingAdmin, newData: updateData,
                ...(0, auditLog_service_1.getRequestContext)(req),
            });
            res.json({ success: true, message: "Admin updated successfully", data: admin });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    // Delete admin
    deleteAdmin: async (req, res) => {
        try {
            const { id } = req.params;
            // Prevent deleting yourself
            if (req.user?.id === id) {
                return res.status(400).json({ success: false, message: "You cannot delete your own account" });
            }
            const admin = await prisma_1.prisma.admin.findUnique({ where: { id } });
            if (!admin) {
                return res.status(404).json({ success: false, message: "Admin not found" });
            }
            await prisma_1.prisma.admin.delete({ where: { id } });
            (0, auditLog_service_1.createAuditLog)({
                userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role,
                action: "DELETE", module: "ADMIN", entityId: id,
                description: `Deleted admin: ${admin.name}`,
                ...(0, auditLog_service_1.getRequestContext)(req),
            });
            res.json({ success: true, message: "Admin deleted successfully" });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },
    // Get available permission codes
    getPermissions: async (_req, res) => {
        const permissions = exports.VALID_PERMISSIONS.map(code => ({
            code,
            label: code.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        }));
        res.json({ success: true, data: permissions });
    },
};
