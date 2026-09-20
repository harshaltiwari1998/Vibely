import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { FamiliesService } from "./families.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("families")
@UseGuards(JwtAuthGuard)
export class FamiliesController {
  constructor(private readonly families: FamiliesService) {}

  @Get()
  list(@Query("search") search?: string) {
    return this.families.listFamilies(search);
  }

  @Get("me")
  mine(@CurrentUser() user: { id: string }) {
    return this.families.getMyFamily(user.id);
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() body: { name: string; bio?: string }) {
    return this.families.createFamily(user.id, body.name, body.bio);
  }

  @Post("leave")
  leave(@CurrentUser() user: { id: string }) {
    return this.families.leaveFamily(user.id);
  }

  @Delete("mine")
  disband(@CurrentUser() user: { id: string }) {
    return this.families.disbandFamily(user.id);
  }

  @Get(":id")
  detail(@Param("id") id: string) {
    return this.families.getFamily(id);
  }

  @Get(":id/leaderboard")
  leaderboard(@Param("id") id: string) {
    return this.families.getLeaderboard(id);
  }

  @Post(":id/join")
  join(@CurrentUser() user: { id: string }, @Param("id") id: string) {
    return this.families.joinFamily(user.id, id);
  }
}
