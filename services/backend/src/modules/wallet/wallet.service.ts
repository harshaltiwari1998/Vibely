import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { RealtimeGateway } from "../../realtime/realtime.gateway";
import { RealtimeEvent } from "@vibely/types";
import { TransactionType } from "@prisma/client";
import { createLogger } from "@vibely/shared";

const logger = createLogger("WalletService");

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: RealtimeGateway,
  ) {}

  async getBalance(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });
    if (!wallet) {
      const created = await this.prisma.wallet.create({
        data: { userId, balance: 0 },
      });
      return { balance: created.balance };
    }
    return { balance: wallet.balance };
  }

  async getTransactions(userId: string) {
    const transactions = await this.prisma.coinTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return { items: transactions, total: transactions.length };
  }

  async addCoins(userId: string, amount: number, type: TransactionType = "PURCHASE", reference?: string) {
    if (amount <= 0) {
      throw new BadRequestException("Amount must be positive");
    }

    const wallet = await this.ensureWallet(userId);
    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore + amount;

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.wallet.update({
        where: { userId },
        data: { balance: { increment: amount } },
      });

      const transaction = await tx.coinTransaction.create({
        data: {
          userId,
          type,
          amount,
          balanceBefore,
          balanceAfter: updated.balance,
          reference: reference ?? null,
        },
      });

      return { wallet: updated, transaction };
    });

    logger.info("Coins added", { userId, amount, balanceAfter: result.wallet.balance });
    return result;
  }

  async deductCoins(userId: string, amount: number, type: TransactionType = "GIFT_SENT", reference?: string) {
    if (amount <= 0) {
      throw new BadRequestException("Amount must be positive");
    }

    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });
    if (!wallet) {
      throw new NotFoundException("Wallet not found");
    }

    const balanceBefore = wallet.balance;
    if (balanceBefore < amount) {
      throw new BadRequestException("Insufficient balance");
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.wallet.update({
        where: { userId },
        data: { balance: { decrement: amount } },
      });

      const transaction = await tx.coinTransaction.create({
        data: {
          userId,
          type,
          amount: -amount,
          balanceBefore,
          balanceAfter: updated.balance,
          reference: reference ?? null,
        },
      });

      return { wallet: updated, transaction };
    });

    logger.info("Coins deducted", { userId, amount, balanceAfter: result.wallet.balance });
    return result;
  }

  async sendGiftCoins(senderId: string, receiverId: string, amount: number, giftId?: string) {
    if (senderId === receiverId) {
      throw new BadRequestException("Cannot send gift to yourself");
    }
    if (amount <= 0) {
      throw new BadRequestException("Gift amount must be positive");
    }

    const receiverWallet = await this.ensureWallet(receiverId);

    const result = await this.prisma.$transaction(async (tx) => {
      const senderWallet = await tx.wallet.findUnique({
        where: { userId: senderId },
      });
      if (!senderWallet) {
        throw new NotFoundException("Sender wallet not found");
      }
      if (senderWallet.balance < amount) {
        throw new BadRequestException("Insufficient balance");
      }

      const updatedSender = await tx.wallet.update({
        where: { userId: senderId },
        data: { balance: { decrement: amount } },
      });

      const updatedReceiver = await tx.wallet.update({
        where: { userId: receiverId },
        data: { balance: { increment: amount } },
      });

      const senderTransaction = await tx.coinTransaction.create({
        data: {
          userId: senderId,
          type: "GIFT_SENT",
          amount: -amount,
          balanceBefore: senderWallet.balance,
          balanceAfter: updatedSender.balance,
          reference: giftId,
        },
      });

      const receiverTransaction = await tx.coinTransaction.create({
        data: {
          userId: receiverId,
          type: "GIFT_RECEIVED",
          amount,
          balanceBefore: receiverWallet.balance,
          balanceAfter: updatedReceiver.balance,
          reference: giftId,
        },
      });

      return { senderWallet: updatedSender, receiverWallet: updatedReceiver, senderTransaction, receiverTransaction };
    });

    logger.info("Gift coins transferred", { senderId, receiverId, amount });
    return result;
  }

  async adminAdjust(userId: string, amount: number, reason: string) {
    const wallet = await this.ensureWallet(userId);
    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore + amount;

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.wallet.update({
        where: { userId },
        data: { balance: balanceAfter },
      });

      const transaction = await tx.coinTransaction.create({
        data: {
          userId,
          type: "ADMIN_ADJUSTMENT",
          amount,
          balanceBefore,
          balanceAfter,
          reference: reason,
        },
      });

      return { wallet: updated, transaction };
    });

    logger.warn("Admin coin adjustment", { userId, amount, reason });
    return result;
  }

  private async ensureWallet(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });
    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userId, balance: 0 },
      });
    }
    return wallet;
  }
}
