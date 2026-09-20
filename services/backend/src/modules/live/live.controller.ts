import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { LiveService } from "./live.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { StartLiveDto } from "@vibely/types";

@Controller("live")
@UseGuards(JwtAuthGuard)
export class LiveController {
  constructor(private readonly live: LiveService) {}

  @Post("start")
  start(@CurrentUser() user: { id: string }, @Body() body: StartLiveDto) {
    return this.live.startLive(user.id, body);
  }

  @Post(":id/end")
  end(@CurrentUser() user: { id: string }, @Param("id") roomId: string) {
    return this.live.endLive(roomId, user.id);
  }

  @Get()
  list(@Query("country") country?: string) {
    return this.live.listActive(country);
  }

  @Get(":id/join")
  join(@CurrentUser() user: { id: string }, @Param("id") roomId: string) {
    return this.live.getRoomForViewer(roomId, user.id);
  }
}
