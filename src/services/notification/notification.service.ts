import { prisma } from "../../config/prisma";

export const getPartnerNotifications = async (partnerId: string) => {
  return await prisma.notification.findMany({
    where: { partnerId },
    orderBy: { createdAt: "desc" },
  });
};

export const createPartnerNotification = async (partnerId: string, data: { title: string; message: string; type?: string }) => {
  return await prisma.notification.create({
    data: {
      partnerId,
      title: data.title,
      message: data.message,
      type: data.type || "INFO",
    },
  });
};

export const markNotificationAsRead = async (notificationId: string) => {
  return await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
};

export const deleteNotification = async (notificationId: string) => {
  return await prisma.notification.delete({
    where: { id: notificationId },
  });
};
