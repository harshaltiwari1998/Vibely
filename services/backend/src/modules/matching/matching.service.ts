import { forwardRef, Inject, Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { RedisService } from "../../cache/redis.service";
import { RealtimeGateway } from "../../realtime/realtime.gateway";
import { PresenceService } from "../../realtime/presence.service";
import { RealtimeEvent } from "@vibely/types";
import { createLogger, ageFromDateOfBirth } from "@vibely/shared";
import { CallsService } from "../calls/calls.service";
import { WalletService } from "../wallet/wallet.service";

const logger = createLogger("MatchingService");

const BROADCAST_KEY = (matchId: string) => `matchmaking:broadcast:${matchId}`;
const RATE_LIMIT_KEY = (userId: string) => `matchmaking:ratelimit:${userId}`;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 60;
const REQUEST_TIMEOUT_SECONDS = 40;
export const RANDOM_MATCH_COST = 600;

type UserWithPrefs = {
  id: string;
  dateOfBirth: Date;
  gender: string;
  country: string;
  language: string;
  status: string;
  username: string;
  avatarUrl: string | null;
  preferences?: {
    preferredGender?: string | null;
    preferredAgeMin?: number;
    preferredAgeMax?: number;
    preferredCountries?: string[];
    preferredLanguages?: string[];
  } | null;
};

@Injectable()
export class MatchingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly presence: PresenceService,
    @Inject(forwardRef(() => RealtimeGateway)) private readonly gateway: RealtimeGateway,
    private readonly calls: CallsService,
    private readonly wallet: WalletService,
  ) {}

  /**
   * A user taps "Random match": their request broadcasts to every other
   * online, compatible user right now. Whoever accepts first gets the call;
   * everyone else's popup is closed. If nobody accepts within the timeout,
   * the request is cancelled and the diamonds are refunded.
   */
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

    if (!(await this.checkRateLimit(userId))) {
      throw new BadRequestException("Too many match requests. Please wait.");
    }

    const existingWaiting = await this.prisma.match.findFirst({
      where: { userA: userId, status: "WAITING" },
    });
    if (existingWaiting) {
      throw new BadRequestException("You already have a pending match request");
    }

    const { balance } = await this.wallet.getBalance(userId);
    if (balance < RANDOM_MATCH_COST) {
      throw new BadRequestException("Insufficient diamonds to request a match");
    }

    const match = await this.prisma.match.create({
      data: { userA: userId, status: "WAITING" },
    });
    await this.wallet.deductCoins(userId, RANDOM_MATCH_COST, "MATCH_COST", match.id);

    const candidateIds = await this.findOnlineCandidates(user);
    if (candidateIds.length === 0) {
      await this.expireMatch(match.id, userId, "No one is available right now");
      return { status: "EXPIRED", matchId: match.id };
    }

    for (const candidateId of candidateIds) {
      await this.redis.sAdd(BROADCAST_KEY(match.id), candidateId);
    }
    await this.redis.expire(BROADCAST_KEY(match.id), REQUEST_TIMEOUT_SECONDS + 5);

    for (const candidateId of candidateIds) {
      this.gateway.server.to(candidateId).emit(RealtimeEvent.MatchRequestIncoming, {
        matchId: match.id,
        requesterId: userId,
        requesterUsername: user.username,
        requesterAvatarUrl: user.avatarUrl,
      });
    }

    setTimeout(() => {
      void this.expireIfStillWaiting(match.id);
    }, REQUEST_TIMEOUT_SECONDS * 1000);

    this.gateway.server.to(userId).emit(RealtimeEvent.MatchSearching, { matchId: match.id });
    return { status: "WAITING", matchId: match.id };
  }

  async cancelMatch(userId: string) {
    const match = await this.prisma.match.findFirst({
      where: { userA: userId, status: "WAITING" },
    });
    if (match) {
      await this.expireMatch(match.id, userId, "Cancelled by requester", false);
    }
    return { success: true };
  }

  /** A candidate who received the broadcast accepts it. First one wins. */
  async acceptMatch(userId: string, matchId: string) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new NotFoundException("Match request not found");
    if (match.userA === userId) throw new BadRequestException("You cannot accept your own request");

    const claim = await this.prisma.match.updateMany({
      where: { id: matchId, status: "WAITING" },
      data: { userB: userId, status: "MATCHED" },
    });
    if (claim.count === 0) {
      throw new BadRequestException("This request is no longer available");
    }

    const requesterId = match.userA;
    const call = await this.calls.initiate(userId, requesterId);

    await this.prisma.match.update({
      where: { id: matchId },
      data: { status: "ACCEPTED", startedAt: new Date() },
    });

    this.gateway.server.to(userId).emit(RealtimeEvent.CallStarted, {
      callId: call.id,
      initiatorId: userId,
      receiverId: requesterId,
      type: "VIDEO",
    });

    await this.closeBroadcast(matchId, userId);

    logger.info("Match accepted, call started", { matchId, requesterId, accepterId: userId, callId: call.id });
    return { success: true, otherUserId: requesterId, callId: call.id };
  }

  async declineMatch(userId: string, matchId: string) {
    // A candidate dismissing their own popup doesn't affect the request for
    // everyone else — it just stops bothering this one user.
    void userId;
    void matchId;
    return { success: true };
  }

  async skipMatch(userId: string, matchId: string) {
    return this.declineMatch(userId, matchId);
  }

  async handleDisconnect(userId: string) {
    const pending = await this.prisma.match.findFirst({
      where: { userA: userId, status: "WAITING" },
    });
    if (pending) {
      await this.expireMatch(pending.id, userId, "Requester disconnected", false);
    }

    const activeCalls = await this.prisma.match.findMany({
      where: {
        OR: [{ userA: userId }, { userB: userId }],
        status: { in: ["MATCHED", "ACCEPTED"] },
      },
    });
    for (const match of activeCalls) {
      await this.prisma.match.update({
        where: { id: match.id },
        data: { status: "CANCELLED", endedAt: new Date() },
      });
      const otherUserId = match.userA === userId ? match.userB : match.userA;
      if (otherUserId) {
        this.gateway.server.to(otherUserId).emit(RealtimeEvent.MatchCancelled, { matchId: match.id, reason: "disconnected" });
      }
    }
  }

  private async findOnlineCandidates(user: UserWithPrefs): Promise<string[]> {
    const onlineIds = await this.presence.getOnlineUserIds();
    const candidateIds = onlineIds.filter((id) => id !== user.id);
    if (candidateIds.length === 0) return [];

    const blockedRows = await this.prisma.block.findMany({
      where: { blockerId: user.id },
      select: { blockedId: true },
    });
    const blockedIds = new Set(blockedRows.map((b) => b.blockedId));

    const blockedByRows = await this.prisma.block.findMany({
      where: { blockedId: user.id },
      select: { blockerId: true },
    });
    const blockedByIds = new Set(blockedByRows.map((b) => b.blockerId));

    const candidates = await this.prisma.user.findMany({
      where: { id: { in: candidateIds }, status: { notIn: ["BANNED", "SUSPENDED"] } },
      include: { profile: true, preferences: true },
    });

    const targetGender = this.defaultTargetGender(user.gender);

    const result: string[] = [];
    for (const candidate of candidates) {
      if (blockedIds.has(candidate.id) || blockedByIds.has(candidate.id)) continue;
      if (candidate.profile?.onlineStatus === "IN_CALL" || candidate.profile?.onlineStatus === "BUSY") continue;
      // Random match always rings the opposite gender — this is not
      // configurable via preferredGender, unlike age/country/language.
      if (targetGender && candidate.gender !== targetGender) continue;
      if (!this.isCompatible(user, candidate)) continue;
      result.push(candidate.id);
    }
    return result;
  }

  private defaultTargetGender(gender: string): string | null {
    if (gender === "MALE") return "FEMALE";
    if (gender === "FEMALE") return "MALE";
    return null;
  }

  private isCompatible(a: UserWithPrefs, b: UserWithPrefs): boolean {
    const ageA = ageFromDateOfBirth(a.dateOfBirth);
    const ageB = ageFromDateOfBirth(b.dateOfBirth);

    if (b.preferences?.preferredAgeMin && ageA < b.preferences.preferredAgeMin) return false;
    if (b.preferences?.preferredAgeMax && ageA > b.preferences.preferredAgeMax) return false;
    if (b.preferences?.preferredCountries?.length && !b.preferences.preferredCountries.includes(a.country)) return false;
    if (b.preferences?.preferredLanguages?.length && !b.preferences.preferredLanguages.includes(a.language)) return false;

    if (a.preferences?.preferredAgeMin && ageB < a.preferences.preferredAgeMin) return false;
    if (a.preferences?.preferredAgeMax && ageB > a.preferences.preferredAgeMax) return false;
    if (a.preferences?.preferredCountries?.length && !a.preferences.preferredCountries.includes(b.country)) return false;
    if (a.preferences?.preferredLanguages?.length && !a.preferences.preferredLanguages.includes(b.language)) return false;

    return true;
  }

  private async expireIfStillWaiting(matchId: string) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match || match.status !== "WAITING") return;
    await this.expireMatch(matchId, match.userA, "No one accepted in time");
  }

  private async expireMatch(matchId: string, requesterId: string, reason: string, notifyRequester = true) {
    const updated = await this.prisma.match.updateMany({
      where: { id: matchId, status: "WAITING" },
      data: { status: "CANCELLED", endedAt: new Date() },
    });
    if (updated.count === 0) return;

    await this.wallet.addCoins(requesterId, RANDOM_MATCH_COST, "REFUND", matchId);
    if (notifyRequester) {
      this.gateway.server.to(requesterId).emit(RealtimeEvent.MatchExpired, { matchId, reason });
    }
    await this.closeBroadcast(matchId);
  }

  /** Tell everyone who saw the broadcast (other than `except`) to dismiss it. */
  private async closeBroadcast(matchId: string, except?: string) {
    const candidateIds = await this.redis.sMembers(BROADCAST_KEY(matchId));
    for (const candidateId of candidateIds) {
      if (candidateId && candidateId !== except) {
        this.gateway.server.to(candidateId).emit(RealtimeEvent.MatchRequestClosed, { matchId });
      }
    }
  }

  private async checkRateLimit(userId: string): Promise<boolean> {
    const key = RATE_LIMIT_KEY(userId);
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, RATE_LIMIT_WINDOW);
    }
    return count <= RATE_LIMIT_MAX;
  }
}
