import { request } from "undici";

export type ResilientHttpRequest = {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  correlationId: string;
  timeoutMs?: number;
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

export class ResilientHttpClient {
  async request(input: ResilientHttpRequest): Promise<ResilientHttpResponse> {
    const signal = input.timeoutMs === undefined ? undefined : AbortSignal.timeout(input.timeoutMs);
    const signalOptions = signal === undefined ? {} : { signal };

    try {
      const response = await request(input.url, {
        method: input.method,
        headers: {
          "x-correlation-id": input.correlationId
        },
        ...signalOptions
      });

      await response.body.dump();

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
}
