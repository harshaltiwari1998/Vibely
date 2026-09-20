import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UpdatePreferencesDto, UpdateProfileDto, UpdateAvatarDto, UpdateMeDto } from "./dto";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get("me")
  me(@CurrentUser() user: { id: string }) {
    return this.users.findById(user.id);
  }

  @Get()
  list(@Query("page") page?: string, @Query("limit") limit?: string) {
    return this.users.list({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get("search")
  search(
    @CurrentUser() user: { id: string },
    @Query("q") q?: string,
    @Query("gender") gender?: string,
    @Query("country") country?: string,
    @Query("onlineOnly") onlineOnly?: string,
    @Query("ageMin") ageMin?: string,
    @Query("ageMax") ageMax?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.users.search(user.id, {
      q,
      gender,
      country,
      onlineOnly: onlineOnly === "true",
      ageMin: ageMin ? parseInt(ageMin, 10) : undefined,
      ageMax: ageMax ? parseInt(ageMax, 10) : undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.users.findPublic(id);
  }

  @Post("me/profile")
  updateProfile(@CurrentUser() user: { id: string }, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto);
  }

  @Post("me/preferences")
  updatePreferences(@CurrentUser() user: { id: string }, @Body() dto: UpdatePreferencesDto) {
    return this.users.updatePreferences(user.id, dto);
  }

  @Post("me/avatar")
  updateAvatar(@CurrentUser() user: { id: string }, @Body() dto: UpdateAvatarDto) {
    return this.users.updateAvatar(user.id, dto.avatarUrl);
  }

  @Post("me")
  updateMe(@CurrentUser() user: { id: string }, @Body() dto: UpdateMeDto) {
    return this.users.updateMe(user.id, dto);
  }

  @Get("me/sessions")
  getSessions(@CurrentUser() user: { id: string }) {
    return this.users.sessions(user.id);
  }

  @Delete("me/sessions/:id")
  revokeSession(@CurrentUser() user: { id: string }, @Param("id") id: string) {
    return this.users.revokeSession(user.id, id);
  }
}
