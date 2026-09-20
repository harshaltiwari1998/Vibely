import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { WithdrawalsService } from "./withdrawals.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/constants/roles";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequestWithdrawalDto } from "@vibely/types";

@Controller("withdrawals")
@UseGuards(JwtAuthGuard)
export class WithdrawalsController {
  constructor(private readonly withdrawals: WithdrawalsService) {}

  @Post()
  request(@CurrentUser() user: { id: string }, @Body() body: RequestWithdrawalDto) {
    return this.withdrawals.requestWithdrawal(user.id, body);
  }

  @Get("mine")
  mine(@CurrentUser() user: { id: string }) {
    return this.withdrawals.listMine(user.id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  adminList(@Query("status") status?: string) {
    return this.withdrawals.adminList(status);
  }

  @Post(":id/review")
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  review(
    @CurrentUser() admin: { id: string },
    @Param("id") id: string,
    @Body() body: { action: "APPROVE" | "REJECT" | "MARK_PAID"; note?: string },
  ) {
    return this.withdrawals.review(id, admin.id, body.action, body.note);
  }
}
