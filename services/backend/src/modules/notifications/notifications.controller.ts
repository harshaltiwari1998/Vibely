import { Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.notifications.list(user.id);
  }

  @Post(":id/read")
  read(@CurrentUser() user: { id: string }, @Param("id") id: string) {
    return this.notifications.markRead(user.id, id);
  }

  @Post("read-all")
  readAll(@CurrentUser() user: { id: string }) {
    return this.notifications.markAllRead(user.id);
  }

  @Post(":id/delete")
  delete(@CurrentUser() user: { id: string }, @Param("id") id: string) {
    return this.notifications.delete(user.id, id);
  }
}
