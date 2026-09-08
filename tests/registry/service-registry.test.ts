import { describe, expect, it } from "vitest";
import { ServiceRegistry } from "../../src/registry/ServiceRegistry.js";

describe("ServiceRegistry", () => {
  it("resolves a service URL by logical name", () => {
    const registry = new ServiceRegistry({
      dispatch: "http://dispatch.internal:8080",
      crm: "http://crm.internal:8080",
      "event-engine": "http://event-engine.internal:8080",
      "signature-service": "http://signature-service.internal:8080"
    });

    expect(registry.resolve("dispatch")).toBe("http://dispatch.internal:8080");
    expect(registry.resolve("crm")).toBe("http://crm.internal:8080");
  });

  it("fails closed for an unknown logical service", () => {
    const registry = new ServiceRegistry({
      dispatch: "http://dispatch.internal:8080"
    });

    expect(() => registry.resolve("unknown-service")).toThrowError(
      /unknown service/i
    );
  });
});
