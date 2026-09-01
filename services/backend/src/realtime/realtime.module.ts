import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PresenceService } from "./presence.service";
import { RealtimeGateway } from "./realtime.gateway";
import { SignalingGateway } from "./signaling.gateway";

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
  providers: [PresenceService, RealtimeGateway, SignalingGateway],
  exports: [PresenceService],
})
export class RealtimeModule {}