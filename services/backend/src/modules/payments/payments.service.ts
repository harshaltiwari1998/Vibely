import { Injectable, BadRequestException, NotFoundException, Logger } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { PaymentProvider } from "./payment.provider";
import { RazorpayProvider } from "./razorpay.provider";
import { WalletService } from "../wallet/wallet.service";
import { ConfigService } from "@nestjs/config";
import { RealtimeGateway } from "../../realtime/realtime.gateway";
import { RealtimeEvent } from "@vibely/types";
import { TransactionType } from "@prisma/client";
import { AutoModerationService } from "../auto-moderation/auto-moderation.service";

const logger = new Logger("PaymentsService");

const DEFAULT_PACKAGES = [
  { name: "100 Coins", coins: 100, price: 99, currency: "INR" },
  { name: "500 Coins", coins: 500, price: 499, currency: "INR" },
  { name: "1000 Coins", coins: 1000, price: 899, currency: "INR" },
  { name: "2500 Coins", coins: 2500, price: 1999, currency: "INR" },
  { name: "5000 Coins", coins: 5000, price: 3499, currency: "INR" },
];

@Injectable()
export class PaymentsService {
  private readonly provider: PaymentProvider;

  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
    private readonly configService: ConfigService,
    private readonly gateway: RealtimeGateway,
    private readonly autoModeration: AutoModerationService,
  ) {
    const providerName = this.configService.get<string>("payments.provider", "razorpay");
    if (providerName === "razorpay") {
      this.provider = new RazorpayProvider(this.configService);
    } else {
      throw new BadRequestException(`Unsupported payment provider: ${providerName}`);
    }
  }

  async getPackages() {
    let packages = await this.prisma.coinPackage.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });

    if (packages.length === 0) {
      packages = await this.seedDefaultPackages();
    }

    return packages.map((p) => ({
      id: p.id,
      name: p.name,
      coins: p.coins,
      price: p.price,
      currency: p.currency,
    }));
  }

  async createPayment(userId: string, dto: { packageId?: string; coins?: number; amount?: number; currency?: string; idempotencyKey?: string }) {
    const { packageId, coins, amount, currency = "INR", idempotencyKey } = dto;

    if (!packageId && (!coins || !amount)) {
      throw new BadRequestException("Either packageId or coins and amount are required");
    }

    let coinAmount = coins;
    let price = amount;
    let packageRecord = null;
    let paymentCurrency = currency;

    if (packageId) {
      packageRecord = await this.prisma.coinPackage.findUnique({
        where: { id: packageId },
      });
      if (!packageRecord || !packageRecord.active) {
        throw new NotFoundException("Coin package not found");
      }
      coinAmount = packageRecord.coins;
      price = packageRecord.price;
      paymentCurrency = packageRecord.currency;
    } else {
      if (!coinAmount || coinAmount <= 0 || !price || price <= 0) {
        throw new BadRequestException("Invalid coin amount or price");
      }
    }

    // Only short-circuit on a genuine idempotency replay (caller explicitly
    // passed the same key back). Without this guard, `idempotencyKey ||
    // undefined` drops the field from the query entirely and Prisma matches
    // *any* pending/succeeded payment for the user — so a user who abandoned
    // one recharge would get that stale order back for every later purchase,
    // even a different pack, and without a providerKeyId (breaking checkout).
    if (idempotencyKey) {
      const existingPayment = await this.prisma.payment.findFirst({
        where: { idempotencyKey, userId, status: { in: ["PENDING", "SUCCEEDED"] } },
      });
      if (existingPayment) {
        return {
          paymentId: existingPayment.id,
          providerRef: existingPayment.providerRef || "",
          amount: existingPayment.amount,
          currency: existingPayment.currency,
          status: existingPayment.status,
          providerKeyId: this.configService.get<string>("payments.razorpay.keyId", ""),
        };
      }
    }

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        provider: this.provider.getProviderName(),
        packageId: packageRecord?.id,
        coins: coinAmount,
        amount: price,
        currency: paymentCurrency,
        status: "PENDING",
        idempotencyKey: idempotencyKey || `pay_${userId}_${Date.now()}`,
      },
    });

    const providerResponse = await this.provider.createPayment({
      userId,
      amount: price,
      currency: paymentCurrency,
      packageId,
      coins: coinAmount,
      idempotencyKey: payment.idempotencyKey || undefined,
      metadata: { paymentId: payment.id },
    });

    const updatedPayment = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerRef: providerResponse.providerRef,
      },
    });

    logger.log("Payment created", { paymentId: updatedPayment.id, userId, amount: price });
    this.gateway.server.to(userId).emit(RealtimeEvent.PaymentCreated, {
      paymentId: updatedPayment.id,
      amount: updatedPayment.amount,
      currency: updatedPayment.currency,
      coins: updatedPayment.coins,
    });
    return {
      paymentId: updatedPayment.id,
      providerRef: updatedPayment.providerRef || "",
      amount: updatedPayment.amount,
      currency: updatedPayment.currency,
      status: updatedPayment.status,
      providerKeyId: providerResponse.providerKeyId,
      redirectUrl: providerResponse.redirectUrl,
      qrCode: providerResponse.qrCode,
      upiLink: providerResponse.upiLink,
    };
  }

  async verifyPayment(paymentId: string, providerPaymentId?: string, signature?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { package: true },
    });
    if (!payment) {
      throw new NotFoundException("Payment not found");
    }

    if (payment.status === "SUCCEEDED") {
      return payment;
    }

    if (!payment.providerRef) {
      throw new BadRequestException("Payment has no provider reference");
    }

    const verification = await this.provider.verifyPayment({
      paymentId: payment.id,
      providerRef: payment.providerRef,
      providerPaymentId,
      signature,
    });

    if (verification.status === "SUCCEEDED") {
      await this.prisma.$transaction(async (tx) => {
        const updatedPayment = await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: "SUCCEEDED",
            providerPaymentId: verification.providerPaymentId,
            verifiedAt: new Date(),
          },
        });

        if (updatedPayment.status === "SUCCEEDED" && updatedPayment.coins > 0) {
          const wallet = await this.wallet.addCoins(
            updatedPayment.userId,
            updatedPayment.coins,
            "PURCHASE",
            updatedPayment.id,
          );

          await tx.coinTransaction.update({
            where: { id: wallet.transaction.id },
            data: {
              reference: `payment:${paymentId}`,
            },
          });
        }
      });

      logger.log("Payment verified and coins credited", { paymentId, userId: payment.userId });
      this.gateway.server.to(payment.userId).emit(RealtimeEvent.PaymentSucceeded, {
        paymentId: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        coins: payment.coins,
      });
      await this.autoModeration.checkUserRisk(payment.userId);
    } else if (verification.status === "FAILED") {
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: { status: "FAILED" },
      });
      this.gateway.server.to(payment.userId).emit(RealtimeEvent.PaymentFailed, {
        paymentId: payment.id,
        reason: "Payment verification failed",
      });
    }

    return this.prisma.payment.findUnique({ where: { id: paymentId } });
  }

  /**
   * `rawBody` must be the exact bytes Razorpay sent (before JSON parsing) —
   * the HMAC signature check fails on a re-serialized object even if the
   * data is logically identical, because key order/whitespace can differ.
   */
  async handleWebhook(rawBody: Buffer | string, signature: string) {
    if (!this.provider.verifyWebhookSignature(rawBody, signature || "")) {
      logger.warn("Invalid webhook signature");
      throw new BadRequestException("Invalid webhook signature");
    }

    const event = JSON.parse(rawBody.toString()) as {
      event: string;
      payload?: { payment?: { entity?: { id: string; order_id: string; status: string } } };
    };
    const entity = event.payload?.payment?.entity;
    if (!entity?.order_id) {
      logger.warn("Webhook missing payment entity", { event: event.event });
      return { success: true };
    }

    const existingPayment = await this.prisma.payment.findFirst({
      where: { providerRef: entity.order_id },
    });

    if (!existingPayment) {
      logger.warn("Webhook received for unknown payment", { orderId: entity.order_id });
      return { success: true };
    }

    if (existingPayment.status === "SUCCEEDED" || existingPayment.status === "REFUNDED") {
      return { success: true };
    }

    const newStatus = entity.status === "captured" ? "SUCCEEDED" : entity.status === "failed" ? "FAILED" : "PENDING";
    if (newStatus === "PENDING") {
      return { success: true };
    }

    await this.prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: existingPayment.id },
        data: {
          status: newStatus,
          providerPaymentId: entity.id,
          webhookPayload: rawBody.toString(),
          verifiedAt: new Date(),
        },
      });

      if (updatedPayment.status === "SUCCEEDED" && updatedPayment.coins > 0) {
        const wallet = await this.wallet.addCoins(
          updatedPayment.userId,
          updatedPayment.coins,
          "PURCHASE",
          updatedPayment.id,
        );

        await tx.coinTransaction.update({
          where: { id: wallet.transaction.id },
          data: {
            reference: `payment:${existingPayment.id}`,
          },
        });
      }
    });

    if (newStatus === "SUCCEEDED") {
      await this.autoModeration.checkUserRisk(existingPayment.userId);
    }

    logger.log("Webhook processed", { paymentId: existingPayment.id, status: newStatus });
    return { success: true };
  }

  async getPaymentStatus(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { package: true },
    });
    if (!payment) {
      throw new NotFoundException("Payment not found");
    }
    return {
      paymentId: payment.id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      coins: payment.coins,
      provider: payment.provider,
      providerRef: payment.providerRef,
      createdAt: payment.createdAt,
      verifiedAt: payment.verifiedAt,
    };
  }

  async listTransactions(userId: string) {
    const payments = await this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return { items: payments, total: payments.length };
  }

  async refundPayment(paymentId: string, amount?: number, reason?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) {
      throw new NotFoundException("Payment not found");
    }
    if (payment.status !== "SUCCEEDED") {
      throw new BadRequestException("Payment is not in refundable state");
    }

    if (!payment.providerPaymentId) {
      throw new BadRequestException("Payment has no provider charge id to refund");
    }

    const refundAmount = amount || payment.amount;
    const refund = await this.provider.refundPayment({
      paymentId: payment.providerPaymentId,
      amount: refundAmount,
      reason,
    });

    if (refund.status === "PROCESSING" || refund.status === "SUCCEEDED") {
      await this.prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: paymentId },
          data: { status: "REFUNDED" },
        });

        if (refundAmount > 0) {
          await this.wallet.deductCoins(
            payment.userId,
            refundAmount,
            "REFUND",
            `refund:${paymentId}`,
          );
        }
      });

      logger.warn("Payment refunded", { paymentId, refundAmount, refundId: refund.refundId });
    }

    return refund;
  }

  private async seedDefaultPackages() {
    const promises = DEFAULT_PACKAGES.map((pkg, index) =>
      this.prisma.coinPackage.create({
        data: {
          name: pkg.name,
          coins: pkg.coins,
          price: pkg.price,
          currency: pkg.currency,
          sortOrder: index,
          active: true,
        },
      }),
    );
    return Promise.all(promises);
  }
}
