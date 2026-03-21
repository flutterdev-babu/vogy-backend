"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogById = exports.getAuditLogs = exports.createAuditLog = void 0;
const prisma_1 = require("../../config/prisma");
/* ============================================
    CREATE AUDIT LOG (Fire-and-forget)
============================================ */
const createAuditLog = async (data) => {
    try {
        await prisma_1.prisma.auditLog.create({
            data: {
                userId: data.userId || null,
                userName: data.userName || null,
                userRole: data.userRole || null,
                action: data.action,
                module: data.module,
                entityId: data.entityId || null,
                description: data.description,
                oldData: data.oldData ? JSON.parse(JSON.stringify(data.oldData)) : null,
                newData: data.newData ? JSON.parse(JSON.stringify(data.newData)) : null,
                ipAddress: data.ipAddress || null,
                userAgent: data.userAgent || null,
            },
        });
    }
    catch (error) {
        // Fire-and-forget: log errors but never block the main operation
        console.error("Failed to create audit log:", error);
    }
};
exports.createAuditLog = createAuditLog;
/* ============================================
    GET AUDIT LOGS (with pagination & filters)
============================================ */
const getAuditLogs = async (filters) => {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;
    const where = {};
    if (filters?.module) {
        where.module = filters.module;
    }
    if (filters?.action) {
        where.action = filters.action;
    }
    if (filters?.userId) {
        where.userId = filters.userId;
    }
    if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters?.startDate) {
            where.createdAt.gte = new Date(filters.startDate);
        }
        if (filters?.endDate) {
            where.createdAt.lte = new Date(filters.endDate);
        }
    }
    if (filters?.search) {
        where.OR = [
            { description: { contains: filters.search, mode: "insensitive" } },
            { userName: { contains: filters.search, mode: "insensitive" } },
            { module: { contains: filters.search, mode: "insensitive" } },
            { entityId: { contains: filters.search, mode: "insensitive" } },
        ];
    }
    const [logs, total] = await Promise.all([
        prisma_1.prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma_1.prisma.auditLog.count({ where }),
    ]);
    return {
        logs,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};
exports.getAuditLogs = getAuditLogs;
/* ============================================
    GET AUDIT LOG BY ID
============================================ */
const getAuditLogById = async (id) => {
    const log = await prisma_1.prisma.auditLog.findUnique({
        where: { id },
    });
    if (!log) {
        throw new Error("Audit log not found");
    }
    return log;
};
exports.getAuditLogById = getAuditLogById;
