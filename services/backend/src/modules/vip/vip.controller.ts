import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { VipService } from "./vip.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { VipLevel } from "@prisma/client";

@Controller("vip")
export class VipController {
  constructor(private readonly vip: VipService) {}

  @Get("tiers")
  tiers() {
    return this.vip.getTiers();
  }

  @Get("status")
  @UseGuards(JwtAuthGuard)
  status(@CurrentUser() user: { id: string }) {
    return this.vip.getStatus(user.id);
  }

  @Post("purchase")
  @UseGuards(JwtAuthGuard)
  purchase(@CurrentUser() user: { id: string }, @Body() body: { level: VipLevel }) {
    return this.vip.purchase(user.id, body.level);
  }
}
