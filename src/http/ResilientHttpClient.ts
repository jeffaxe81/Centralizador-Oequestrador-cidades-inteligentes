import { request } from "undici";

export type RetryPolicy = {
  maxAttempts: number;
  backoffMs: number;
};

export type ResilientHttpRequest = {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  correlationId: string;
  requestId?: string;
  timeoutMs?: number;
  retry?: RetryPolicy;
  headers?: Record<string, string>;
};

export type ResilientHttpResponse = {
  statusCode: number;
};

export type ResilientHttpLogEvent = {
  event: "http.request";
  method: ResilientHttpRequest["method"];
  url: string;
  correlationId: string;
  headers: Record<string, string>;
};

export type ResilientHttpLogger = {
  info(event: ResilientHttpLogEvent): void;
};

export class ResilientHttpError extends Error {
  readonly code: "TIMEOUT";
  readonly correlationId: string;

  constructor(input: { code: "TIMEOUT"; correlationId: string; message: string }) {
    super(input.message);
    this.name = "ResilientHttpError";
    this.code = input.code;
    this.correlationId = input.correlationId;
  }
}

const retryableStatusCodes = new Set([502, 503, 504]);
const sensitiveHeaderNames = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "proxy-authorization",
  "x-api-key"
]);

function delay(ms: number): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).map(([name, value]) => [
      name,
      sensitiveHeaderNames.has(name.toLowerCase()) ? "[REDACTED]" : value
    ])
  );
}

function logSafeUrl(input: string): string {
  const url = new URL(input);
  return `${url.origin}${url.pathname}`;
}

export class ResilientHttpClient {
  private readonly logger: ResilientHttpLogger | undefined;

  constructor(options: { logger?: ResilientHttpLogger } = {}) {
    this.logger = options.logger;
  }

  async request(input: ResilientHttpRequest): Promise<ResilientHttpResponse> {
    const signal = input.timeoutMs === undefined ? undefined : AbortSignal.timeout(input.timeoutMs);
    const signalOptions = signal === undefined ? {} : { signal };
    const maxAttempts = input.method === "GET" ? Math.max(1, input.retry?.maxAttempts ?? 1) : 1;
    const requestIdHeaders = input.requestId === undefined ? {} : { "x-request-id": input.requestId };
    const outboundHeaders = {
      ...(input.headers ?? {}),
      "x-correlation-id": input.correlationId,
      ...requestIdHeaders
    };

    this.logger?.info({
      event: "http.request",
      method: input.method,
      url: logSafeUrl(input.url),
      correlationId: input.correlationId,
      headers: sanitizeHeaders(outboundHeaders)
    });

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await request(input.url, {
          method: input.method,
          headers: outboundHeaders,
          ...signalOptions
        });

        await response.body.dump();

        if (retryableStatusCodes.has(response.statusCode) && attempt < maxAttempts) {
          await delay(input.retry?.backoffMs ?? 0);
          continue;
        }

        return {
          statusCode: response.statusCode
        };
      } catch (error) {
        if (signal?.aborted) {
          throw new ResilientHttpError({
            code: "TIMEOUT",
            correlationId: input.correlationId,
            message: `HTTP request timed out after ${input.timeoutMs}ms`
          });
        }

        throw error;
      }
    }

    throw new Error("unreachable");
  }
}
