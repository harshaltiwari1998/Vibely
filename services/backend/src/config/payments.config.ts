import { registerAs } from "@nestjs/config";

/**
 * Separate namespace from `app` because payment.provider.ts implementations
 * (e.g. RazorpayProvider) read from `payments.*`, not `app.payment.*`.
 */
export default registerAs("payments", () => ({
  provider: process.env.PAYMENT_PROVIDER || "razorpay",
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
    sandbox: (process.env.RAZORPAY_SANDBOX ?? "true") === "true",
  },
}));
