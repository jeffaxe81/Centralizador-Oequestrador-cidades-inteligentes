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
    timestamp: "2026-09-08T05:35:00.000Z",
    payload: { customerId: "42" }
  };
}

describe("InMemoryEventBus DLQ/quarantine", () => {
  it("quarantines an event after handler retries are exhausted", async () => {
    const bus = new InMemoryEventBus({
      retry: { maxAttempts: 2, backoffMs: 0 },
      deadLetter: { enabled: true }
    });

    bus.subscribe("customer.context.requested", async () => {
      throw new Error("upstream unavailable");
    });

    const event = controlledEvent("evt-int10-001");

    await expect(bus.publish(event)).rejects.toThrow("upstream unavailable");

    expect(bus.getDeadLetters()).toEqual([
      {
        event,
        attempts: 2,
        errorMessage: "upstream unavailable"
      }
    ]);
  });
});
