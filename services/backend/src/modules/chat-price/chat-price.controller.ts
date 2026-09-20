import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ChatPriceService } from "./chat-price.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("chat-price")
@UseGuards(JwtAuthGuard)
export class ChatPriceController {
  constructor(private readonly chatPrice: ChatPriceService) {}

  @Get("me")
  me(@CurrentUser() user: { id: string }) {
    return this.chatPrice.getStatus(user.id);
  }

  @Post()
  setPrice(@CurrentUser() user: { id: string }, @Body() body: { pricePerMinute: number }) {
    return this.chatPrice.setPrice(user.id, body.pricePerMinute);
  }
}
