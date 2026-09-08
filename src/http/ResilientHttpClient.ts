import { request } from "undici";

export type RetryPolicy = {
  maxAttempts: number;
  backoffMs: number;
};

export type CircuitBreakerOptions = {
  failureThreshold: number;
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

export type ResilientHttpErrorCode = "TIMEOUT" | "TRANSPORT" | "CIRCUIT_OPEN";

export class ResilientHttpError extends Error {
  readonly code: ResilientHttpErrorCode;
  readonly correlationId: string;
  readonly requestId: string | undefined;

  constructor(input: {
    code: ResilientHttpErrorCode;
    correlationId: string;
    requestId: string | undefined;
    message: string;
  }) {
    super(input.message);
    this.name = "ResilientHttpError";
    this.code = input.code;
    this.correlationId = input.correlationId;
    this.requestId = input.requestId;
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
  private readonly circuitBreaker: CircuitBreakerOptions | undefined;
  private consecutiveFailures = 0;
  private circuitOpen = false;

  constructor(options: {
    logger?: ResilientHttpLogger;
    circuitBreaker?: CircuitBreakerOptions;
  } = {}) {
    const circuitBreaker = options.circuitBreaker;
    if (
      circuitBreaker !== undefined &&
      (!Number.isInteger(circuitBreaker.failureThreshold) || circuitBreaker.failureThreshold < 1)
    ) {
      throw new Error("Invalid circuit breaker configuration");
    }

    this.logger = options.logger;
    this.circuitBreaker = circuitBreaker;
  }

  async request(input: ResilientHttpRequest): Promise<ResilientHttpResponse> {
    if (this.circuitOpen) {
      throw new ResilientHttpError({
        code: "CIRCUIT_OPEN",
        correlationId: input.correlationId,
        requestId: input.requestId,
        message: "HTTP circuit is open"
      });
    }

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

        if (retryableStatusCodes.has(response.statusCode)) {
          this.recordCircuitFailure();
        } else {
          this.consecutiveFailures = 0;
        }

        return {
          statusCode: response.statusCode
        };
      } catch (error) {
        if (signal?.aborted) {
          throw new ResilientHttpError({
            code: "TIMEOUT",
            correlationId: input.correlationId,
            requestId: input.requestId,
            message: `HTTP request timed out after ${input.timeoutMs}ms`
          });
        }

        throw new ResilientHttpError({
          code: "TRANSPORT",
          correlationId: input.correlationId,
          requestId: input.requestId,
          message: "HTTP transport request failed"
        });
      }
    }

    throw new Error("unreachable");
  }

  private recordCircuitFailure(): void {
    if (this.circuitBreaker === undefined) {
      return;
    }

    this.consecutiveFailures += 1;
    if (this.consecutiveFailures >= this.circuitBreaker.failureThreshold) {
      this.circuitOpen = true;
    }
  }
}
