import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { createLogger } from "@vibely/shared";
import { UpdatePreferencesDto, UpdateProfileDto, UpdateAvatarDto, UpdateMeDto } from "./dto";

const logger = createLogger("UsersService");

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true, preferences: true },
    });
    if (!user) throw new NotFoundException("User not found");
    const { passwordHash, ...safe } = user;
    return safe;
  }

  async findPublic(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
    if (!user) throw new NotFoundException("User not found");
    return {
      id: user.id,
      username: user.username,
      gender: user.gender,
      country: user.country,
      language: user.language,
      avatarUrl: user.avatarUrl,
      bio: user.profile?.bio,
      interests: user.profile?.interests ?? [],
      onlineStatus: user.profile?.onlineStatus,
    };
  }

  async list(query: { page?: number; limit?: number } = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          username: true,
          email: true,
          gender: true,
          country: true,
          language: true,
          avatarUrl: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          profile: { select: { bio: true, interests: true, onlineStatus: true } },
        },
      }),
      this.prisma.user.count(),
    ]);
    logger.debug("Listed users", { page, limit, total });
    return { items, total, page, limit };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.profile.update({
      where: { userId },
      data: {
        ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
        ...(dto.interests !== undefined ? { interests: dto.interests } : {}),
      },
    });
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    return this.prisma.userPreference.update({
      where: { userId },
      data: {
        ...(dto.preferredGender !== undefined ? { preferredGender: dto.preferredGender as never } : {}),
        ...(dto.preferredAgeMin !== undefined ? { preferredAgeMin: dto.preferredAgeMin } : {}),
        ...(dto.preferredAgeMax !== undefined ? { preferredAgeMax: dto.preferredAgeMax } : {}),
        ...(dto.preferredCountries !== undefined ? { preferredCountries: dto.preferredCountries } : {}),
        ...(dto.preferredLanguages !== undefined ? { preferredLanguages: dto.preferredLanguages } : {}),
      },
    });
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: { id: true, username: true, avatarUrl: true },
    });
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    const data: Record<string, unknown> = {};
    if (dto.country !== undefined) data.country = dto.country;
    if (dto.language !== undefined) data.language = dto.language;
    if (dto.gender !== undefined) data.gender = dto.gender;
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, username: true, email: true, country: true, language: true, gender: true, avatarUrl: true },
    });
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
}
