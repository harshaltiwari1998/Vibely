import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { CallsService } from "./calls.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("calls")
@UseGuards(JwtAuthGuard)
export class CallsController {
  constructor(private readonly calls: CallsService) {}

  @Post("initiate")
  initiate(@CurrentUser() user: { id: string }, @Body() body: { receiverId: string }) {
    return this.calls.initiate(user.id, body.receiverId);
  }

  @Post(":id/accept")
  accept(@CurrentUser() user: { id: string }, @Param("id") callId: string) {
    return this.calls.acceptCall(callId, user.id);
  }

  @Post(":id/reject")
  reject(@CurrentUser() user: { id: string }, @Param("id") callId: string) {
    return this.calls.rejectCall(callId, user.id);
  }

  @Post(":id/end")
  end(@CurrentUser() user: { id: string }, @Param("id") callId: string, @Body() body: { reason?: string }) {
    return this.calls.endCall(callId, user.id, body.reason);
  }

  @Get("history")
  history(@CurrentUser() user: { id: string }) {
    return this.calls.listHistory(user.id);
  }

  @Get(":id")
  get(@Param("id") callId: string) {
    return this.calls.getCall(callId);
  }
}
