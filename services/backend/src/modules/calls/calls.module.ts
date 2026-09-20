import { forwardRef, Module } from "@nestjs/common";
import { CallsController } from "./calls.controller";
import { CallsService } from "./calls.service";
import { RealtimeModule } from "../../realtime/realtime.module";
import { LevelsModule } from "../levels/levels.module";
import { WalletModule } from "../wallet/wallet.module";

@Module({
  imports: [forwardRef(() => RealtimeModule), LevelsModule, WalletModule],
  controllers: [CallsController],
  providers: [CallsService],
  exports: [CallsService],
})
export class CallsModule {}
