import type { ControlledEvent } from "./ControlledEvent.js";

export type ControlledEventHandler = (
  event: ControlledEvent
) => Promise<void> | void;

type RetryOptions = {
  maxAttempts: number;
  backoffMs: number;
};

type IdempotencyOptions = {
  enabled: boolean;
};

type DeadLetterOptions = {
  enabled: boolean;
};

type InMemoryEventBusOptions = {
  retry?: RetryOptions;
  idempotency?: IdempotencyOptions;
  deadLetter?: DeadLetterOptions;
};

export type DeadLetterEntry = {
  event: ControlledEvent;
  attempts: number;
  errorMessage: string;
};

export class InMemoryEventBus {
  private readonly handlers = new Map<string, ControlledEventHandler[]>();
  private readonly processedEventIds = new Set<string>();
  private readonly inFlightEventPublications = new Map<string, Promise<void>>();
  private readonly deadLetters: DeadLetterEntry[] = [];

  constructor(private readonly options: InMemoryEventBusOptions = {}) {
    const retry = options.retry;
    if (
      retry &&
      (!Number.isInteger(retry.maxAttempts) ||
        retry.maxAttempts < 1 ||
        !Number.isFinite(retry.backoffMs) ||
        retry.backoffMs < 0)
    ) {
      throw new Error("Invalid retry configuration");
    }
  }

  subscribe(eventType: string, handler: ControlledEventHandler): void {
    const current = this.handlers.get(eventType) ?? [];
    current.push(handler);
    this.handlers.set(eventType, current);
  }

  getDeadLetters(): readonly DeadLetterEntry[] {
    return [...this.deadLetters];
  }

  async publish(event: ControlledEvent): Promise<void> {
    if (!this.options.idempotency?.enabled) {
      await this.deliver(event);
      return;
    }

    if (this.processedEventIds.has(event.id)) {
      return;
    }

    const inFlight = this.inFlightEventPublications.get(event.id);
    if (inFlight) {
      await inFlight;
      return;
    }

    const publication = this.deliver(event)
      .then(() => {
        this.processedEventIds.add(event.id);
      })
      .finally(() => {
        this.inFlightEventPublications.delete(event.id);
      });

    this.inFlightEventPublications.set(event.id, publication);
    await publication;
  }

  private async deliver(event: ControlledEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) ?? [];

    try {
      await Promise.all(handlers.map(async (handler) => this.runHandler(handler, event)));
    } catch (error) {
      if (this.options.deadLetter?.enabled) {
        this.deadLetters.push({
          event,
          attempts: this.options.retry?.maxAttempts ?? 1,
          errorMessage: error instanceof Error ? error.message : "Event delivery failed"
        });
      }

      throw error;
    }
  }

  private async runHandler(
    handler: ControlledEventHandler,
    event: ControlledEvent
  ): Promise<void> {
    const maxAttempts = this.options.retry?.maxAttempts ?? 1;
    const backoffMs = this.options.retry?.backoffMs ?? 0;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await handler(event);
        return;
      } catch (error) {
        if (attempt >= maxAttempts) {
          throw error;
        }

        if (backoffMs > 0) {
          await new Promise<void>((resolve) => setTimeout(resolve, backoffMs));
        }
      }
    }
  }
}
