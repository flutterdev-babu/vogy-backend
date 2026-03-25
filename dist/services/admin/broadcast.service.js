"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBroadcastHistory = exports.sendBroadcastNotification = void 0;
const prisma_1 = require("../../config/prisma");
const auditLog_service_1 = require("../audit/auditLog.service");
/**
 * Broadcast Notification Service
 * Logs broadcast notifications via AuditLog for now.
 * FCM integration can be added when Firebase Admin SDK is configured.
 */
const sendBroadcastNotification = async (data) => {
    // Get audience count for display
    let recipientCount = 0;
    if (data.targetAudience === "ALL_USERS") {
        recipientCount = await prisma_1.prisma.user.count();
    }
    else if (data.targetAudience === "ALL_PARTNERS") {
        recipientCount = await prisma_1.prisma.partner.count();
    }
    else if (data.targetAudience === "ONLINE_PARTNERS") {
        recipientCount = await prisma_1.prisma.partner.count({ where: { isOnline: true } });
    }
    else if (data.targetAudience === "ALL_VENDORS") {
        recipientCount = await prisma_1.prisma.vendor.count();
    }
    // Log as audit event
    await (0, auditLog_service_1.createAuditLog)({
        userId: data.sentBy,
        userName: data.sentByName,
        userRole: "ADMIN",
        action: "CREATE",
        module: "NOTIFICATION",
        description: `Broadcast "${data.title}" to ${data.targetAudience} (${recipientCount} recipients)`,
        newData: {
            title: data.title,
            body: data.body,
            imageUrl: data.imageUrl,
            targetAudience: data.targetAudience,
            recipientCount,
        },
    });
    // TODO: Integrate Firebase Admin SDK for actual push notifications
    // const messaging = admin.messaging();
    // Build topic or token-based messaging here
    return {
        success: true,
        title: data.title,
        body: data.body,
        targetAudience: data.targetAudience,
        recipientCount,
        sentAt: new Date(),
    };
};
exports.sendBroadcastNotification = sendBroadcastNotification;
const getBroadcastHistory = async () => {
    // Fetch broadcast history from audit logs
    const logs = await prisma_1.prisma.auditLog.findMany({
        where: {
            action: "CREATE",
            module: "NOTIFICATION",
        },
        orderBy: { createdAt: "desc" },
        take: 100,
    });
    return logs.map((log) => ({
        id: log.id,
        title: log.newData?.title || "N/A",
        body: log.newData?.body || "N/A",
        targetAudience: log.newData?.targetAudience || "N/A",
        recipientCount: log.newData?.recipientCount || 0,
        sentByName: log.userName,
        sentAt: log.createdAt,
    }));
};
exports.getBroadcastHistory = getBroadcastHistory;
