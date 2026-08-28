import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { ConfigService } from "@nestjs/config";
import { createLogger } from "@vibely/shared";

const logger = createLogger("RedisService");

/**
 * Cache / pub-sub client.
 * Fails soft: if Redis is unreachable the service logs a warning and continues
 * without caching, so presence/matching can later reconnect.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const url = this.configService.get<string>("app.redisUrl")!;
    this.client = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1 });
    this.client.on("error", (err) => {
      logger.error("Redis error", { error: err.message });
    });
    try {
      const connect = this.client.connect();
      const timeout = new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error("redis connect timeout")), 1500),
      );
      await Promise.race([connect, timeout]);
      await this.client.ping();
      logger.info("Redis connection established");
    } catch (error) {
      logger.error("Redis connection failed", {
        error: error instanceof Error ? error.message : "unknown",
      });
      this.client = null;
    }
  }

  isReady(): boolean {
    return this.client !== null;
  }

  getClient(): Redis | null {
    return this.client;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client) return;
    if (ttlSeconds) {
      await this.client.set(key, value, "EX", ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    return this.client.get(key);
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    await this.client.del(key);
  }

  async zAdd(key: string, member: { score: number; value: string }): Promise<void> {
    if (!this.client) return;
    await this.client.zadd(key, member.score, member.value);
  }

  async zRange(key: string, start: number, stop: number): Promise<string[]> {
    if (!this.client) return [];
    return this.client.zrange(key, start, stop);
  }

  async zRem(key: string, members: string[]): Promise<void> {
    if (!this.client) return;
    await this.client.zrem(key, ...members);
  }

  async sAdd(key: string, member: string): Promise<void> {
    if (!this.client) return;
    await this.client.sadd(key, member);
  }

  async sMembers(key: string): Promise<string[]> {
    if (!this.client) return [];
    return this.client.smembers(key);
  }

  async expire(key: string, ttl: number): Promise<void> {
    if (!this.client) return;
    await this.client.expire(key, ttl);
  }

  async incr(key: string): Promise<number> {
    if (!this.client) return 0;
    return this.client.incr(key);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }
  }
}
