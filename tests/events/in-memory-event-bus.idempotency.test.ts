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
    timestamp: "2026-09-08T01:30:00.000Z",
    payload: { customerId: "42" }
  };
}

describe("InMemoryEventBus idempotency", () => {
  it("processes the same controlled event id only once", async () => {
    const bus = new InMemoryEventBus({ idempotency: { enabled: true } });
    let deliveries = 0;

    bus.subscribe("customer.context.requested", async () => {
      deliveries += 1;
    });

    const event = controlledEvent("evt-int09-001");

    await bus.publish(event);
    await bus.publish(event);

    expect(deliveries).toBe(1);
  });

  it("allows the same event id to be retried after a failed delivery", async () => {
    const bus = new InMemoryEventBus({ idempotency: { enabled: true } });
    let attempts = 0;

    bus.subscribe("customer.context.requested", async () => {
      attempts += 1;
      if (attempts === 1) {
        throw new Error("temporary failure");
      }
    });

    const event = controlledEvent("evt-int09-002");

    await expect(bus.publish(event)).rejects.toThrow("temporary failure");
    await expect(bus.publish(event)).resolves.toBeUndefined();
    await expect(bus.publish(event)).resolves.toBeUndefined();

    expect(attempts).toBe(2);
  });
});
