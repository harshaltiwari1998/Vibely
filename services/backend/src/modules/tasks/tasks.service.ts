import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { WalletService } from "../wallet/wallet.service";
import { LevelsService } from "../levels/levels.service";
import { TaskType } from "@prisma/client";

interface TaskDef {
  type: TaskType;
  title: string;
  description: string;
  reward: number;
  repeatable: boolean;
}

const TASK_DEFS: TaskDef[] = [
  { type: "DAILY_CHECKIN", title: "Daily check-in", description: "Claim a diamond bonus, once per day", reward: 20, repeatable: true },
  { type: "COMPLETE_PROFILE", title: "Complete your profile", description: "Add a bio to your profile", reward: 50, repeatable: false },
  { type: "FIRST_GIFT", title: "Send your first gift", description: "Send any gift to another user", reward: 100, repeatable: false },
  { type: "GIFT_VETERAN", title: "Gift veteran", description: "Send 10 gifts in total", reward: 500, repeatable: false },
  { type: "FIRST_RECHARGE", title: "First recharge", description: "Recharge your wallet at least once", reward: 200, repeatable: false },
  { type: "GO_LIVE_ONCE", title: "Go live", description: "Host a live room at least once", reward: 300, repeatable: false },
];

function isSameUtcDay(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate();
}

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
    private readonly levels: LevelsService,
  ) {}

  async getTasks(userId: string) {
    const [profile, giftCount, purchaseCount, liveCount, claims] = await Promise.all([
      this.prisma.profile.findUnique({ where: { userId }, select: { bio: true } }),
      this.prisma.giftTransaction.count({ where: { senderId: userId } }),
      this.prisma.coinTransaction.count({ where: { userId, type: "PURCHASE" } }),
      this.prisma.liveRoom.count({ where: { hostId: userId } }),
      this.prisma.taskClaim.findMany({ where: { userId } }),
    ]);

    const claimedOneTimeTypes = new Set(claims.filter((c) => c.taskType !== "DAILY_CHECKIN").map((c) => c.taskType));
    const lastDailyClaim = claims
      .filter((c) => c.taskType === "DAILY_CHECKIN")
      .sort((a, b) => b.claimedAt.getTime() - a.claimedAt.getTime())[0];
    const claimedToday = !!lastDailyClaim && isSameUtcDay(lastDailyClaim.claimedAt, new Date());

    return TASK_DEFS.map((def) => {
      let eligible: boolean;
      switch (def.type) {
        case "DAILY_CHECKIN":
          eligible = true;
          break;
        case "COMPLETE_PROFILE":
          eligible = !!profile?.bio && profile.bio.trim().length > 0;
          break;
        case "FIRST_GIFT":
          eligible = giftCount >= 1;
          break;
        case "GIFT_VETERAN":
          eligible = giftCount >= 10;
          break;
        case "FIRST_RECHARGE":
          eligible = purchaseCount >= 1;
          break;
        case "GO_LIVE_ONCE":
          eligible = liveCount >= 1;
          break;
      }
      const claimed = def.type === "DAILY_CHECKIN" ? claimedToday : claimedOneTimeTypes.has(def.type);
      const status = claimed ? "CLAIMED" : eligible ? "CLAIMABLE" : "LOCKED";
      return {
        type: def.type,
        title: def.title,
        description: def.description,
        reward: def.reward,
        repeatable: def.repeatable,
        status,
      };
    });
  }

  async claim(userId: string, type: TaskType) {
    const def = TASK_DEFS.find((d) => d.type === type);
    if (!def) {
      throw new BadRequestException("Invalid task");
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const tasks = await this.getTasks(userId);
    const task = tasks.find((t) => t.type === type);
    if (!task || task.status === "LOCKED") {
      throw new BadRequestException("Task is not yet completed");
    }
    if (task.status === "CLAIMED") {
      throw new BadRequestException("Task already claimed");
    }

    await this.prisma.taskClaim.create({ data: { userId, taskType: type } });
    const result = await this.wallet.addCoins(userId, def.reward, "BONUS", `task:${type}`);
    await this.levels.awardXp(userId, 10);

    return { type, reward: def.reward, balance: result.wallet.balance };
  }
}
