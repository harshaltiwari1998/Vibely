import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { PaymentProvider } from "./payment.provider";
import { RazorpayProvider } from "./razorpay.provider";
import { WalletService } from "../wallet/wallet.service";
import { ConfigService } from "@nestjs/config";
import { RealtimeGateway } from "../../realtime/realtime.gateway";
import { RealtimeEvent } from "@vibely/types";
import { Prisma, TransactionType } from "@prisma/client";
import { AutoModerationService } from "../auto-moderation/auto-moderation.service";
import { GooglePlayApiError, GooglePlayClient } from "./google-play.client";

const logger = new Logger("PaymentsService");

const DEFAULT_PACKAGES = [
  { name: "100 Coins", coins: 100, price: 99, currency: "INR" },
  { name: "500 Coins", coins: 500, price: 499, currency: "INR" },
  { name: "1000 Coins", coins: 1000, price: 899, currency: "INR" },
  { name: "2500 Coins", coins: 2500, price: 1999, currency: "INR" },
  { name: "5000 Coins", coins: 5000, price: 3499, currency: "INR" },
];

/** How often to retry unreported user choice billing purchases (Google requires reporting within 24h) and check for voided Play purchases. */
const PLAY_SYNC_INTERVAL_MS = 15 * 60 * 1000;

@Injectable()
export class PaymentsService implements OnModuleInit, OnModuleDestroy {
  private readonly provider: PaymentProvider;
  private readonly googlePlay: GooglePlayClient;
  private reportTimer?: NodeJS.Timeout;

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
    this.googlePlay = new GooglePlayClient(this.configService);
  }

  onModuleInit() {
    if (!this.googlePlay.configured) return;
    this.reportTimer = setInterval(() => {
      this.reportPendingExternalTransactions().catch((e) => logger.error(`External transaction retry failed: ${e}`));
      this.processVoidedGooglePlayPurchases().catch((e) => logger.error(`Voided purchase check failed: ${e}`));
    }, PLAY_SYNC_INTERVAL_MS);
    this.reportTimer.unref();
  }

  onModuleDestroy() {
    if (this.reportTimer) clearInterval(this.reportTimer);
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
      playProductId: p.playProductId,
    }));
  }

  async createPayment(
    userId: string,
    dto: { packageId?: string; playProductId?: string; idempotencyKey?: string; externalTransactionToken?: string },
  ) {
    const { packageId, playProductId, idempotencyKey, externalTransactionToken } = dto;

    // Price and coin count always come from the server-side package; never
    // trust amounts sent by the client.
    if (!packageId && !playProductId) {
      throw new BadRequestException("packageId is required");
    }
    const packageRecord = await this.prisma.coinPackage.findFirst({
      where: packageId ? { id: packageId } : { playProductId },
    });
    if (!packageRecord || !packageRecord.active) {
      throw new NotFoundException("Coin package not found");
    }
    const coinAmount = packageRecord.coins;
    const price = packageRecord.price;
    const paymentCurrency = packageRecord.currency;

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
        packageId: packageRecord.id,
        coins: coinAmount,
        amount: price,
        currency: paymentCurrency,
        status: "PENDING",
        idempotencyKey: idempotencyKey || `pay_${userId}_${Date.now()}`,
        externalTransactionToken: externalTransactionToken || null,
      },
    });

    const providerResponse = await this.provider.createPayment({
      userId,
      amount: price,
      currency: paymentCurrency,
      packageId: packageRecord.id,
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

  async verifyPayment(userId: string, paymentId: string, providerPaymentId?: string, signature?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { package: true },
    });
    if (!payment || payment.userId !== userId) {
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
      await this.reportExternalTransaction(paymentId);
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
      await this.reportExternalTransaction(existingPayment.id);
    }

    logger.log("Webhook processed", { paymentId: existingPayment.id, status: newStatus });
    return { success: true };
  }

  async getPaymentStatus(userId: string, paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { package: true },
    });
    if (!payment || payment.userId !== userId) {
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

        const refundCoins = Math.round((payment.coins * refundAmount) / payment.amount);
        if (refundCoins > 0) {
          await this.wallet.deductCoins(
            payment.userId,
            refundCoins,
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
          playProductId: `coins_${pkg.coins}`,
          sortOrder: index,
          active: true,
        },
      }),
    );
    return Promise.all(promises);
  }

  /**
   * Credits a Google Play Billing purchase made in the Android app. Safe to
   * call repeatedly for the same token (the app re-sends unconsumed purchases
   * on startup); coins are credited at most once.
   */
  async verifyGooglePlayPurchase(userId: string, productId: string, purchaseToken: string) {
    if (!this.googlePlay.configured) {
      throw new ServiceUnavailableException("Google Play purchases are not configured");
    }
    const pkg = await this.prisma.coinPackage.findUnique({ where: { playProductId: productId } });
    if (!pkg) throw new NotFoundException("Unknown product");

    const idempotencyKey = `gplay_${purchaseToken}`;
    let payment = await this.prisma.payment.findUnique({ where: { idempotencyKey } });
    if (payment && payment.userId !== userId) {
      throw new ConflictException("Purchase belongs to another account");
    }

    if (!payment || payment.status !== "SUCCEEDED") {
      let purchase;
      try {
        purchase = await this.googlePlay.getProductPurchase(productId, purchaseToken);
      } catch (e) {
        if (e instanceof GooglePlayApiError && (e.status === 400 || e.status === 404 || e.status === 410)) {
          throw new BadRequestException("Invalid purchase token");
        }
        throw e;
      }
      if (purchase.purchaseState === 2) return { status: "PENDING" as const, coins: 0 };
      if (purchase.purchaseState !== 0) throw new BadRequestException("Purchase was cancelled");
      if (purchase.obfuscatedExternalAccountId && purchase.obfuscatedExternalAccountId !== userId) {
        throw new ForbiddenException("Purchase belongs to another account");
      }
      const quantity = Math.max(1, purchase.quantity ?? 1);

      if (!payment) {
        try {
          payment = await this.prisma.payment.create({
            data: {
              userId,
              provider: "google_play",
              providerRef: purchaseToken,
              providerPaymentId: purchase.orderId ?? null,
              packageId: pkg.id,
              coins: pkg.coins * quantity,
              amount: pkg.price * quantity,
              currency: pkg.currency,
              status: "PENDING",
              idempotencyKey,
            },
          });
        } catch (e) {
          // A concurrent call for the same token won the race; let it finish.
          if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
            return { status: "PENDING" as const, coins: 0 };
          }
          throw e;
        }
      }

      const reference = `payment:${payment.id}`;
      const alreadyCredited = await this.prisma.coinTransaction.findFirst({ where: { reference } });
      if (!alreadyCredited) {
        await this.wallet.addCoins(userId, payment.coins, "PURCHASE", reference);
      }
      payment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: "SUCCEEDED", verifiedAt: new Date() },
      });
      logger.log("Google Play purchase credited", { paymentId: payment.id, userId, productId });
      this.gateway.server.to(userId).emit(RealtimeEvent.PaymentSucceeded, {
        paymentId: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        coins: payment.coins,
      });
      await this.autoModeration.checkUserRisk(userId);
    }

    // Consume so the same coin pack can be bought again. Failure is not fatal:
    // the app re-sends unconsumed purchases and we retry here.
    try {
      await this.googlePlay.consumeProductPurchase(productId, purchaseToken);
    } catch (e) {
      logger.warn(`Consume failed for payment ${payment.id}: ${(e as Error).message}`);
    }
    return { status: "SUCCEEDED" as const, paymentId: payment.id, coins: payment.coins };
  }

  /**
   * Reports a Razorpay purchase the user chose on Play's user choice billing
   * screen to Google (required within 24 hours). No-op for other payments.
   */
  private async reportExternalTransaction(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment?.externalTransactionToken || payment.googleReportedAt || payment.status !== "SUCCEEDED") return;
    if (!this.googlePlay.configured) {
      logger.error(`Cannot report user choice billing payment ${paymentId}: GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is not set`);
      return;
    }

    const taxPercent = this.configService.get<number>("payments.googlePlay.taxPercent", 18);
    const totalMicros = payment.amount * 1_000_000;
    const preTaxMicros = Math.round((totalMicros * 100) / (100 + taxPercent));
    try {
      await this.googlePlay.reportExternalTransaction({
        externalTransactionId: payment.id,
        externalTransactionToken: payment.externalTransactionToken,
        transactionTime: payment.verifiedAt ?? payment.createdAt,
        currency: payment.currency,
        preTaxMicros: BigInt(preTaxMicros),
        taxMicros: BigInt(totalMicros - preTaxMicros),
        regionCode: "IN",
      });
    } catch (e) {
      // 409 means Google already has this transaction ID from an earlier attempt.
      if (!(e instanceof GooglePlayApiError && e.status === 409)) {
        logger.warn(`External transaction report failed for ${paymentId}; will retry`);
        return;
      }
    }
    await this.prisma.payment.update({ where: { id: paymentId }, data: { googleReportedAt: new Date() } });
    logger.log("External transaction reported to Google Play", { paymentId });
  }

  /**
   * Takes back coins for Google Play purchases that were refunded or charged
   * back. Only what is still in the wallet can be recovered; the user's risk
   * is re-evaluated so repeat chargeback abuse gets flagged.
   */
  private async processVoidedGooglePlayPurchases() {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const voided = await this.googlePlay.listVoidedPurchases(since);
    for (const v of voided) {
      const payment = await this.prisma.payment.findUnique({ where: { idempotencyKey: `gplay_${v.purchaseToken}` } });
      if (!payment || payment.status !== "SUCCEEDED") continue;

      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: "REFUNDED" } });
      const wallet = await this.prisma.wallet.findUnique({ where: { userId: payment.userId } });
      const recoverable = Math.min(payment.coins, wallet?.balance ?? 0);
      if (recoverable > 0) {
        await this.wallet.deductCoins(payment.userId, recoverable, "REFUND", `refund:${payment.id}`);
      }
      logger.warn("Google Play purchase voided", {
        paymentId: payment.id,
        userId: payment.userId,
        coinsRecovered: recoverable,
        coinsShort: payment.coins - recoverable,
      });
      await this.autoModeration.checkUserRisk(payment.userId);
    }
  }

  private async reportPendingExternalTransactions() {
    const pending = await this.prisma.payment.findMany({
      where: { status: "SUCCEEDED", externalTransactionToken: { not: null }, googleReportedAt: null },
      select: { id: true },
      take: 100,
    });
    for (const p of pending) {
      await this.reportExternalTransaction(p.id);
    }
  }
}
