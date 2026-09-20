import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { WalletModule } from "../wallet/wallet.module";
import { RealtimeModule } from "../../realtime/realtime.module";

@Module({
  imports: [WalletModule, RealtimeModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
