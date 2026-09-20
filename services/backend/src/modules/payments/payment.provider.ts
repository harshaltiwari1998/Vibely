export interface CreatePaymentRequest {
  userId: string;
  amount: number;
  currency: string;
  packageId?: string;
  coins?: number;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}

export interface CreatePaymentResponse {
  paymentId: string;
  providerRef: string;
  amount: number;
  currency: string;
  status: string;
  /** Public client key the app/web checkout SDK needs to open the payment sheet. */
  providerKeyId?: string;
  redirectUrl?: string;
  qrCode?: string;
 upiLink?: string;
}

export interface VerifyPaymentRequest {
  paymentId: string;
  providerRef: string;
  /** The charge id the provider's checkout SDK returns to the client (e.g. razorpay_payment_id). */
  providerPaymentId?: string;
  signature?: string;
}

export interface VerifyPaymentResponse {
  paymentId: string;
  status: "SUCCEEDED" | "FAILED" | "PENDING";
  amount: number;
  currency: string;
  providerPaymentId?: string;
}

export interface RefundPaymentRequest {
  paymentId: string;
  amount?: number;
  reason?: string;
}

export interface RefundPaymentResponse {
  refundId: string;
  paymentId: string;
  amount: number;
  status: string;
}

export interface PaymentStatusResponse {
  paymentId: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
  amount: number;
  currency: string;
}

export interface PaymentWebhookPayload {
  event: string;
  paymentId: string;
  providerRef: string;
  status: string;
  amount: number;
  currency: string;
  signature?: string;
  raw: unknown;
}

export interface PaymentProvider {
  createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse>;
  verifyPayment(request: VerifyPaymentRequest): Promise<VerifyPaymentResponse>;
  refundPayment(request: RefundPaymentRequest): Promise<RefundPaymentResponse>;
  getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse>;
  verifyWebhookSignature(payload: unknown, signature: string): boolean;
  getProviderName(): string;
}
