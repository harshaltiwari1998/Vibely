import { Controller, Get, Header } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  @Header("Cache-Control", "no-store")
  health() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
    };
  }
}
