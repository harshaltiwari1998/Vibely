import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { LevelsService } from "./levels.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("levels")
export class LevelsController {
  constructor(private readonly levels: LevelsService) {}

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: { id: string }) {
    return this.levels.getStatus(user.id);
  }

  @Get("leaderboard")
  leaderboard(@Query("limit") limit?: string) {
    return this.levels.getLeaderboard(limit ? parseInt(limit, 10) : undefined);
  }
}
