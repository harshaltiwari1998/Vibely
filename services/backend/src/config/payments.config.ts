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
  googlePlay: {
    packageName: process.env.GOOGLE_PLAY_PACKAGE_NAME || "com.vibely.app",
    /** Service account key JSON (raw or base64) with access to the Play Developer API. */
    serviceAccountJson: process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON || "",
    /** Tax included in coin package prices, used to split the amount reported to Google. */
    taxPercent: Number(process.env.GOOGLE_PLAY_TAX_PERCENT ?? "18"),
  },
}));
