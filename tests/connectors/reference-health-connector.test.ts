import { describe, expect, it, vi } from "vitest";
import { ReferenceHealthConnector } from "../../src/connectors/ReferenceHealthConnector.js";

describe("ReferenceHealthConnector", () => {
  it("checks the configured health endpoint through the integration adapter", async () => {
    const request = vi.fn().mockResolvedValue({ statusCode: 204 });
    const connector = new ReferenceHealthConnector({
      baseUrl: "https://example.test/api/v1",
      adapter: { request }
    });

    const result = await connector.checkHealth({
      correlationId: "corr-int16-001"
    });

    expect(result).toEqual({ statusCode: 204 });
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith({
      url: "https://example.test/api/v1/health",
      method: "GET",
      correlationId: "corr-int16-001"
    });
  });
});
