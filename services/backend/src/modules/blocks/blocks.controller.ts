import { Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { BlocksService } from "./blocks.service";

@Controller("blocks")
@UseGuards(JwtAuthGuard)
export class BlocksController {
  constructor(private readonly blocks: BlocksService) {}

  @Post(":userId")
  block(@CurrentUser() user: { id: string }, @Param("userId") blockedId: string) {
    return this.blocks.block(user.id, blockedId);
  }

  @Delete(":userId")
  unblock(@CurrentUser() user: { id: string }, @Param("userId") blockedId: string) {
    return this.blocks.unblock(user.id, blockedId);
  }

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.blocks.list(user.id);
  }
}
