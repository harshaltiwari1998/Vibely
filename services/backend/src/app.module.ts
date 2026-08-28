import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import configuration from "./config/configuration";
import { DatabaseModule } from "./database/database.module";
import { CacheModule } from "./cache/cache.module";
import { RealtimeModule } from "./realtime/realtime.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { ProfilesModule } from "./modules/profiles/profiles.module";
import { MatchingModule } from "./modules/matching/matching.module";
import { CallsModule } from "./modules/calls/calls.module";
import { ChatModule } from "./modules/chat/chat.module";
import { GiftsModule } from "./modules/gifts/gifts.module";
import { WalletModule } from "./modules/wallet/wallet.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { DevicesModule } from "./modules/devices/devices.module";
import { PushModule } from "./modules/push/push.module";
import { TranslationModule } from "./modules/translation/translation.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { ModerationModule } from "./modules/moderation/moderation.module";
import { AdminModule } from "./modules/admin/admin.module";
import { FraudModule } from "./modules/fraud/fraud.module";
import { HealthModule } from "./health/health.module";
import { FavoritesModule } from "./modules/favorites/favorites.module";
import { BlocksModule } from "./modules/blocks/blocks.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    DatabaseModule,
    CacheModule,
    RealtimeModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    MatchingModule,
    CallsModule,
    ChatModule,
    GiftsModule,
    WalletModule,
    PaymentsModule,
    NotificationsModule,
    DevicesModule,
    PushModule,
    TranslationModule,
    ReportsModule,
    ModerationModule,
    AdminModule,
    FraudModule,
    HealthModule,
    FavoritesModule,
    BlocksModule,
  ],
})
export class AppModule {}

