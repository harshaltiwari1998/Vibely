import { redactSensitive } from "./security";

export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Structured logger that NEVER logs secrets, tokens, passwords or private
 * message content. Pass sensitive objects through `redactSensitive` first,
 * or rely on the built-in redaction of metadata. This is an architecture
 * foundation; the transport (console/file/remote) is configured per env.
 */
export class Logger {
  constructor(private readonly context: string) {}

  private emit(level: LogLevel, message: string, meta?: unknown): void {
    const safeMeta = meta === undefined ? undefined : redactSensitive(meta);
    const entry = {
      ts: new Date().toISOString(),
      level,
      context: this.context,
      message,
      ...(safeMeta ? { meta: safeMeta } : {}),
    };
    if (level === "error") {
      // eslint-disable-next-line no-console
      console.error(JSON.stringify(entry));
    } else if (level === "warn") {
      // eslint-disable-next-line no-console
      console.warn(JSON.stringify(entry));
    } else {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(entry));
    }
  }

  debug(message: string, meta?: unknown): void {
    this.emit("debug", message);
  }

  log(message: string, meta?: unknown): void {
    this.emit("info", message, meta);
  }
  info(message: string, meta?: unknown): void {
    this.emit("info", message, meta);
  }
  warn(message: string, meta?: unknown): void {
    this.emit("warn", message, meta);
  }
  error(message: string, meta?: unknown): void {
    this.emit("error", message, meta);
  }
}

export function createLogger(context: string): Logger {
  return new Logger(context);
}
