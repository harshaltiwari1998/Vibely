import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { createLogger } from "@vibely/shared";

const logger = createLogger("Bootstrap");

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.enableCors({ origin: true, credentials: true });

  const configService = app.get(ConfigService);
  const port = configService.get<number>("app.port") ?? 4000;
  const corsOrigin = configService.get<string>("app.corsOrigin") || "*";

  app.enableCors({
    origin: corsOrigin === "*" ? true : corsOrigin.split(",").map((s) => s.trim()),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
  });

  await app.listen(port);
  logger.info(`Vibely backend listening on port ${port}`, { port });
}

bootstrap().catch((error) => {
  logger.error("Failed to start backend", {
    error: error instanceof Error ? error.message : "unknown",
  });
  process.exit(1);
});
