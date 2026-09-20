import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from "@nestjs/common";
import { PartyService } from "./party.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { StartPartyDto } from "@vibely/types";

@Controller("party")
@UseGuards(JwtAuthGuard)
export class PartyController {
  constructor(private readonly party: PartyService) {}

  @Post("start")
  start(@CurrentUser() user: { id: string }, @Body() body: StartPartyDto) {
    return this.party.startParty(user.id, body);
  }

  @Post(":id/end")
  end(@CurrentUser() user: { id: string }, @Param("id") roomId: string) {
    return this.party.endParty(roomId, user.id);
  }

  @Get()
  list(@Query("country") country?: string) {
    return this.party.listActive(country);
  }

  @Get(":id/join")
  join(@CurrentUser() user: { id: string }, @Param("id") roomId: string) {
    return this.party.joinRoom(roomId, user.id);
  }

  @Post(":id/leave")
  leave(@CurrentUser() user: { id: string }, @Param("id") roomId: string) {
    return this.party.leaveRoom(roomId, user.id);
  }

  @Post(":id/seats/:seatIndex/take")
  takeSeat(
    @CurrentUser() user: { id: string },
    @Param("id") roomId: string,
    @Param("seatIndex", ParseIntPipe) seatIndex: number,
  ) {
    return this.party.takeSeat(roomId, user.id, seatIndex);
  }

  @Post(":id/seats/leave")
  leaveSeat(@CurrentUser() user: { id: string }, @Param("id") roomId: string) {
    return this.party.leaveSeat(roomId, user.id);
  }
}
