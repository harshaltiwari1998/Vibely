import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { WalletModule } from "../wallet/wallet.module";
import { RealtimeModule } from "../../realtime/realtime.module";
import { AutoModerationModule } from "../auto-moderation/auto-moderation.module";

@Module({
  imports: [WalletModule, RealtimeModule, AutoModerationModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
