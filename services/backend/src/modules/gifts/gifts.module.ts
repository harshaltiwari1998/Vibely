import { forwardRef, Module } from "@nestjs/common";
import { GiftsController } from "./gifts.controller";
import { GiftsService } from "./gifts.service";
import { RealtimeModule } from "../../realtime/realtime.module";
import { WalletModule } from "../wallet/wallet.module";
import { VipModule } from "../vip/vip.module";
import { LevelsModule } from "../levels/levels.module";

@Module({
  imports: [forwardRef(() => RealtimeModule), WalletModule, VipModule, LevelsModule],
  controllers: [GiftsController],
  providers: [GiftsService],
  exports: [GiftsService],
})
export class GiftsModule {}
