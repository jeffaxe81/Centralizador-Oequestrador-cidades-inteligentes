import type {
  IntegrationHttpClient,
  IntegrationHttpAdapter
} from "../sdk/IntegrationHttpAdapter.js";

export type ReferenceConnectorAdapter = Pick<IntegrationHttpAdapter, "request"> | IntegrationHttpClient;

export class ReferenceHealthConnector {
  private readonly baseUrl: string;
  private readonly adapter: ReferenceConnectorAdapter;

  constructor(options: {
    baseUrl: string;
    adapter: ReferenceConnectorAdapter;
  }) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.adapter = options.adapter;
  }

  checkHealth(input: { correlationId: string }): ReturnType<ReferenceConnectorAdapter["request"]> {
    return this.adapter.request({
      url: `${this.baseUrl}/health`,
      method: "GET",
      correlationId: input.correlationId
    });
  }
}
