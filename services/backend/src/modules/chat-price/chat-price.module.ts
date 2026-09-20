import { Module } from "@nestjs/common";
import { ChatPriceController } from "./chat-price.controller";
import { ChatPriceService } from "./chat-price.service";
import { WalletModule } from "../wallet/wallet.module";

@Module({
  imports: [WalletModule],
  controllers: [ChatPriceController],
  providers: [ChatPriceService],
})
export class ChatPriceModule {}
