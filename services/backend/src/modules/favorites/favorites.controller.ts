import { Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { FavoritesService } from "./favorites.service";

@Controller("favorites")
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Post(":userId")
  favorite(@CurrentUser() user: { id: string }, @Param("userId") targetUserId: string) {
    return this.favorites.favorite(user.id, targetUserId);
  }

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.favorites.list(user.id);
  }
}
