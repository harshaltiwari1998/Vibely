import { Module } from "@nestjs/common";
import { MallController } from "./mall.controller";
import { MallService } from "./mall.service";
import { WalletModule } from "../wallet/wallet.module";

@Module({
  imports: [WalletModule],
  controllers: [MallController],
  providers: [MallService],
})
export class MallModule {}
