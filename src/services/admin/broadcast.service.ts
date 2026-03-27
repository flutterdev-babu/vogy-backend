import { prisma } from "../../config/prisma";
import { createAuditLog } from "../audit/auditLog.service";

/**
 * Broadcast Notification Service
 * Logs broadcast notifications via AuditLog for now.
 * FCM integration can be added when Firebase Admin SDK is configured.
 */

export const sendBroadcastNotification = async (data: {
  title: string;
  body: string;
  imageUrl?: string;
  targetAudience: string;
  sentBy: string;
  sentByName: string;
}) => {
  // Get audience count for display
  let recipientCount = 0;

  if (data.targetAudience === "ALL_USERS") {
    recipientCount = await prisma.user.count();
  } else if (data.targetAudience === "ALL_PARTNERS") {
    recipientCount = await prisma.partner.count();
  } else if (data.targetAudience === "ONLINE_PARTNERS") {
    recipientCount = await prisma.partner.count({ where: { isOnline: true } });
  } else if (data.targetAudience === "ALL_VENDORS") {
    recipientCount = await prisma.vendor.count();
  }

  // Log as audit event
  await createAuditLog({
    userId: data.sentBy,
    userName: data.sentByName,
    userRole: "ADMIN",
    action: "CREATE" as any,
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

export const getBroadcastHistory = async () => {
  // Fetch broadcast history from audit logs
  const logs = await prisma.auditLog.findMany({
    where: {
      action: "CREATE" as any,
      module: "NOTIFICATION",
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return logs.map((log) => ({
    id: log.id,
    title: (log.newData as any)?.title || "N/A",
    body: (log.newData as any)?.body || "N/A",
    targetAudience: (log.newData as any)?.targetAudience || "N/A",
    recipientCount: (log.newData as any)?.recipientCount || 0,
    sentByName: log.userName,
    sentAt: log.createdAt,
  }));
};
