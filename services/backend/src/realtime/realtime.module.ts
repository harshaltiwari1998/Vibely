import { forwardRef, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PresenceService } from "./presence.service";
import { RealtimeGateway } from "./realtime.gateway";
import { SignalingGateway } from "./signaling.gateway";
import { LiveGateway } from "./live.gateway";
import { PartyGateway } from "./party.gateway";
import { MatchingModule } from "../modules/matching/matching.module";
import { CallsModule } from "../modules/calls/calls.module";
import { ChatModule } from "../modules/chat/chat.module";
import { GiftsModule } from "../modules/gifts/gifts.module";
import { NotificationsModule } from "../modules/notifications/notifications.module";
import { LiveModule } from "../modules/live/live.module";
import { PartyModule } from "../modules/party/party.module";

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("app.jwtSecret"),
      }),
    }),
    forwardRef(() => MatchingModule),
    forwardRef(() => CallsModule),
    forwardRef(() => ChatModule),
    forwardRef(() => GiftsModule),
    forwardRef(() => NotificationsModule),
    LiveModule,
    PartyModule,
  ],
  providers: [PresenceService, RealtimeGateway, SignalingGateway, LiveGateway, PartyGateway],
  exports: [PresenceService, RealtimeGateway],
})
export class RealtimeModule {}
