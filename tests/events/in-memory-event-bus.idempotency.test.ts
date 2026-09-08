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
});
