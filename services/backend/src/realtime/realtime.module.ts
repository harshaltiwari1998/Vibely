import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PresenceService } from "./presence.service";
import { RealtimeGateway } from "./realtime.gateway";
import { SignalingGateway } from "./signaling.gateway";
import { MatchingService } from "../modules/matching/matching.service";
import { CallsService } from "../modules/calls/calls.service";
import { ChatService } from "../modules/chat/chat.service";
import { GiftsService } from "../modules/gifts/gifts.service";

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("app.jwtSecret"),
      }),
    }),
  ],
  providers: [PresenceService, RealtimeGateway, SignalingGateway, MatchingService, CallsService, ChatService, GiftsService],
  exports: [PresenceService],
})
export class RealtimeModule {}