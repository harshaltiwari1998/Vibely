import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface PushResult {
  success: boolean;
  provider: string;
  messageId?: string;
  error?: string;
}

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger("PushNotificationService");
  private readonly fcmServerKey: string | undefined;
  private readonly fcmProjectId: string | undefined;
  private readonly apnsKeyId: string | undefined;
  private readonly apnsTeamId: string | undefined;
  private readonly apnsKeyPath: string | undefined;
  private readonly apnsTopic: string | undefined;
  private readonly sandbox: boolean;

  constructor(private readonly configService: ConfigService) {
    this.fcmServerKey = this.configService.get<string>("push.fcm.serverKey");
    this.fcmProjectId = this.configService.get<string>("push.fcm.projectId");
    this.apnsKeyId = this.configService.get<string>("push.apns.keyId");
    this.apnsTeamId = this.configService.get<string>("push.apns.teamId");
    this.apnsKeyPath = this.configService.get<string>("push.apns.keyPath");
    this.apnsTopic = this.configService.get<string>("push.apns.topic");
    this.sandbox = this.configService.get<boolean>("push.apns.sandbox", false);
  }

  async sendToDevice(pushToken: string, payload: PushPayload, platform: string): Promise<PushResult> {
    if (!pushToken || !payload.body) {
      return { success: false, provider: platform, error: "Missing push token or body" };
    }

    if (platform === "android") {
      return this.sendFcm(pushToken, payload);
    }
    if (platform === "ios") {
      return this.sendApns(pushToken, payload);
    }
    if (platform === "web") {
      return this.sendWebPush(pushToken, payload);
    }

    return { success: false, provider: platform, error: "Unsupported platform" };
  }

  private async sendFcm(pushToken: string, payload: PushPayload): Promise<PushResult> {
    if (!this.fcmServerKey) {
      return { success: false, provider: "fcm", error: "FCM server key not configured" };
    }

    try {
      const response = await fetch("https://fcm.googleapis.com/fcm/send", {
        method: "POST",
        headers: {
          "Authorization": `key=${this.fcmServerKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: pushToken,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: payload.data || {},
          android: {
            priority: "high",
          },
          apns: {
            headers: {
              "apns-priority": "10",
            },
            payload: {
              aps: {
                sound: "default",
                badge: 1,
              },
            },
          },
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        return { success: false, provider: "fcm", error: text };
      }

      const data = await response.json() as any;
      return {
        success: data.success || data.message_id !== undefined,
        provider: "fcm",
        messageId: data.message_id || data.results?.[0]?.message_id,
        error: data.results?.[0]?.error,
      };
    } catch (error: any) {
      this.logger.error("FCM send failed", error);
      return { success: false, provider: "fcm", error: error.message };
    }
  }

  private async sendApns(pushToken: string, payload: PushPayload): Promise<PushResult> {
    if (!this.apnsKeyPath || !this.apnsKeyId || !this.apnsTeamId) {
      return { success: false, provider: "apns", error: "APNS credentials not configured" };
    }

    const host = this.sandbox ? "https://api.development.push.apple.com" : "https://api.push.apple.com";
    const url = `${host}/3/device/${pushToken}`;

    try {
      const keyData = await this.readApnsKey();
      if (!keyData) {
        return { success: false, provider: "apns", error: "Failed to read APNS key file" };
      }

      const jwt = this.buildApnsJwt(keyData);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "apns-topic": this.apnsTopic || "com.vibely.app",
          "authorization": `bearer ${jwt}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          aps: {
            alert: {
              title: payload.title,
              body: payload.body,
            },
            sound: "default",
            badge: 1,
          },
          data: payload.data || {},
        }),
      });

      if (response.status === 200) {
        return { success: true, provider: "apns", messageId: response.headers.get("apns-id") || undefined };
      }

      const text = await response.text();
      return { success: false, provider: "apns", error: text };
    } catch (error: any) {
      this.logger.error("APNS send failed", error);
      return { success: false, provider: "apns", error: error.message };
    }
  }

  private async sendWebPush(pushToken: string, payload: PushPayload): Promise<PushResult> {
    if (!this.fcmServerKey) {
      return { success: false, provider: "webpush", error: "Web push not configured" };
    }

    return this.sendFcm(pushToken, payload);
  }

  private async readApnsKey(): Promise<string | null> {
    try {
      const fs = await import("fs");
      if (this.apnsKeyPath && fs.existsSync(this.apnsKeyPath)) {
        return fs.readFileSync(this.apnsKeyPath, "utf-8");
      }
      return null;
    } catch {
      return null;
    }
  }

  private buildApnsJwt(keyData: string): string {
    const header = Buffer.from(JSON.stringify({ alg: "ES256", kid: this.apnsKeyId })).toString("base64url");
    const now = Math.floor(Date.now() / 1000);
    const claims = Buffer.from(JSON.stringify({ iss: this.apnsTeamId, iat: now })).toString("base64url");
    const jwt = `${header}.${claims}`;

    const crypto = require("crypto");
    const sign = crypto.createSign("RSA-SHA256");
    sign.update(jwt);
    const signature = sign.sign(keyData, "base64url");
    return `${jwt}.${signature}`;
  }
}
