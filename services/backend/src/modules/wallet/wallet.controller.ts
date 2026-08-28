import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { WalletService } from "./wallet.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
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

  @Post("coins")
  add(@CurrentUser() user: { id: string }, @Body() body: { amount: number }) {
    return this.wallet.addCoins(user.id, body.amount, "PURCHASE");
  }

  @Post("admin/adjust")
  adminAdjust(@CurrentUser() user: { id: string }, @Body() body: { userId: string; amount: number; reason: string }) {
    return this.wallet.adminAdjust(body.userId, body.amount, body.reason);
  }
}
