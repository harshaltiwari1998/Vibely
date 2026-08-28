import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ReportsService } from "./reports.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { CreateReportDto, UpdateReportDto } from "@vibely/types";

@Controller("reports")
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateReportDto) {
    return this.reports.create(user.id, dto);
  }

  @Post("block")
  @UseGuards(JwtAuthGuard)
  block(@CurrentUser() user: { id: string }, @Body() body: { blockedId: string; expiresAt?: string }) {
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined;
    return this.reports.blockUser(user.id, body.blockedId, expiresAt);
  }

  @Post("unblock")
  @UseGuards(JwtAuthGuard)
  unblock(@CurrentUser() user: { id: string }, @Body() body: { blockedId: string }) {
    return this.reports.unblockUser(user.id, body.blockedId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@Query("status") status?: string, @Query("page") page?: string, @Query("limit") limit?: string, @Query("assignedToId") assignedToId?: string) {
    return this.reports.list({
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      assignedToId,
    });
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  getOne(@Param("id") id: string) {
    return this.reports.getReport(id);
  }

  @Post(":id/assign")
  @UseGuards(JwtAuthGuard)
  assign(@CurrentUser() user: { id: string }, @Param("id") id: string, @Body() body: { assignedToId?: string }) {
    return this.reports.updateReport(id, { assignedToId: body.assignedToId || user.id }, user.id);
  }

  @Post(":id/update")
  @UseGuards(JwtAuthGuard)
  update(@Param("id") id: string, @Body() dto: UpdateReportDto) {
    return this.reports.updateReport(id, dto, "system");
  }

  @Get("blocks")
  @UseGuards(JwtAuthGuard)
  blocks(@CurrentUser() user: { id: string }) {
    return this.reports.listBlocks(user.id);
  }

  @Get("blocked-by")
  @UseGuards(JwtAuthGuard)
  blockedBy(@CurrentUser() user: { id: string }) {
    return this.reports.listBlockedBy(user.id);
  }
}
