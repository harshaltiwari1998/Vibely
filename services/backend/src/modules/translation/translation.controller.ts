import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { TranslationService } from "./translation.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("translation")
@UseGuards(JwtAuthGuard)
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  @Post("translate")
  translate(@CurrentUser() _user: { id: string }, @Body() body: { text: string; targetLanguage: string; sourceLanguage?: string }) {
    return this.translationService.translateText(body.text, body.targetLanguage, body.sourceLanguage);
  }

  @Post("detect")
  detect(@CurrentUser() _user: { id: string }, @Body() body: { text: string }) {
    return this.translationService.detectLanguage(body.text);
  }

  @Get("languages")
  languages() {
    return { languages: this.translationService.getSupportedLanguages() };
  }
}
