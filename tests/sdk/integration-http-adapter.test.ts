import { describe, expect, it, vi } from "vitest";
import { IntegrationHttpAdapter } from "../../src/sdk/IntegrationHttpAdapter.js";

describe("IntegrationHttpAdapter", () => {
  it("combines caller and auth headers and delegates the request", async () => {
    const request = vi.fn().mockResolvedValue({ statusCode: 204 });
    const authHeaders = vi.fn().mockReturnValue({ "x-api-key": "secret" });

    const adapter = new IntegrationHttpAdapter({
      httpClient: { request },
      auth: { headers: authHeaders }
    });

    const response = await adapter.request({
      url: "https://example.test/api/v1/resource",
      method: "GET",
      correlationId: "corr-int15-001",
      headers: { "x-tenant-id": "tenant-a" }
    });

    expect(response).toEqual({ statusCode: 204 });
    expect(authHeaders).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith({
      url: "https://example.test/api/v1/resource",
      method: "GET",
      correlationId: "corr-int15-001",
      headers: {
        "x-tenant-id": "tenant-a",
        "x-api-key": "secret"
      }
    });
  });
});
