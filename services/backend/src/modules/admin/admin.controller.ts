import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/constants/roles";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin, Role.SuperAdmin)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get("dashboard")
  dashboard() {
    return this.admin.getStats();
  }

  @Get("stats")
  stats() {
    return this.admin.getStats();
  }

  @Get("users")
  users(@Query("search") search?: string, @Query("page") page?: string, @Query("limit") limit?: string, @Query("status") status?: string) {
    return this.admin.listUsers({
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
    });
  }

  @Get("users/:id")
  getUser(@Param("id") id: string) {
    return this.admin.getUser(id);
  }

  @Post("users/:id/status")
  updateUserStatus(@Param("id") id: string, @Body() body: { status: string; reason?: string }) {
    return this.admin.updateUserStatus("admin", id, body.status as any, body.reason);
  }

  @Get("reports")
  reports(@Query("page") page?: string, @Query("limit") limit?: string, @Query("status") status?: string) {
    return this.admin.listReports({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get("calls")
  calls(@Query("page") page?: string, @Query("limit") limit?: string) {
    return this.admin.listCalls({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get("messages")
  messages(@Query("page") page?: string, @Query("limit") limit?: string) {
    return this.admin.listMessages({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get("transactions")
  transactions(@Query("page") page?: string, @Query("limit") limit?: string) {
    return this.admin.listTransactions({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get("gifts")
  gifts() {
    return this.admin.listGifts();
  }

  @Get("moderation/actions")
  moderationActions(@Query("page") page?: string, @Query("limit") limit?: string) {
    return this.admin.listModerationActions({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get("fraud/:userId")
  fraudAnalysis(@Param("userId") userId: string) {
    return this.admin.detectSuspiciousActivity(userId);
  }

  @Get("settings")
  settings() {
    return this.admin.getSettings();
  }

  @Post("settings")
  updateSettings(@Body() settings: Record<string, any>) {
    return this.admin.updateSettings("admin", settings);
  }
}
