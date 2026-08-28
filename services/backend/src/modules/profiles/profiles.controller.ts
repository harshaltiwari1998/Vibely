import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ProfilesService } from "./profiles.service";

@Controller("profiles")
@UseGuards(JwtAuthGuard)
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  @Get("discover")
  discover(
    @CurrentUser() user: { id: string },
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("country") country?: string,
    @Query("language") language?: string,
    @Query("gender") gender?: string,
    @Query("online") online?: string,
    @Query("minAge") minAge?: string,
    @Query("maxAge") maxAge?: string,
  ) {
    return this.profiles.discover({
      currentUserId: user.id,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      country,
      language,
      gender,
      online: online === "true" ? true : online === "false" ? false : undefined,
      minAge: minAge ? parseInt(minAge, 10) : undefined,
      maxAge: maxAge ? parseInt(maxAge, 10) : undefined,
    });
  }

  @Post("online")
  setOnline(@CurrentUser() user: { id: string }, @Body() body: { status: string }) {
    return this.profiles.setOnlineStatus(user.id, body.status);
  }
}
