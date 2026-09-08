import { describe, expect, it } from "vitest";
import type { ControlledEvent } from "../../src/events/ControlledEvent.js";
import { InMemoryEventBus } from "../../src/events/InMemoryEventBus.js";

describe("InMemoryEventBus", () => {
  it("publishes a controlled event to a subscriber by event type", async () => {
    const bus = new InMemoryEventBus();
    const received: ControlledEvent[] = [];

    bus.subscribe("customer.context.requested", async (event) => {
      received.push(event);
    });

    const event: ControlledEvent = {
      id: "evt-int07-001",
      correlationId: "corr-int07-001",
      tenantId: "tenant-001",
      source: "dispatch",
      destination: "crm",
      type: "customer.context.requested",
      version: "1.0",
      timestamp: "2026-09-08T01:10:00.000Z",
      payload: { customerId: "42" }
    };

    await bus.publish(event);

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(event);
  });
});
