import type { CommunicationEnvelope } from "../../src/contracts/CommunicationEnvelope.js";

type Payload = {
  eventId: string;
};

const envelope: CommunicationEnvelope<Payload> = {
  id: "evt-123",
  correlationId: "corr-123",
  tenantId: "tenant-001",
  source: "dispatch",
  destination: "crm",
  type: "dispatch.order.created",
  version: "1.0",
  timestamp: "2026-09-08T00:00:00.000Z",
  payload: {
    eventId: "order-123"
  }
};

void envelope;
