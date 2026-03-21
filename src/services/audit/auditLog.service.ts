import { prisma } from "../../config/prisma";
import { AuditAction } from "@prisma/client";

/* ============================================
    HELPER: Extract request context
============================================ */
export const getRequestContext = (req: any) => ({
  ipAddress: undefined,
  userAgent: undefined,
});

/* ============================================
    CREATE AUDIT LOG (Fire-and-forget)
============================================ */
export const createAuditLog = async (data: {
  userId?: string;
  userName?: string;
  userRole?: string;
  action: AuditAction;
  module: string;
  entityId?: string;
  description: string;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> => {
  try {
    await prisma.auditLog.create({
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
  } catch (error) {
    // Fire-and-forget: log errors but never block the main operation
    console.error("Failed to create audit log:", error);
  }
};

/* ============================================
    GET AUDIT LOGS (with pagination & filters)
============================================ */
export const getAuditLogs = async (filters?: {
  module?: string;
  action?: string;
  userId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) => {
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (filters?.module) {
    where.module = filters.module;
  }

  if (filters?.action) {
    where.action = filters.action as AuditAction;
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
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        userId: true,
        userName: true,
        userRole: true,
        action: true,
        module: true,
        entityId: true,
        description: true,
        oldData: true,
        newData: true,
        createdAt: true,
      },
    }),
    prisma.auditLog.count({ where }),
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

/* ============================================
    GET AUDIT LOG BY ID
============================================ */
export const getAuditLogById = async (id: string) => {
  const log = await prisma.auditLog.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      userName: true,
      userRole: true,
      action: true,
      module: true,
      entityId: true,
      description: true,
      oldData: true,
      newData: true,
      createdAt: true,
    },
  });

  if (!log) {
    throw new Error("Audit log not found");
  }

  return log;
};
