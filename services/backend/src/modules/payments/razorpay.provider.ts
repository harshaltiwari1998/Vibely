import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  CreatePaymentRequest,
  CreatePaymentResponse,
  PaymentProvider,
  PaymentStatusResponse,
  PaymentWebhookPayload,
  RefundPaymentRequest,
  RefundPaymentResponse,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
} from "./payment.provider";

interface ProviderConfig {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
  baseUrl: string;
  sandbox: boolean;
}

@Injectable()
export class RazorpayProvider implements PaymentProvider {
  private readonly logger = new Logger(RazorpayProvider.name);
  private readonly config: ProviderConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      keyId: this.configService.get<string>("payments.razorpay.keyId", ""),
      keySecret: this.configService.get<string>("payments.razorpay.keySecret", ""),
      webhookSecret: this.configService.get<string>("payments.razorpay.webhookSecret", ""),
      baseUrl: this.configService.get<string>("payments.razorpay.baseUrl", "https://api.razorpay.com/v1"),
      sandbox: this.configService.get<boolean>("payments.razorpay.sandbox", true),
    };
  }

  getProviderName(): string {
    return "razorpay";
  }

  async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    if (!this.config.keyId || !this.config.keySecret) {
      throw new Error("Payment provider credentials not configured");
    }

    const amountInPaise = Math.round(request.amount * 100);
    const receipt = `rcpt_${request.idempotencyKey || Date.now()}`;

    const payload = {
      amount: amountInPaise,
      currency: request.currency,
      receipt,
      notes: {
        userId: request.userId,
        packageId: request.packageId || "",
        coins: String(request.coins || 0),
        ...request.metadata,
      },
    };

    this.logger.log("Creating payment order", { userId: request.userId, amount: request.amount, currency: request.currency });

    // In a real implementation, make an HTTP call to Razorpay API:
    // const response = await fetch(`${this.config.baseUrl}/orders`, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     Authorization: `Basic ${Buffer.from(`${this.config.keyId}:${this.config.keySecret}`).toString("base64")}`,
    //   },
    //   body: JSON.stringify(payload),
    // });
    // const data = await response.json();

    // Placeholder response for architecture validation
    return {
      paymentId: `pay_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      providerRef: `order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      amount: request.amount,
      currency: request.currency,
      status: "PENDING",
      redirectUrl: `https://${this.config.sandbox ? "sandbox" : "api"}.razorpay.com/checkout/placeholder`,
    };
  }

  async verifyPayment(request: VerifyPaymentRequest): Promise<VerifyPaymentResponse> {
    this.logger.log("Verifying payment", { paymentId: request.paymentId, providerRef: request.providerRef });

    // In a real implementation:
    // const response = await fetch(`${this.config.baseUrl}/payments/${request.providerRef}`, {
    //   headers: {
    //     Authorization: `Basic ${Buffer.from(`${this.config.keyId}:${this.config.keySecret}`).toString("base64")}`,
    //   },
    // });
    // const data = await response.json();

    // Placeholder response
    return {
      paymentId: request.paymentId,
      status: "SUCCEEDED",
      amount: 0,
      currency: "INR",
    };
  }

  async refundPayment(request: RefundPaymentRequest): Promise<RefundPaymentResponse> {
    this.logger.log("Refunding payment", { paymentId: request.paymentId, amount: request.amount });

    // In a real implementation:
    // const response = await fetch(`${this.config.baseUrl}/refunds`, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     Authorization: `Basic ${Buffer.from(`${this.config.keyId}:${this.config.keySecret}`).toString("base64")}`,
    //   },
    //   body: JSON.stringify({
    //     payment_id: request.paymentId,
    //     amount: request.amount ? Math.round(request.amount * 100) : undefined,
    //     notes: { reason: request.reason || "" },
    //   }),
    // });
    // const data = await response.json();

    // Placeholder response
    return {
      refundId: `rfnd_${Date.now()}`,
      paymentId: request.paymentId,
      amount: request.amount || 0,
      status: "PROCESSING",
    };
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
    this.logger.log("Fetching payment status", { paymentId });

    // In a real implementation:
    // const response = await fetch(`${this.config.baseUrl}/payments/${paymentId}`, {
    //   headers: {
    //     Authorization: `Basic ${Buffer.from(`${this.config.keyId}:${this.config.keySecret}`).toString("base64")}`,
    //   },
    // });
    // const data = await response.json();

    // Placeholder response
    return {
      paymentId,
      status: "PENDING",
      amount: 0,
      currency: "INR",
    };
  }

  verifyWebhookSignature(payload: unknown, signature: string): boolean {
    if (!this.config.webhookSecret) {
      this.logger.warn("Webhook secret not configured; skipping signature verification");
      return false;
    }

    // In a real implementation:
    // const expectedSignature = crypto
    //   .createHmac("sha256", this.config.webhookSecret)
    //   .update(JSON.stringify(payload))
    //   .digest("hex");
    // return signature === expectedSignature;

    this.logger.warn("Webhook signature verification skipped in placeholder implementation");
    return false;
  }
}
