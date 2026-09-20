import { Module } from "@nestjs/common";
import { LiveController } from "./live.controller";
import { LiveService } from "./live.service";
import { LevelsModule } from "../levels/levels.module";

@Module({
  imports: [LevelsModule],
  controllers: [LiveController],
  providers: [LiveService],
  exports: [LiveService],
})
export class LiveModule {}
