import { describe, expect, it } from "vitest";
import type { ControlledEvent } from "../../src/events/ControlledEvent.js";
import { InMemoryEventBus } from "../../src/events/InMemoryEventBus.js";

describe("InMemoryEventBus retry/backoff", () => {
  it("retries a failing async handler up to the configured max attempts", async () => {
    const bus = new InMemoryEventBus({
      retry: {
        maxAttempts: 3,
        backoffMs: 1
      }
    });
    let attempts = 0;

    bus.subscribe("customer.context.requested", async () => {
      attempts += 1;
      if (attempts < 3) {
        throw new Error("transient failure");
      }
    });

    const event: ControlledEvent = {
      id: "evt-int08-001",
      correlationId: "corr-int08-001",
      tenantId: "tenant-001",
      source: "dispatch",
      destination: "crm",
      type: "customer.context.requested",
      version: "1.0",
      timestamp: "2026-09-08T01:20:00.000Z",
      payload: { customerId: "42" }
    };

    await expect(bus.publish(event)).resolves.toBeUndefined();
    expect(attempts).toBe(3);
  });
});