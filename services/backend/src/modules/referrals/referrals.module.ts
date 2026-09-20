import { Module } from "@nestjs/common";
import { ReferralsController } from "./referrals.controller";
import { ReferralsService } from "./referrals.service";
import { WalletModule } from "../wallet/wallet.module";
import { LevelsModule } from "../levels/levels.module";

@Module({
  imports: [WalletModule, LevelsModule],
  controllers: [ReferralsController],
  providers: [ReferralsService],
  exports: [ReferralsService],
})
export class ReferralsModule {}
