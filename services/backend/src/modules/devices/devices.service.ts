import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { createLogger } from "@vibely/shared";

const logger = createLogger("DevicesService");

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async register(userId: string, input: { deviceId: string; platform: string; pushToken: string }) {
    const { deviceId, platform, pushToken } = input;

    if (!deviceId || !platform || !pushToken) {
      throw new BadRequestException("deviceId, platform, and pushToken are required");
    }

    const device = await this.prisma.device.upsert({
      where: { userId_deviceId: { userId, deviceId } },
      update: { platform, pushToken, updatedAt: new Date() },
      create: { userId, deviceId, platform, pushToken },
    });

    logger.info("Device registered", { userId, deviceId, platform });
    return device;
  }

  async list(userId: string) {
    const devices = await this.prisma.device.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return { items: devices, total: devices.length };
  }

  async unregister(userId: string, deviceId: string) {
    const device = await this.prisma.device.findFirst({
      where: { userId, deviceId },
    });
    if (!device) {
      throw new NotFoundException("Device not found");
    }

    await this.prisma.device.delete({
      where: { id: device.id },
    });

    logger.info("Device unregistered", { userId, deviceId });
    return { success: true };
  }

  async getDevicesByUser(userId: string) {
    return this.prisma.device.findMany({
      where: { userId },
    });
  }
}
