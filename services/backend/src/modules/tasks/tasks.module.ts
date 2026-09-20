import { Module } from "@nestjs/common";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";
import { WalletModule } from "../wallet/wallet.module";
import { LevelsModule } from "../levels/levels.module";

@Module({
  imports: [WalletModule, LevelsModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
