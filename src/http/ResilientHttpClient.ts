import { request } from "undici";

export type RetryPolicy = {
  maxAttempts: number;
  backoffMs: number;
};

export type ResilientHttpRequest = {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  correlationId: string;
  timeoutMs?: number;
  retry?: RetryPolicy;
};

export type ResilientHttpResponse = {
  statusCode: number;
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

function delay(ms: number): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ResilientHttpClient {
  async request(input: ResilientHttpRequest): Promise<ResilientHttpResponse> {
    const signal = input.timeoutMs === undefined ? undefined : AbortSignal.timeout(input.timeoutMs);
    const signalOptions = signal === undefined ? {} : { signal };
    const maxAttempts = input.method === "GET" ? Math.max(1, input.retry?.maxAttempts ?? 1) : 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await request(input.url, {
          method: input.method,
          headers: {
            "x-correlation-id": input.correlationId
          },
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
