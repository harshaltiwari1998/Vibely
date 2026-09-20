import { Controller, Get, UseGuards } from "@nestjs/common";
import { ReferralsService } from "./referrals.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("referrals")
@UseGuards(JwtAuthGuard)
export class ReferralsController {
  constructor(private readonly referrals: ReferralsService) {}

  @Get("me")
  me(@CurrentUser() user: { id: string }) {
    return this.referrals.getMyReferralInfo(user.id);
  }
}
