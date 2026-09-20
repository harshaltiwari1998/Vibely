import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Razorpay from "razorpay";
import { validatePaymentVerification, validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils";
import {
  CreatePaymentRequest,
  CreatePaymentResponse,
  PaymentProvider,
  PaymentStatusResponse,
  RefundPaymentRequest,
  RefundPaymentResponse,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
} from "./payment.provider";

interface ProviderConfig {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
}

const RAZORPAY_TO_INTERNAL_STATUS: Record<string, "SUCCEEDED" | "FAILED" | "PENDING"> = {
  captured: "SUCCEEDED",
  authorized: "PENDING",
  created: "PENDING",
  failed: "FAILED",
  refunded: "SUCCEEDED",
};

@Injectable()
export class RazorpayProvider implements PaymentProvider {
  private readonly logger = new Logger(RazorpayProvider.name);
  private readonly config: ProviderConfig;
  private readonly client: Razorpay | null;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      keyId: this.configService.get<string>("payments.razorpay.keyId", ""),
      keySecret: this.configService.get<string>("payments.razorpay.keySecret", ""),
      webhookSecret: this.configService.get<string>("payments.razorpay.webhookSecret", ""),
    };
    this.client = this.config.keyId && this.config.keySecret
      ? new Razorpay({ key_id: this.config.keyId, key_secret: this.config.keySecret })
      : null;
  }

  getProviderName(): string {
    return "razorpay";
  }

  private requireClient(): Razorpay {
    if (!this.client) {
      throw new Error("Razorpay credentials not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)");
    }
    return this.client;
  }

  async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    const client = this.requireClient();
    const amountInPaise = Math.round(request.amount * 100);
    const receipt = `rcpt_${request.idempotencyKey || Date.now()}`.slice(0, 40);

    this.logger.log("Creating Razorpay order", { userId: request.userId, amount: request.amount, currency: request.currency });

    const order = await client.orders.create({
      amount: amountInPaise,
      currency: request.currency,
      receipt,
      notes: {
        userId: request.userId,
        packageId: request.packageId || "",
        coins: String(request.coins || 0),
      },
    });

    return {
      paymentId: order.id,
      providerRef: order.id,
      amount: request.amount,
      currency: request.currency,
      status: "PENDING",
      providerKeyId: this.config.keyId,
    };
  }

  /**
   * Verifies a checkout completion using the razorpay_payment_id + razorpay_signature
   * the client received from the Checkout SDK, then confirms the charge actually
   * succeeded by fetching it from Razorpay (never trust the client's word alone).
   */
  async verifyPayment(request: VerifyPaymentRequest): Promise<VerifyPaymentResponse> {
    const client = this.requireClient();

    if (!request.providerPaymentId || !request.signature) {
      return { paymentId: request.paymentId, status: "PENDING", amount: 0, currency: "INR" };
    }

    const signatureValid = validatePaymentVerification(
      { order_id: request.providerRef, payment_id: request.providerPaymentId },
      request.signature,
      this.config.keySecret,
    );

    if (!signatureValid) {
      this.logger.warn("Razorpay signature mismatch", { paymentId: request.paymentId, providerRef: request.providerRef });
      return { paymentId: request.paymentId, status: "FAILED", amount: 0, currency: "INR" };
    }

    const payment = await client.payments.fetch(request.providerPaymentId);
    const status = RAZORPAY_TO_INTERNAL_STATUS[payment.status] ?? "PENDING";

    return {
      paymentId: request.paymentId,
      status,
      amount: Number(payment.amount) / 100,
      currency: payment.currency,
      providerPaymentId: payment.id,
    };
  }

  async refundPayment(request: RefundPaymentRequest): Promise<RefundPaymentResponse> {
    const client = this.requireClient();
    this.logger.log("Refunding Razorpay payment", { paymentId: request.paymentId, amount: request.amount });

    const refund = await client.payments.refund(request.paymentId, {
      amount: request.amount ? Math.round(request.amount * 100) : undefined,
      notes: request.reason ? { reason: request.reason } : undefined,
    });

    return {
      refundId: refund.id,
      paymentId: refund.payment_id,
      amount: (refund.amount ?? 0) / 100,
      status: refund.status === "processed" ? "SUCCEEDED" : refund.status === "failed" ? "FAILED" : "PROCESSING",
    };
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
    const client = this.requireClient();
    const payment = await client.payments.fetch(paymentId);
    return {
      paymentId: payment.id,
      status: RAZORPAY_TO_INTERNAL_STATUS[payment.status] === "SUCCEEDED" ? "SUCCEEDED" : RAZORPAY_TO_INTERNAL_STATUS[payment.status] === "FAILED" ? "FAILED" : "PENDING",
      amount: Number(payment.amount) / 100,
      currency: payment.currency,
    };
  }

  /** `payload` must be the raw request body string/Buffer — the HMAC only matches on the exact bytes Razorpay sent. */
  verifyWebhookSignature(payload: unknown, signature: string): boolean {
    if (!this.config.webhookSecret) {
      this.logger.warn("RAZORPAY_WEBHOOK_SECRET not configured; rejecting webhook");
      return false;
    }
    if (!signature) {
      return false;
    }
    try {
      return validateWebhookSignature(String(payload), signature, this.config.webhookSecret);
    } catch (error) {
      this.logger.warn("Webhook signature validation error", { error: error instanceof Error ? error.message : "unknown" });
      return false;
    }
  }
}
