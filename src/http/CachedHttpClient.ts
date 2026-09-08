import {
  ResilientHttpClient,
  ResilientHttpError,
  type ResilientHttpRequest,
  type ResilientHttpResponse
} from "./ResilientHttpClient.js";

export type CachedHttpRequest = ResilientHttpRequest & {
  cacheKey: string;
};

export class CachedHttpClient {
  private readonly cache = new Map<string, ResilientHttpResponse>();

  constructor(private readonly client: ResilientHttpClient) {}

  async request(input: CachedHttpRequest): Promise<ResilientHttpResponse> {
    try {
      const response = await this.client.request(input);

      if (
        input.method === "GET" &&
        response.statusCode >= 200 &&
        response.statusCode < 300
      ) {
        this.cache.set(input.cacheKey, response);
      }

      return response;
    } catch (error) {
      if (
        error instanceof ResilientHttpError &&
        error.code === "CIRCUIT_OPEN" &&
        input.method === "GET"
      ) {
        const cached = this.cache.get(input.cacheKey);
        if (cached !== undefined) {
          return cached;
        }
      }

      throw error;
    }
  }
}
