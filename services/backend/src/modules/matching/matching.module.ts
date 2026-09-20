import { forwardRef, Module } from "@nestjs/common";
import { MatchingController } from "./matching.controller";
import { MatchingService } from "./matching.service";
import { RealtimeModule } from "../../realtime/realtime.module";
import { CallsModule } from "../calls/calls.module";
import { WalletModule } from "../wallet/wallet.module";

@Module({
  imports: [forwardRef(() => RealtimeModule), CallsModule, WalletModule],
  controllers: [MatchingController],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
