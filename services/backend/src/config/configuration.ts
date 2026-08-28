import { registerAs } from "@nestjs/config";

/** Centralised configuration loaded from environment variables. */
export default registerAs("app", () => ({
  name: process.env.APP_NAME || "Vibely",
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.API_PORT || "4000", 10),
  webUrl: process.env.WEB_URL || "http://localhost:5173",
  adminUrl: process.env.ADMIN_URL || "http://localhost:5174",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  jwtSecret: process.env.JWT_SECRET || "change-me-access-secret",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "change-me-refresh-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "900",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "604800",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  turn: {
    url: process.env.TURN_SERVER_URL || "",
    username: process.env.TURN_USERNAME || "",
    password: process.env.TURN_PASSWORD || "",
  },
  storage: {
    endpoint: process.env.STORAGE_ENDPOINT || "",
    accessKey: process.env.STORAGE_ACCESS_KEY || "",
    secretKey: process.env.STORAGE_SECRET_KEY || "",
    bucket: process.env.STORAGE_BUCKET || "",
  },
  payment: {
    provider: process.env.PAYMENT_PROVIDER || "",
    publicKey: process.env.PAYMENT_PUBLIC_KEY || "",
    secretKey: process.env.PAYMENT_SECRET_KEY || "",
  },
  pushKey: process.env.PUSH_NOTIFICATION_KEY || "",
}));
