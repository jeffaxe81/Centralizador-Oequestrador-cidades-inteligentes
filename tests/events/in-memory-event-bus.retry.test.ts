import { describe, expect, it } from "vitest";
import type { ControlledEvent } from "../../src/events/ControlledEvent.js";
import { InMemoryEventBus } from "../../src/events/InMemoryEventBus.js";

function controlledEvent(id: string): ControlledEvent {
  return {
    id,
    correlationId: `corr-${id}`,
    tenantId: "tenant-001",
    source: "dispatch",
    destination: "crm",
    type: "customer.context.requested",
    version: "1.0",
    timestamp: "2026-09-08T01:20:00.000Z",
    payload: { customerId: "42" }
  };
}

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

    await expect(bus.publish(controlledEvent("evt-int08-001"))).resolves.toBeUndefined();
    expect(attempts).toBe(3);
  });

  it("propagates the handler failure after max attempts are exhausted", async () => {
    const bus = new InMemoryEventBus({
      retry: {
        maxAttempts: 3,
        backoffMs: 1
      }
    });
    let attempts = 0;

    bus.subscribe("customer.context.requested", async () => {
      attempts += 1;
      throw new Error("permanent failure");
    });

    await expect(bus.publish(controlledEvent("evt-int08-002"))).rejects.toThrow(
      "permanent failure"
    );
    expect(attempts).toBe(3);
  });

  it("fails fast when retry configuration is invalid", () => {
    expect(
      () =>
        new InMemoryEventBus({
          retry: {
            maxAttempts: 0,
            backoffMs: -1
          }
        })
    ).toThrow("Invalid retry configuration");
  });
});