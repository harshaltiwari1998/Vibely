import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { MallService } from "./mall.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("mall")
export class MallController {
  constructor(private readonly mall: MallService) {}

  @Get("items")
  items() {
    return this.mall.getItems();
  }

  @Get("inventory")
  @UseGuards(JwtAuthGuard)
  inventory(@CurrentUser() user: { id: string }) {
    return this.mall.getInventory(user.id);
  }

  @Post("purchase")
  @UseGuards(JwtAuthGuard)
  purchase(@CurrentUser() user: { id: string }, @Body() body: { itemId: string }) {
    return this.mall.purchase(user.id, body.itemId);
  }

  @Post("equip")
  @UseGuards(JwtAuthGuard)
  equip(@CurrentUser() user: { id: string }, @Body() body: { itemId: string }) {
    return this.mall.equip(user.id, body.itemId);
  }

  @Post("unequip")
  @UseGuards(JwtAuthGuard)
  unequip(@CurrentUser() user: { id: string }, @Body() body: { itemId: string }) {
    return this.mall.unequip(user.id, body.itemId);
  }
}
