import { createSign } from "crypto";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

const logger = new Logger("GooglePlayClient");
const API = "https://androidpublisher.googleapis.com/androidpublisher/v3/applications";
const SCOPE = "https://www.googleapis.com/auth/androidpublisher";

interface ServiceAccount {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

/** https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.products */
export interface ProductPurchase {
  orderId?: string;
  /** 0 purchased, 1 canceled, 2 pending */
  purchaseState?: number;
  /** 0 not yet consumed, 1 consumed */
  consumptionState?: number;
  obfuscatedExternalAccountId?: string;
  quantity?: number;
  regionCode?: string;
}

export interface VoidedPurchase {
  purchaseToken: string;
  orderId?: string;
  voidedTimeMillis?: string;
}

/**
 * Minimal Play Developer API client. Authenticates as a service account via
 * the OAuth JWT-bearer flow (no googleapis dependency needed for a handful of calls).
 */
export class GooglePlayClient {
  private readonly packageName: string;
  private readonly account: ServiceAccount | null;
  private token: { value: string; expiresAt: number } | null = null;

  constructor(config: ConfigService) {
    this.packageName = config.get<string>("payments.googlePlay.packageName", "com.vibely.app");
    this.account = parseServiceAccount(config.get<string>("payments.googlePlay.serviceAccountJson", ""));
  }

  get configured() {
    return this.account !== null;
  }

  async getProductPurchase(productId: string, purchaseToken: string): Promise<ProductPurchase> {
    return this.request("GET", `${this.tokenUrl(productId, purchaseToken)}`);
  }

  async consumeProductPurchase(productId: string, purchaseToken: string): Promise<void> {
    await this.request("POST", `${this.tokenUrl(productId, purchaseToken)}:consume`);
  }

  /** https://developers.google.com/android-publisher/api-ref/rest/v3/externaltransactions/createexternaltransaction */
  async reportExternalTransaction(params: {
    externalTransactionId: string;
    externalTransactionToken: string;
    transactionTime: Date;
    currency: string;
    preTaxMicros: bigint;
    taxMicros: bigint;
    regionCode: string;
  }): Promise<void> {
    await this.request(
      "POST",
      `${API}/${this.packageName}/externalTransactions?externalTransactionId=${encodeURIComponent(params.externalTransactionId)}`,
      {
        originalPreTaxAmount: { currency: params.currency, priceMicros: params.preTaxMicros.toString() },
        originalTaxAmount: { currency: params.currency, priceMicros: params.taxMicros.toString() },
        transactionTime: params.transactionTime.toISOString(),
        oneTimeTransaction: { externalTransactionToken: params.externalTransactionToken },
        userTaxAddress: { regionCode: params.regionCode },
      },
    );
  }

  /**
   * Purchases refunded, charged back or cancelled since [since] (Play keeps 30 days).
   * https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.voidedpurchases/list
   */
  async listVoidedPurchases(since: Date): Promise<VoidedPurchase[]> {
    const voided: VoidedPurchase[] = [];
    let pageToken: string | undefined;
    do {
      const query = new URLSearchParams({ startTime: String(since.getTime()), maxResults: "1000" });
      if (pageToken) query.set("token", pageToken);
      const page = await this.request<{ voidedPurchases?: VoidedPurchase[]; tokenPagination?: { nextPageToken?: string } }>(
        "GET",
        `${API}/${this.packageName}/purchases/voidedpurchases?${query}`,
      );
      voided.push(...(page.voidedPurchases ?? []));
      pageToken = page.tokenPagination?.nextPageToken;
    } while (pageToken);
    return voided;
  }

  private tokenUrl(productId: string, purchaseToken: string) {
    return `${API}/${this.packageName}/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`;
  }

  private async request<T>(method: "GET" | "POST", url: string, body?: unknown): Promise<T> {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${await this.accessToken()}`,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    if (!res.ok) {
      logger.warn(`Play API ${method} ${url.split("/tokens/")[0].split("?")[0]} failed: ${res.status} ${text.slice(0, 300)}`);
      throw new GooglePlayApiError(res.status, text);
    }
    return (text ? JSON.parse(text) : {}) as T;
  }

  private async accessToken(): Promise<string> {
    if (!this.account) throw new Error("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is not configured");
    if (this.token && this.token.expiresAt > Date.now() + 60_000) return this.token.value;

    const tokenUri = this.account.token_uri || "https://oauth2.googleapis.com/token";
    const now = Math.floor(Date.now() / 1000);
    const encode = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({
      iss: this.account.client_email,
      scope: SCOPE,
      aud: tokenUri,
      iat: now,
      exp: now + 3600,
    })}`;
    const signature = createSign("RSA-SHA256").update(unsigned).sign(this.account.private_key, "base64url");

    const res = await fetch(tokenUri, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: `${unsigned}.${signature}`,
      }).toString(),
    });
    if (!res.ok) throw new Error(`Google OAuth token request failed: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as { access_token: string; expires_in: number };
    this.token = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
    return data.access_token;
  }
}

export class GooglePlayApiError extends Error {
  constructor(readonly status: number, readonly body: string) {
    super(`Google Play API error ${status}`);
  }
}

function parseServiceAccount(raw: string): ServiceAccount | null {
  if (!raw.trim()) return null;
  try {
    const json = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
    const parsed = JSON.parse(json) as ServiceAccount;
    if (!parsed.client_email || !parsed.private_key) throw new Error("missing client_email/private_key");
    return parsed;
  } catch (e) {
    logger.error(`Invalid GOOGLE_PLAY_SERVICE_ACCOUNT_JSON: ${(e as Error).message}`);
    return null;
  }
}
