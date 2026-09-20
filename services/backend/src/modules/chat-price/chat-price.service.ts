import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { WalletService } from "../wallet/wallet.service";
import { levelFromXp } from "../levels/levels.service";

/** Matches the level-gated price ceiling shown in the reference app's "My chat price" screen. */
export function maxPricePerMinute(level: number): number {
  if (level <= 3) return 1260;
  return 1260 + (level - 3) * 600;
}

@Injectable()
export class ChatPriceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
  ) {}

  async getStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true, chatPricePerMinute: true },
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    const level = levelFromXp(user.xp);
    const beans = await this.wallet.getBeans(userId);

    return {
      pricePerMinute: user.chatPricePerMinute,
      maxPricePerMinute: maxPricePerMinute(level),
      level,
      beans: beans.beans,
    };
  }

  async setPrice(userId: string, pricePerMinute: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { xp: true } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    const cap = maxPricePerMinute(levelFromXp(user.xp));
    if (!Number.isInteger(pricePerMinute) || pricePerMinute < 0 || pricePerMinute > cap) {
      throw new BadRequestException(`Price must be an integer between 0 and ${cap}`);
    }

    await this.prisma.user.update({ where: { id: userId }, data: { chatPricePerMinute: pricePerMinute } });
    return this.getStatus(userId);
  }
}
