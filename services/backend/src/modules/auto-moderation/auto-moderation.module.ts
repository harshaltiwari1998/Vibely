import { Module } from "@nestjs/common";
import { AutoModerationService } from "./auto-moderation.service";
import { FraudModule } from "../fraud/fraud.module";
import { ModerationModule } from "../moderation/moderation.module";

@Module({
  imports: [FraudModule, ModerationModule],
  providers: [AutoModerationService],
  exports: [AutoModerationService],
})
export class AutoModerationModule {}
