import { z } from "zod";

export const controlledEventSchema = z.object({
  id: z.string().min(1),
  correlationId: z.string().min(1),
  tenantId: z.string().min(1),
  source: z.string().min(1),
  destination: z.string().min(1),
  type: z.string().min(1),
  version: z.string().min(1),
  timestamp: z.string().datetime(),
  payload: z.unknown()
});

export type ControlledEvent = z.infer<typeof controlledEventSchema>;

export function parseControlledEvent(input: unknown): ControlledEvent {
  return controlledEventSchema.parse(input);
}
