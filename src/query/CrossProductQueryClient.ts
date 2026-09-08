import {
  ResilientHttpClient,
  type ResilientHttpResponse
} from "../http/ResilientHttpClient.js";
import { ServiceRegistry } from "../registry/ServiceRegistry.js";

export type CrossProductQueryInput = {
  service: string;
  path: string;
  correlationId: string;
  requestId?: string;
};

export class CrossProductQueryClient {
  private readonly registry: ServiceRegistry;
  private readonly httpClient: ResilientHttpClient;

  constructor(options: {
    registry: ServiceRegistry;
    httpClient: ResilientHttpClient;
  }) {
    this.registry = options.registry;
    this.httpClient = options.httpClient;
  }

  query(input: CrossProductQueryInput): Promise<ResilientHttpResponse> {
    const baseUrl = this.registry.resolve(input.service);
    const url = new URL(input.path, `${baseUrl.replace(/\/$/, "")}/`).toString();

    return this.httpClient.request({
      url,
      method: "GET",
      correlationId: input.correlationId,
      requestId: input.requestId
    });
  }
}
