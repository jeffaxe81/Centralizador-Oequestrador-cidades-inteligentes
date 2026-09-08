export interface CommunicationEnvelope<TPayload> {
  readonly id: string;
  readonly correlationId: string;
  readonly tenantId: string;
  readonly source: string;
  readonly destination: string;
  readonly type: string;
  readonly version: string;
  readonly timestamp: string;
  readonly payload: TPayload;
}
