import { forwardRef, Module } from "@nestjs/common";
import { WalletController } from "./wallet.controller";
import { WalletService } from "./wallet.service";
import { RealtimeModule } from "../../realtime/realtime.module";

@Module({
  imports: [forwardRef(() => RealtimeModule)],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
