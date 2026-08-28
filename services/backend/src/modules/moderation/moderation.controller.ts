import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ModerationService } from "./moderation.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/constants/roles";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ModerationActionDto } from "@vibely/types";

@Controller("moderation")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Moderator, Role.Admin, Role.SuperAdmin)
export class ModerationController {
  constructor(private readonly moderation: ModerationService) {}

  @Post("ban")
  ban(
    @CurrentUser() user: { id: string },
    @Body() body: { targetUserId: string; reason: string; note?: string },
  ) {
    return this.moderation.banUser(user.id, body.targetUserId, body.reason, body.note);
  }

  @Post("suspend")
  suspend(
    @CurrentUser() user: { id: string },
    @Body() body: { targetUserId: string; reason: string; durationDays?: number; note?: string },
  ) {
    return this.moderation.suspendUser(user.id, body.targetUserId, body.reason, body.durationDays, body.note);
  }

  @Post("restrict")
  restrict(
    @CurrentUser() user: { id: string },
    @Body() body: { targetUserId: string; reason: string; note?: string },
  ) {
    return this.moderation.restrictUser(user.id, body.targetUserId, body.reason, body.note);
  }

  @Post("unban")
  unban(
    @CurrentUser() user: { id: string },
    @Body() body: { targetUserId: string; note?: string },
  ) {
    return this.moderation.unbanUser(user.id, body.targetUserId, body.note);
  }

  @Get("actions")
  actions(@Query("page") page?: string, @Query("limit") limit?: string, @Query("moderatorId") moderatorId?: string, @Query("targetUserId") targetUserId?: string) {
    return this.moderation.listActions({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      moderatorId,
      targetUserId,
    });
  }

  @Post("text")
  moderateText(@Body() body: { text: string }) {
    return this.moderation.moderateText(body.text);
  }

  @Get("user/:userId/status")
  userStatus(@Param("userId") userId: string) {
    return this.moderation.checkUserStatus(userId);
  }
}
