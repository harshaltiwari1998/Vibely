import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { TasksService } from "./tasks.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { TaskType } from "@prisma/client";

@Controller("tasks")
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.tasks.getTasks(user.id);
  }

  @Post("claim")
  claim(@CurrentUser() user: { id: string }, @Body() body: { type: TaskType }) {
    return this.tasks.claim(user.id, body.type);
  }
}
