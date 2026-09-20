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
  // Numeric seconds, not a bare digit string: jsonwebtoken's `expiresIn` only
  // parses strings via the `ms` package, which requires a unit (e.g. "900s")
  // and silently no-ops on unitless digits, making tokens expire immediately.
  jwtExpiresIn: parseInt(process.env.JWT_EXPIRES_IN || "900", 10),
  jwtRefreshExpiresIn: parseInt(process.env.JWT_REFRESH_EXPIRES_IN || "604800", 10),
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  turn: {
    url: process.env.TURN_SERVER_URL || "",
    username: process.env.TURN_USERNAME || "",
    password: process.env.TURN_PASSWORD || "",
  },
  liveKit: {
    url: process.env.LIVEKIT_URL || "ws://localhost:7880",
    apiKey: process.env.LIVEKIT_API_KEY || "devkey",
    apiSecret: process.env.LIVEKIT_API_SECRET || "change-me-livekit-secret",
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
