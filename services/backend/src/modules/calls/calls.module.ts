import { forwardRef, Module } from "@nestjs/common";
import { CallsController } from "./calls.controller";
import { CallsService } from "./calls.service";
import { RealtimeModule } from "../../realtime/realtime.module";

@Module({
  imports: [forwardRef(() => RealtimeModule)],
  controllers: [CallsController],
  providers: [CallsService],
  exports: [CallsService],
})
export class CallsModule {}
