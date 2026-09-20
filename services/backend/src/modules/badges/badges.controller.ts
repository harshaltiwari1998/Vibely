import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { BadgesService } from "./badges.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("badges")
@UseGuards(JwtAuthGuard)
export class BadgesController {
  constructor(private readonly badges: BadgesService) {}

  @Get("me")
  me(@CurrentUser() user: { id: string }) {
    return this.badges.getMyBadges(user.id);
  }

  @Post("featured")
  setFeatured(@CurrentUser() user: { id: string }, @Body() body: { badgeId: string | null }) {
    return this.badges.setFeaturedBadge(user.id, body.badgeId);
  }
}
