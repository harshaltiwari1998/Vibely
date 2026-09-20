import { Module } from "@nestjs/common";
import { PartyController } from "./party.controller";
import { PartyService } from "./party.service";
import { LevelsModule } from "../levels/levels.module";

@Module({
  imports: [LevelsModule],
  controllers: [PartyController],
  providers: [PartyService],
  exports: [PartyService],
})
export class PartyModule {}
