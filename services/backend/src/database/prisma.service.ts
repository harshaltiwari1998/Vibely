import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { createLogger } from "@vibely/shared";

const logger = createLogger("PrismaService");

/**
 * Thin wrapper around the Prisma client.
 * Connection is attempted on bootstrap but failures are logged rather than
 * thrown, so the application can still start in degraded mode (e.g. local
 * without a database) and recover once the database is reachable.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      logger.info("Database connection established");
    } catch (error) {
      logger.error("Database connection failed", {
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
