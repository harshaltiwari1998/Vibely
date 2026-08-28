import { Injectable, NestMiddleware, BadRequestException } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { RedisService } from "../../cache/redis.service";
import { createLogger } from "@vibely/shared";

const logger = createLogger("RateLimitMiddleware");

export interface RateLimitOptions {
  windowSeconds: number;
  maxRequests: number;
  keyPrefix?: string;
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(private readonly redis: RedisService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const userId = (req as any).user?.id || req.ip || "anonymous";
    const route = req.route?.path || req.path;
    const key = `ratelimit:${route}:${userId}`;

    this.checkLimit(key, { windowSeconds: 60, maxRequests: 30 }).then((allowed) => {
      if (!allowed) {
        logger.warn("Rate limit exceeded", { userId, route, ip: req.ip });
        throw new BadRequestException("Too many requests. Please try again later.");
      }
      next();
    });
  }

  async checkLimit(key: string, options: RateLimitOptions): Promise<boolean> {
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, options.windowSeconds);
    }
    return count <= options.maxRequests;
  }
}
