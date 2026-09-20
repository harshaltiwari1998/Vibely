import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { WalletService } from "../wallet/wallet.service";
import { RequestWithdrawalDto } from "@vibely/types";
import { WithdrawalStatus } from "@prisma/client";
import { createLogger } from "@vibely/shared";

const logger = createLogger("WithdrawalsService");

/** Hosts earn beans from priced calls/gifts and cash them out at this rate. */
export const BEANS_PER_INR = 100;
export const MIN_WITHDRAWAL_BEANS = 10000;

@Injectable()
export class WithdrawalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
  ) {}

  async requestWithdrawal(userId: string, dto: RequestWithdrawalDto) {
    if (!Number.isInteger(dto.beansAmount) || dto.beansAmount < MIN_WITHDRAWAL_BEANS) {
      throw new BadRequestException(`Minimum withdrawal is ${MIN_WITHDRAWAL_BEANS} beans`);
    }
    if (!dto.upiId?.trim() || !dto.upiId.includes("@")) {
      throw new BadRequestException("A valid UPI ID is required");
    }

    const pending = await this.prisma.withdrawalRequest.findFirst({
      where: { userId, status: "PENDING" },
    });
    if (pending) throw new BadRequestException("You already have a pending withdrawal request");

    // Escrow the beans immediately so the same balance can't be requested twice;
    // they're refunded automatically if an admin rejects the request.
    await this.wallet.deductBeans(userId, dto.beansAmount);

    const payoutInr = Math.floor(dto.beansAmount / BEANS_PER_INR);
    const request = await this.prisma.withdrawalRequest.create({
      data: { userId, beansAmount: dto.beansAmount, payoutInr, upiId: dto.upiId.trim(), status: "PENDING" },
    });

    logger.info("Withdrawal requested", { userId, beansAmount: dto.beansAmount, payoutInr });
    return request;
  }

  async listMine(userId: string) {
    const items = await this.prisma.withdrawalRequest.findMany({
      where: { userId },
      orderBy: { requestedAt: "desc" },
    });
    return { items, total: items.length };
  }

  async adminList(status?: string) {
    const items = await this.prisma.withdrawalRequest.findMany({
      where: status ? { status: status as WithdrawalStatus } : undefined,
      orderBy: { requestedAt: "desc" },
      include: { user: { select: { id: true, username: true, email: true } } },
    });
    return { items, total: items.length };
  }

  async review(id: string, adminId: string, action: "APPROVE" | "REJECT" | "MARK_PAID", note?: string) {
    const request = await this.prisma.withdrawalRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException("Withdrawal request not found");

    if (action === "APPROVE") {
      if (request.status !== "PENDING") throw new BadRequestException("Only pending requests can be approved");
      const updated = await this.prisma.withdrawalRequest.update({
        where: { id },
        data: { status: "APPROVED", reviewedById: adminId, reviewNote: note, reviewedAt: new Date() },
      });
      logger.info("Withdrawal approved", { id, adminId });
      return updated;
    }

    if (action === "REJECT") {
      if (request.status !== "PENDING") throw new BadRequestException("Only pending requests can be rejected");
      const updated = await this.prisma.withdrawalRequest.update({
        where: { id },
        data: { status: "REJECTED", reviewedById: adminId, reviewNote: note, reviewedAt: new Date() },
      });
      await this.wallet.addBeans(request.userId, request.beansAmount);
      logger.warn("Withdrawal rejected and beans refunded", { id, adminId, beansAmount: request.beansAmount });
      return updated;
    }

    if (request.status !== "APPROVED") throw new BadRequestException("Only approved requests can be marked paid");
    const updated = await this.prisma.withdrawalRequest.update({
      where: { id },
      data: { status: "PAID", reviewedById: adminId, reviewNote: note ?? request.reviewNote, reviewedAt: new Date() },
    });
    logger.info("Withdrawal marked paid", { id, adminId });
    return updated;
  }
}
