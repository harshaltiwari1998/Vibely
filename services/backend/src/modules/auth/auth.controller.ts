import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from "./dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post("refresh")
  refresh(@Body() dto: RefreshTokenDto) {
    return this.auth.refresh(dto);
  }

  @Post("logout")
  logout(@Req() _req: unknown, @CurrentUser() user: { id: string }) {
    return this.auth.logout(user.id);
  }

  @Post("forgot-password")
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  @Post("reset-password")
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  @Post("change-password")
  @UseGuards(JwtAuthGuard)
  changePassword(@CurrentUser() user: { id: string }, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(user.id, dto);
  }

  @Post("verify-email")
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto);
  }

  @Get("sessions")
  @UseGuards(JwtAuthGuard)
  sessions(@CurrentUser() user: { id: string }) {
    return this.auth.sessions(user.id);
  }

  @Delete("sessions/:id")
  @UseGuards(JwtAuthGuard)
  revokeSession(@CurrentUser() user: { id: string }, @Param("id") id: string) {
    return this.auth.revokeSession(user.id, id);
  }
}
