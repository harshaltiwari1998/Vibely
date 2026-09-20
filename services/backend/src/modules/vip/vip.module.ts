import { Module } from "@nestjs/common";
import { VipController } from "./vip.controller";
import { VipService } from "./vip.service";
import { WalletModule } from "../wallet/wallet.module";

@Module({
  imports: [WalletModule],
  controllers: [VipController],
  providers: [VipService],
  exports: [VipService],
})
export class VipModule {}
