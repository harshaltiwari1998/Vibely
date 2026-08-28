import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ChatService } from "./chat.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("chat")
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.chat.listChats(user.id);
  }

  @Get(":chatId/messages")
  messages(@Param("chatId") chatId: string, @CurrentUser() user: { id: string }) {
    return this.chat.getMessages(chatId, user.id);
  }

  @Post("message")
  send(@CurrentUser() user: { id: string }, @Body() body: { chatId: string; content: string }) {
    return this.chat.sendMessage(user.id, body);
  }

  @Post(":messageId/delivered")
  delivered(@CurrentUser() user: { id: string }, @Param("messageId") messageId: string) {
    return this.chat.markDelivered(messageId, user.id);
  }

  @Post(":messageId/read")
  read(@CurrentUser() user: { id: string }, @Param("messageId") messageId: string) {
    return this.chat.markRead(messageId, user.id);
  }

  @Post("block")
  block(@CurrentUser() user: { id: string }, @Body() body: { userId: string }) {
    return this.chat.blockUser(user.id, body.userId);
  }

  @Post("unblock")
  unblock(@CurrentUser() user: { id: string }, @Body() body: { userId: string }) {
    return this.chat.unblockUser(user.id, body.userId);
  }

  @Post("report-message")
  reportMessage(@CurrentUser() user: { id: string }, @Body() body: { messageId: string; reason: string }) {
    return this.chat.reportMessage(body.messageId, user.id, body.reason);
  }

  @Post("report-user")
  reportUser(@CurrentUser() user: { id: string }, @Body() body: { userId: string; reason: string }) {
    return this.chat.reportUser(user.id, body.userId, body.reason);
  }
}
