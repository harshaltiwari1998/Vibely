import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { RedisService } from "../../cache/redis.service";
import { RealtimeGateway } from "../../realtime/realtime.gateway";
import { RealtimeEvent } from "@vibely/types";
import { createLogger, SECURITY, ageFromDateOfBirth } from "@vibely/shared";

const logger = createLogger("MatchingService");

const QUEUE_KEY = "matchmaking:queue";
const USER_QUEUE_KEY = (userId: string) => `matchmaking:user:${userId}`;
const EXCLUSION_KEY = (userId: string) => `matchmaking:exclusions:${userId}`;
const RATE_LIMIT_KEY = (userId: string) => `matchmaking:ratelimit:${userId}`;
const QUEUE_TTL_SECONDS = 60;
const EXCLUSION_SECONDS = 30;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 60;

@Injectable()
export class MatchingService {
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly gateway: RealtimeGateway,
  ) {}

  async onModuleInit() {
    this.cleanupInterval = setInterval(() => {
      void this.cleanupExpired();
    }, 15000);
  }

  async onModuleDestroy() {
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
  }

  async requestMatch(userId: string, _prefs: { preferredGender?: string; preferredAgeMin?: number; preferredAgeMax?: number }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, preferences: true },
    });
    if (!user) throw new NotFoundException("User not found");
    if (user.status === "BANNED") throw new ForbiddenException("Account banned");
    if (user.status === "SUSPENDED") throw new ForbiddenException("Account suspended");
    if (user.status === "RESTRICTED") throw new ForbiddenException("Account restricted");
    if (user.profile?.onlineStatus === "IN_CALL" || user.profile?.onlineStatus === "BUSY") {
      throw new BadRequestException("User is unavailable");
    }

    if (!this.redis.isReady()) {
      throw new BadRequestException("Matchmaking unavailable");
    }

    if (!(await this.checkRateLimit(userId))) {
      throw new BadRequestException("Too many match requests. Please wait.");
    }

    const existing = await this.redis.get(USER_QUEUE_KEY(userId));
    if (existing) {
      throw new BadRequestException("Already in queue");
    }

    await this.redis.zAdd(QUEUE_KEY, { score: Date.now(), value: userId });
    await this.redis.set(USER_QUEUE_KEY(userId), "queued", QUEUE_TTL_SECONDS);

    const matchId = await this.tryMatch(userId);
    if (matchId) {
      return { status: "MATCHED", matchId };
    }

    this.gateway.server.to(userId).emit(RealtimeEvent.MatchSearching, { matchId: "" });
    return { status: "WAITING" };
  }

  async cancelMatch(userId: string) {
    await this.leaveQueue(userId);
    return { success: true };
  }

  async acceptMatch(userId: string, matchId: string) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new NotFoundException("Match not found");
    if (match.status !== "MATCHED") throw new BadRequestException("Invalid match state");

    const otherUserId = match.userA === userId ? match.userB! : match.userA;
    if (match.userA === userId) {
      await this.prisma.match.update({
        where: { id: matchId },
        data: { status: "ACCEPTED", startedAt: new Date() },
      });
    } else {
      await this.prisma.match.update({
        where: { id: matchId },
        data: { status: "ACCEPTED", startedAt: new Date() },
      });
    }

    return { success: true, otherUserId };
  }

  async declineMatch(userId: string, matchId: string) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new NotFoundException("Match not found");
    if (match.status !== "MATCHED") throw new BadRequestException("Invalid match state");

    const otherUserId = match.userA === userId ? match.userB! : match.userA;
    await this.prisma.match.update({
      where: { id: matchId },
      data: { status: "DECLINED", endedAt: new Date() },
    });

    await this.addExclusion(userId, otherUserId);
    await this.addExclusion(otherUserId, userId);

    this.gateway.server.to(userId).emit(RealtimeEvent.MatchDecline, { matchId });
    this.gateway.server.to(otherUserId).emit(RealtimeEvent.MatchDecline, { matchId });

    return { success: true };
  }

  async skipMatch(userId: string, matchId: string) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new NotFoundException("Match not found");
    if (match.status !== "MATCHED") throw new BadRequestException("Invalid match state");

    const otherUserId = match.userA === userId ? match.userB! : match.userA;
    await this.prisma.match.update({
      where: { id: matchId },
      data: { status: "DECLINED", endedAt: new Date() },
    });

    await this.addExclusion(userId, otherUserId);
    await this.addExclusion(otherUserId, userId);

    this.gateway.server.to(userId).emit(RealtimeEvent.MatchCancelled, { matchId, reason: "skipped" });
    this.gateway.server.to(otherUserId).emit(RealtimeEvent.MatchCancelled, { matchId, reason: "peer skipped" });

    return { success: true };
  }

  async handleDisconnect(userId: string) {
    await this.leaveQueue(userId);
    const activeMatches = await this.prisma.match.findMany({
      where: {
        OR: [{ userA: userId }, { userB: userId }],
        status: { in: ["WAITING", "MATCHED"] },
      },
    });
    for (const match of activeMatches) {
      await this.prisma.match.update({
        where: { id: match.id },
        data: { status: "CANCELLED", endedAt: new Date() },
      });
      const otherUserId = match.userA === userId ? match.userB! : match.userA;
      if (otherUserId) {
        this.gateway.server.to(otherUserId).emit(RealtimeEvent.MatchCancelled, { matchId: match.id, reason: "disconnected" });
      }
    }
  }

  private async tryMatch(userId: string): Promise<string | null> {
    const candidates = await this.redis.zRange(QUEUE_KEY, 0, -1);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, preferences: true },
    });
    if (!user) return null;

    const blockedRows = await this.prisma.block.findMany({
      where: { blockerId: userId },
      select: { blockedId: true },
    });
    const blockedIds = new Set(blockedRows.map((b) => b.blockedId));

    for (const candidateId of candidates) {
      if (candidateId === userId) continue;
      if (await this.isExcluded(userId, candidateId)) continue;
      if (await this.isExcluded(candidateId, userId)) continue;
      if (blockedIds.has(candidateId)) continue;

      const candidate = await this.prisma.user.findUnique({
        where: { id: candidateId },
        include: { profile: true, preferences: true },
      });
      if (!candidate) continue;
      if (candidate.status === "BANNED" || candidate.status === "SUSPENDED") continue;
      if (candidate.profile?.onlineStatus === "IN_CALL" || candidate.profile?.onlineStatus === "BUSY") continue;

      const candidateBlockedRows = await this.prisma.block.findMany({
        where: { blockerId: candidateId },
        select: { blockedId: true },
      });
      const candidateBlockedIds = new Set(candidateBlockedRows.map((b) => b.blockedId));
      if (candidateBlockedIds.has(userId)) continue;

      const userBlockedRows = await this.prisma.block.findMany({
        where: { blockerId: userId },
        select: { blockedId: true },
      });
      const userBlockedIds = new Set(userBlockedRows.map((b) => b.blockedId));
      if (userBlockedIds.has(candidateId)) continue;

      if (!this.isCompatible(user, candidate)) continue;

      await this.prisma.match.create({
        data: {
          userA: userId,
          userB: candidateId,
          status: "MATCHED",
        },
      });

      await this.redis.zRem(QUEUE_KEY, [userId, candidateId]);
      await this.redis.del(USER_QUEUE_KEY(userId));
      await this.redis.del(USER_QUEUE_KEY(candidateId));

      const matchId = await this.prisma.match.findFirst({
        where: { userA: userId, userB: candidateId, status: "MATCHED" },
        orderBy: { createdAt: "desc" },
      });
      const id = matchId?.id ?? "";

      this.gateway.server.to(userId).emit(RealtimeEvent.MatchFound, { matchId: id, peerId: candidateId, callType: "VIDEO" });
      this.gateway.server.to(candidateId).emit(RealtimeEvent.MatchFound, { matchId: id, peerId: userId, callType: "VIDEO" });

      return id;
    }

    return null;
  }

  private isCompatible(a: { dateOfBirth: Date; gender: string; country: string; language: string; preferences?: { preferredGender?: string | null; preferredAgeMin?: number; preferredAgeMax?: number; preferredCountries?: string[]; preferredLanguages?: string[] } | null }, b: { dateOfBirth: Date; gender: string; country: string; language: string; preferences?: { preferredGender?: string | null; preferredAgeMin?: number; preferredAgeMax?: number; preferredCountries?: string[]; preferredLanguages?: string[] } | null }): boolean {
    const ageA = ageFromDateOfBirth(a.dateOfBirth);
    const ageB = ageFromDateOfBirth(b.dateOfBirth);

    if (b.preferences?.preferredGender && b.preferences.preferredGender !== "PREFER_NOT_TO_SAY" && b.preferences.preferredGender !== a.gender) return false;
    if (b.preferences?.preferredAgeMin && ageA < b.preferences.preferredAgeMin) return false;
    if (b.preferences?.preferredAgeMax && ageA > b.preferences.preferredAgeMax) return false;
    if (b.preferences?.preferredCountries?.length && !b.preferences.preferredCountries.includes(a.country)) return false;
    if (b.preferences?.preferredLanguages?.length && !b.preferences.preferredLanguages.includes(a.language)) return false;

    if (a.preferences?.preferredGender && a.preferences.preferredGender !== "PREFER_NOT_TO_SAY" && a.preferences.preferredGender !== b.gender) return false;
    if (a.preferences?.preferredAgeMin && ageB < a.preferences.preferredAgeMin) return false;
    if (a.preferences?.preferredAgeMax && ageB > a.preferences.preferredAgeMax) return false;
    if (a.preferences?.preferredCountries?.length && !a.preferences.preferredCountries.includes(b.country)) return false;
    if (a.preferences?.preferredLanguages?.length && !a.preferences.preferredLanguages.includes(b.language)) return false;

    return true;
  }

  private async leaveQueue(userId: string) {
    await this.redis.zRem(QUEUE_KEY, [userId]);
    await this.redis.del(USER_QUEUE_KEY(userId));
  }

  private async addExclusion(userId: string, otherId: string) {
    const key = EXCLUSION_KEY(userId);
    await this.redis.sAdd(key, otherId);
    await this.redis.expire(key, EXCLUSION_SECONDS);
  }

  private async isExcluded(userId: string, otherId: string): Promise<boolean> {
    const members = await this.redis.sMembers(EXCLUSION_KEY(userId));
    return members.includes(otherId);
  }

  private async checkRateLimit(userId: string): Promise<boolean> {
    const key = RATE_LIMIT_KEY(userId);
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, RATE_LIMIT_WINDOW);
    }
    return count <= RATE_LIMIT_MAX;
  }

  private async cleanupExpired() {
    if (!this.redis.isReady()) return;
    try {
      const candidates = await this.redis.zRange(QUEUE_KEY, 0, -1);
      for (const userId of candidates) {
        const queued = await this.redis.get(USER_QUEUE_KEY(userId));
        if (!queued) {
          await this.redis.zRem(QUEUE_KEY, [userId]);
          continue;
        }
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          include: { profile: true },
        });
        if (!user || user.status === "BANNED" || user.status === "SUSPENDED" || user.profile?.onlineStatus === "IN_CALL" || user.profile?.onlineStatus === "BUSY") {
          await this.leaveQueue(userId);
          this.gateway.server.to(userId).emit(RealtimeEvent.MatchCancelled, { matchId: "", reason: "unavailable" });
        }
      }
    } catch (err) {
      logger.warn("Matchmaking cleanup failed", { error: err instanceof Error ? err.message : "unknown" });
    }
  }
}
