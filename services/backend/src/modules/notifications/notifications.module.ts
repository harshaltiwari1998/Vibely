import { forwardRef, Module } from "@nestjs/common";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { RealtimeModule } from "../../realtime/realtime.module";
import { DevicesModule } from "../devices/devices.module";
import { PushModule } from "../push/push.module";

@Module({
  imports: [forwardRef(() => RealtimeModule), DevicesModule, PushModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
