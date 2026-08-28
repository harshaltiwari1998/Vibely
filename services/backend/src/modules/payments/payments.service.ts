import { Injectable, BadRequestException, NotFoundException, Logger } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { PaymentProvider, PaymentWebhookPayload } from "./payment.provider";
import { RazorpayProvider } from "./razorpay.provider";
import { WalletService } from "../wallet/wallet.service";
import { ConfigService } from "@nestjs/config";
import { RealtimeGateway } from "../../realtime/realtime.gateway";
import { RealtimeEvent } from "@vibely/types";
import { TransactionType } from "@prisma/client";

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

    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        idempotencyKey: idempotencyKey || undefined,
        userId,
        status: { in: ["PENDING", "SUCCEEDED"] },
      },
    });
    if (existingPayment) {
      return {
        paymentId: existingPayment.id,
        providerRef: existingPayment.providerRef || "",
        amount: existingPayment.amount,
        currency: existingPayment.currency,
        status: existingPayment.status,
      };
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
      redirectUrl: providerResponse.redirectUrl,
      qrCode: providerResponse.qrCode,
      upiLink: providerResponse.upiLink,
    };
  }

  async verifyPayment(paymentId: string) {
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
    });

    if (verification.status === "SUCCEEDED") {
      await this.prisma.$transaction(async (tx) => {
        const updatedPayment = await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: "SUCCEEDED",
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

  async handleWebhook(provider: string, rawPayload: unknown, signature?: string) {
    if (provider !== this.provider.getProviderName()) {
      throw new BadRequestException(`Unsupported provider: ${provider}`);
    }

    const payload = rawPayload as PaymentWebhookPayload;
    if (!this.provider.verifyWebhookSignature(rawPayload, signature || "")) {
      logger.warn("Invalid webhook signature", { provider, event: payload.event });
      throw new BadRequestException("Invalid webhook signature");
    }

    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        OR: [
          { id: payload.paymentId },
          { providerRef: payload.providerRef },
        ],
      },
    });

    if (!existingPayment) {
      logger.warn("Webhook received for unknown payment", { provider, paymentId: payload.paymentId });
      return { success: true };
    }

    if (existingPayment.status === "SUCCEEDED" || existingPayment.status === "REFUNDED") {
      return { success: true };
    }

    const newStatus = payload.status === "captured" || payload.status === "success" ? "SUCCEEDED" : "FAILED";

    await this.prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: existingPayment.id },
        data: {
          status: newStatus,
          webhookPayload: JSON.stringify(rawPayload),
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

    const refundAmount = amount || payment.amount;
    const refund = await this.provider.refundPayment({
      paymentId: payment.providerRef || paymentId,
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
