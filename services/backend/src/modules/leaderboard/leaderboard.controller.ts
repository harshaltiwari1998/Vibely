import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { LeaderboardService, LeaderboardPeriod, LeaderboardType } from "./leaderboard.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("leaderboard")
@UseGuards(JwtAuthGuard)
export class LeaderboardController {
  constructor(private readonly leaderboard: LeaderboardService) {}

  @Get()
  get(@Query("type") type?: string, @Query("period") period?: string) {
    const resolvedType: LeaderboardType = type === "receivers" ? "receivers" : "senders";
    const resolvedPeriod: LeaderboardPeriod = period === "daily" || period === "weekly" ? period : "all";
    return this.leaderboard.getLeaderboard(resolvedType, resolvedPeriod);
  }
}
