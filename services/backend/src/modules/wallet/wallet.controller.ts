import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { WalletService } from "./wallet.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/constants/roles";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("wallet")
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Get()
  balance(@CurrentUser() user: { id: string }) {
    return this.wallet.getBalance(user.id);
  }

  @Get("transactions")
  transactions(@CurrentUser() user: { id: string }) {
    return this.wallet.getTransactions(user.id);
  }

  // Diamonds are credited by the payments module once a real Razorpay charge
  // is verified (see PaymentsService.verifyPayment/handleWebhook) — there is
  // intentionally no client-facing "just add coins" endpoint anymore.

  @Post("admin/adjust")
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  adminAdjust(@Body() body: { userId: string; amount: number; reason: string }) {
    return this.wallet.adminAdjust(body.userId, body.amount, body.reason);
  }
}
