import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { RealtimeGateway } from "../../realtime/realtime.gateway";
import { RealtimeEvent } from "@vibely/types";
import { NotificationType } from "@prisma/client";
import { DevicesService } from "../devices/devices.service";
import { PushNotificationService } from "../push/push-notification.service";
import { createLogger } from "@vibely/shared";

const logger = createLogger("NotificationsService");

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: RealtimeGateway,
    private readonly devicesService: DevicesService,
    private readonly pushService: PushNotificationService,
  ) {}

  async list(userId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return { items: notifications, total: notifications.length };
  }

  async markRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification) {
      throw new NotFoundException("Notification not found");
    }
    if (notification.userId !== userId) {
      throw new ForbiddenException("Not authorized");
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    this.gateway.server.to(userId).emit(RealtimeEvent.NotificationRead, {
      notificationId: updated.id,
    });

    return updated;
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { success: true };
  }

  async delete(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification) {
      throw new NotFoundException("Notification not found");
    }
    if (notification.userId !== userId) {
      throw new ForbiddenException("Not authorized");
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    this.gateway.server.to(userId).emit(RealtimeEvent.NotificationDeleted, {
      notificationId,
    });

    return { success: true };
  }

  async createNotification(userId: string, input: { type: NotificationType; title: string; body: string; data?: string }) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: input.data || null,
      },
    });

    const recipientSocketId = await this.gateway["presence"].getSocketId(userId);
    if (recipientSocketId) {
      this.gateway.server.to(recipientSocketId).emit(RealtimeEvent.NotificationCreated, {
        notificationId: notification.id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: notification.data || undefined,
      });
    }

    try {
      const devices = await this.devicesService.getDevicesByUser(userId);
      for (const device of devices) {
        if (!device.pushToken) continue;
        const result = await this.pushService.sendToDevice(device.pushToken, {
          title: notification.title,
          body: notification.body,
          data: {
            notificationId: notification.id,
            type: notification.type,
            ...(input.data ? JSON.parse(input.data) : {}),
          },
        }, device.platform);

        if (!result.success && result.error) {
          logger.warn("Push delivery failed", { deviceId: device.id, platform: device.platform, error: result.error });
        }
      }
    } catch (error: any) {
      logger.error("Failed to send push notifications", error);
    }

    return notification;
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, read: false },
    });
    return { count };
  }
}
