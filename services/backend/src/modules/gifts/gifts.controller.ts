import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { GiftsService } from "./gifts.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("gifts")
@UseGuards(JwtAuthGuard)
export class GiftsController {
  constructor(private readonly gifts: GiftsService) {}

  @Get()
  list() {
    return this.gifts.listGifts();
  }

  @Get("history")
  history(@CurrentUser() user: { id: string }) {
    return this.gifts.getGiftHistory(user.id);
  }

  @Post("send")
  send(@CurrentUser() user: { id: string }, @Body() body: { receiverId: string; giftId: string }) {
    return this.gifts.sendGift(user.id, body);
  }

  @Post("admin")
  create(@Body() body: { name: string; iconUrl: string; coinCost: number }) {
    return this.gifts.createGift(body);
  }

  @Patch("admin/:id")
  update(@Param("id") giftId: string, @Body() body: { name?: string; iconUrl?: string; coinCost?: number; active?: boolean }) {
    return this.gifts.updateGift(giftId, body);
  }

  @Delete("admin/:id")
  remove(@Param("id") giftId: string) {
    return this.gifts.deleteGift(giftId);
  }
}
