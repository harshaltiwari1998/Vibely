import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { MatchingService } from "./matching.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("matching")
@UseGuards(JwtAuthGuard)
export class MatchingController {
  constructor(private readonly matching: MatchingService) {}

  @Post("start")
  start(@CurrentUser() user: { id: string }, @Body() dto: { preferredGender?: string; preferredAgeMin?: number; preferredAgeMax?: number }) {
    return this.matching.requestMatch(user.id, dto);
  }

  @Post("cancel")
  cancel(@CurrentUser() user: { id: string }) {
    return this.matching.cancelMatch(user.id);
  }

  @Post("accept")
  accept(@CurrentUser() user: { id: string }, @Body() body: { matchId: string }) {
    return this.matching.acceptMatch(user.id, body.matchId);
  }

  @Post("decline")
  decline(@CurrentUser() user: { id: string }, @Body() body: { matchId: string }) {
    return this.matching.declineMatch(user.id, body.matchId);
  }

  @Post("skip")
  skip(@CurrentUser() user: { id: string }, @Body() body: { matchId: string }) {
    return this.matching.skipMatch(user.id, body.matchId);
  }
}
