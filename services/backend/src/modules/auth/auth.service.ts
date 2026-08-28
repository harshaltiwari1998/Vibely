import { Injectable, ConflictException, BadRequestException, ForbiddenException, UnauthorizedException, NotFoundException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../database/prisma.service";
import { RedisService } from "../../cache/redis.service";
import * as bcrypt from "bcryptjs";
import { Role } from "../../common/constants/roles";
import { createLogger, SECURITY, ageFromDateOfBirth, isValidPassword } from "@vibely/shared";
import {
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  ResetPasswordDto,
  ChangePasswordDto,
  VerifyEmailDto,
} from "./dto";

const logger = createLogger("AuthService");

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ username: dto.username }, { email: dto.email }] },
    });
    if (existing) {
      if (existing.username === dto.username) throw new ConflictException("Username already taken");
      if (existing.email === dto.email) throw new ConflictException("Email already registered");
    }

    const age = ageFromDateOfBirth(dto.dateOfBirth);
    if (age < SECURITY.MIN_AGE_YEARS) {
      throw new BadRequestException(`You must be at least ${SECURITY.MIN_AGE_YEARS} years old`);
    }
    if (age > SECURITY.MAX_AGE_YEARS) {
      throw new BadRequestException("Invalid date of birth");
    }

    if (!isValidPassword(dto.password)) {
      throw new BadRequestException("Password does not meet policy requirements");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const verificationToken = this.generateToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        passwordHash,
        dateOfBirth: new Date(dto.dateOfBirth),
        gender: dto.gender,
        country: dto.country,
        language: dto.language,
        status: "PENDING",
        verificationToken,
        verificationExpires,
        profile: { create: { bio: "", interests: [] } },
        preferences: {
          create: {
            preferredAgeMin: SECURITY.MIN_AGE_YEARS,
            preferredAgeMax: 99,
            preferredCountries: [],
            preferredLanguages: [],
          },
        },
      },
    });

    await this.redis.set(`verify:${verificationToken}`, user.id, 86400);

    const tokens = this.issueTokens(user.id, user.email, Role.User);
    await this.createSession(user.id, tokens.refreshToken);

    logger.info("User registered", { userId: user.id });
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id: user.id, username: user.username, email: user.email, status: user.status },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.identifier }, { username: dto.identifier }] },
    });
    if (!user) throw new UnauthorizedException("Invalid credentials");
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials");
    if (user.status === "BANNED") throw new ForbiddenException("Account banned");
    if (user.status === "SUSPENDED") throw new ForbiddenException("Account suspended");

    const tokens = this.issueTokens(user.id, user.email, Role.User);
    await this.createSession(user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id: user.id, username: user.username, email: user.email, status: user.status },
    };
  }

  async refresh(dto: RefreshTokenDto) {
    let payload: { sub: string };
    try {
      payload = this.jwt.verify(dto.refreshToken, {
        secret: this.config.get<string>("app.jwtRefreshSecret"),
      }) as { sub: string };
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const session = await this.prisma.userSession.findFirst({
      where: { userId: payload.sub, refreshToken: dto.refreshToken },
    });
    if (!session) throw new UnauthorizedException("Invalid refresh token");

    const tokens = this.issueTokens(payload.sub, "", Role.User);
    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { refreshToken: tokens.refreshToken },
    });
    return tokens;
  }

  async logout(userId: string) {
    await this.prisma.userSession.deleteMany({ where: { userId } });
    return { success: true };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findFirst({ where: { email: dto.email } });
    if (!user) return { success: true };

    const token = this.generateToken();
    await this.redis.set(`pwdreset:${token}`, user.id, 3600);
    logger.info("Password reset URL generated", { url: `/reset-password?token=${token}` });
    return { success: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const userId = await this.redis.get(`pwdreset:${dto.token}`);
    if (!userId) throw new BadRequestException("Invalid or expired reset token");

    if (!isValidPassword(dto.password)) {
      throw new BadRequestException("Password does not meet policy requirements");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    await this.redis.del(`pwdreset:${dto.token}`);
    await this.prisma.userSession.deleteMany({ where: { userId } });
    return { success: true };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    const ok = await bcrypt.compare(dto.oldPassword, user.passwordHash);
    if (!ok) throw new BadRequestException("Invalid current password");

    if (!isValidPassword(dto.newPassword)) {
      throw new BadRequestException("Password does not meet policy requirements");
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    await this.prisma.userSession.deleteMany({ where: { userId } });
    return { success: true };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const userId = await this.redis.get(`verify:${dto.token}`);
    if (!userId) throw new BadRequestException("Invalid or expired token");

    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true, verificationToken: null, verificationExpires: null },
    });
    await this.redis.del(`verify:${dto.token}`);
    return { success: true };
  }

  async sessions(userId: string) {
    return this.prisma.userSession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, deviceId: true, ipAddress: true, userAgent: true, createdAt: true },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    await this.prisma.userSession.deleteMany({ where: { id: sessionId, userId } });
    return { success: true };
  }

  private issueTokens(sub: string, email: string, role: Role) {
    const accessToken = this.jwt.sign(
      { sub, email, role },
      { secret: this.config.get<string>("app.jwtSecret"), expiresIn: this.config.get<string>("app.jwtExpiresIn") },
    );
    const refreshToken = this.jwt.sign(
      { sub, email, role },
      { secret: this.config.get<string>("app.jwtRefreshSecret"), expiresIn: this.config.get<string>("app.jwtRefreshExpiresIn") },
    );
    return { accessToken, refreshToken };
  }

  private async createSession(userId: string, refreshToken: string) {
    await this.prisma.userSession.create({
      data: { userId, refreshToken },
    });
  }

  private generateToken(): string {
    return require("crypto").randomBytes(32).toString("hex");
  }
}
