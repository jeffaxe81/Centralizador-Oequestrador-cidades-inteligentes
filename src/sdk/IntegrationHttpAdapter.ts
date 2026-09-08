import type {
  ResilientHttpRequest,
  ResilientHttpResponse
} from "../http/ResilientHttpClient.js";

export type IntegrationHttpClient = {
  request(input: ResilientHttpRequest): Promise<ResilientHttpResponse>;
};

export type AuthHeadersProvider = {
  headers(): Record<string, string>;
};

export class IntegrationHttpAdapter {
  private readonly httpClient: IntegrationHttpClient;
  private readonly auth: AuthHeadersProvider;

  constructor(options: {
    httpClient: IntegrationHttpClient;
    auth: AuthHeadersProvider;
  }) {
    this.httpClient = options.httpClient;
    this.auth = options.auth;
  }

  request(input: ResilientHttpRequest): Promise<ResilientHttpResponse> {
    return this.httpClient.request({
      ...input,
      headers: {
        ...(input.headers ?? {}),
        ...this.auth.headers()
      }
    });
  }
}
