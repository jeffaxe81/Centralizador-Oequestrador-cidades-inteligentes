import { describe, expect, it } from "vitest";
import { parseControlledEvent } from "../../src/events/ControlledEvent.js";

describe("controlled event", () => {
  it("accepts the required integration envelope", () => {
    const event = parseControlledEvent({
      id: "evt-123",
      correlationId: "corr-123",
      tenantId: "tenant-001",
      source: "dispatch",
      destination: "crm",
      type: "customer.context.requested",
      version: "1.0",
      timestamp: "2026-09-08T01:00:00.000Z",
      payload: { customerId: "42" }
    });

    expect(event.tenantId).toBe("tenant-001");
    expect(event.type).toBe("customer.context.requested");
  });

  it("fails closed when tenantId is missing or blank", () => {
    expect(() =>
      parseControlledEvent({
        id: "evt-124",
        correlationId: "corr-124",
        tenantId: "",
        source: "dispatch",
        destination: "crm",
        type: "customer.context.requested",
        version: "1.0",
        timestamp: "2026-09-08T01:00:00.000Z",
        payload: {}
      })
    ).toThrow();
  });
});
