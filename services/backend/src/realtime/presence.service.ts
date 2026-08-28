import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { RedisService } from "../cache/redis.service";
import { PrismaService } from "../database/prisma.service";
import { createLogger } from "@vibely/shared";

const logger = createLogger("PresenceService");

@Injectable()
export class PresenceService implements OnModuleInit, OnModuleDestroy {
  private readonly prefix = "presence:";
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(private readonly redis: RedisService, private readonly prisma: PrismaService) {}

  async onModuleInit() {
    this.cleanupInterval = setInterval(() => {
      void this.cleanupExpired();
    }, 30000);
  }

  async onModuleDestroy() {
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
  }

  async markOnline(userId: string, socketId: string): Promise<void> {
    await this.redis.set(`${this.prefix}${userId}`, socketId, 60);
    await this.prisma.profile.upsert({
      where: { userId },
      create: { userId, onlineStatus: "ONLINE", bio: "", interests: [] },
      update: { onlineStatus: "ONLINE", lastSeen: new Date() },
    });
    logger.debug("User online", { userId, socketId });
  }

  async markOffline(userId: string): Promise<void> {
    await this.redis.del(`${this.prefix}${userId}`);
    await this.prisma.profile.updateMany({
      where: { userId },
      data: { onlineStatus: "OFFLINE", lastSeen: new Date() },
    });
    logger.debug("User offline", { userId });
  }

  async heartbeat(userId: string): Promise<void> {
    await this.redis.set(`${this.prefix}${userId}`, "alive", 60);
  }

  async getSocketId(userId: string): Promise<string | null> {
    return this.redis.get(`${this.prefix}${userId}`);
  }

  private async cleanupExpired(): Promise<void> {
    if (!this.redis.isReady()) return;
    try {
      const client = this.redis.getClient();
      if (!client) return;
      let cursor = "0";
      do {
        const result = await client.scan(cursor, "MATCH", `${this.prefix}*`, "COUNT", "100");
        const [next, keys] = result as [string, string[]];
        cursor = next;
        for (const key of keys) {
          const ttl = await client.ttl(key);
          if (ttl === -2 || (ttl > 0 && ttl < 15)) {
            const userId = key.replace(this.prefix, "");
            await this.markOffline(userId);
          }
        }
      } while (cursor !== "0");
    } catch (err) {
      logger.warn("Presence cleanup failed", { error: err instanceof Error ? err.message : "unknown" });
    }
  }
}
