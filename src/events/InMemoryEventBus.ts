import type { ControlledEvent } from "./ControlledEvent.js";

export type ControlledEventHandler = (
  event: ControlledEvent
) => Promise<void> | void;

export class InMemoryEventBus {
  private readonly handlers = new Map<string, ControlledEventHandler[]>();

  subscribe(eventType: string, handler: ControlledEventHandler): void {
    const current = this.handlers.get(eventType) ?? [];
    current.push(handler);
    this.handlers.set(eventType, current);
  }

  async publish(event: ControlledEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) ?? [];
    await Promise.all(handlers.map(async (handler) => handler(event)));
  }
}
