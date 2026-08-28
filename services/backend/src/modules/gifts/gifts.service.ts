import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { WalletService } from "../wallet/wallet.service";
import { RealtimeGateway } from "../../realtime/realtime.gateway";
import { RealtimeEvent } from "@vibely/types";
import { TransactionType } from "@prisma/client";
import { createLogger } from "@vibely/shared";

const logger = createLogger("GiftsService");

const DEFAULT_GIFTS = [
  { name: "Rose", iconUrl: "🌹", coinCost: 10 },
  { name: "Heart", iconUrl: "❤️", coinCost: 20 },
  { name: "Star", iconUrl: "⭐", coinCost: 30 },
  { name: "Diamond", iconUrl: "💎", coinCost: 100 },
  { name: "Crown", iconUrl: "👑", coinCost: 200 },
  { name: "Fireworks", iconUrl: "🎆", coinCost: 150 },
];

@Injectable()
export class GiftsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
    private readonly gateway: RealtimeGateway,
  ) {}

  async listGifts() {
    let gifts = await this.prisma.gift.findMany({
      where: { active: true },
      orderBy: { coinCost: "asc" },
    });

    if (gifts.length === 0) {
      gifts = await this.seedDefaultGifts();
    }

    return gifts;
  }

  async sendGift(senderId: string, dto: { receiverId: string; giftId: string }) {
    const { receiverId, giftId } = dto;
    if (senderId === receiverId) {
      throw new BadRequestException("Cannot send gift to yourself");
    }

    const gift = await this.prisma.gift.findUnique({
      where: { id: giftId },
    });
    if (!gift || !gift.active) {
      throw new NotFoundException("Gift not found or inactive");
    }

    const coinAmount = gift.coinCost;

    const { senderWallet, receiverWallet, senderTransaction, receiverTransaction } = await this.wallet.sendGiftCoins(
      senderId,
      receiverId,
      coinAmount,
      giftId,
    );

    const giftTransaction = await this.prisma.giftTransaction.create({
      data: {
        giftId,
        senderId,
        receiverId,
        coinAmount,
        coinTransactionId: senderTransaction.id,
      },
      include: {
        gift: true,
        sender: { select: { id: true, username: true, avatarUrl: true } },
        receiver: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    const payload = {
      giftId: gift.id,
      giftName: gift.name,
      iconUrl: gift.iconUrl,
      senderId,
      senderName: giftTransaction.sender.username,
      coinAmount,
    };

    this.gateway.server.to(senderId).emit(RealtimeEvent.GiftSent, payload);
    this.gateway.server.to(receiverId).emit(RealtimeEvent.GiftReceived, payload);

    logger.info("Gift sent", { senderId, receiverId, giftId, coinAmount });
    return giftTransaction;
  }

  async getGiftHistory(userId: string) {
    const [sent, received] = await Promise.all([
      this.prisma.giftTransaction.findMany({
        where: { senderId: userId },
        include: {
          gift: true,
          receiver: { select: { id: true, username: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      this.prisma.giftTransaction.findMany({
        where: { receiverId: userId },
        include: {
          gift: true,
          sender: { select: { id: true, username: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    return {
      sent: sent.map((g) => ({
        id: g.id,
        gift: g.gift,
        to: g.receiver,
        coinAmount: g.coinAmount,
        createdAt: g.createdAt,
      })),
      received: received.map((g) => ({
        id: g.id,
        gift: g.gift,
        from: g.sender,
        coinAmount: g.coinAmount,
        createdAt: g.createdAt,
      })),
    };
  }

  async createGift(data: { name: string; iconUrl: string; coinCost: number }) {
    return this.prisma.gift.create({
      data: {
        name: data.name,
        iconUrl: data.iconUrl,
        coinCost: data.coinCost,
        active: true,
      },
    });
  }

  async updateGift(giftId: string, data: { name?: string; iconUrl?: string; coinCost?: number; active?: boolean }) {
    return this.prisma.gift.update({
      where: { id: giftId },
      data,
    });
  }

  async deleteGift(giftId: string) {
    return this.prisma.gift.delete({
      where: { id: giftId },
    });
  }

  private async seedDefaultGifts() {
    const promises = DEFAULT_GIFTS.map((g) =>
      this.prisma.gift.create({
        data: {
          name: g.name,
          iconUrl: g.iconUrl,
          coinCost: g.coinCost,
          active: true,
        },
      }),
    );
    return Promise.all(promises);
  }
}
