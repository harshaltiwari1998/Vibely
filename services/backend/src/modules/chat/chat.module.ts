import { forwardRef, Module } from "@nestjs/common";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { RealtimeModule } from "../../realtime/realtime.module";

@Module({
  imports: [forwardRef(() => RealtimeModule)],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
