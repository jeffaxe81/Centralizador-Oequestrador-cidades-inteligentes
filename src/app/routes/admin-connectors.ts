import type { FastifyInstance } from "fastify";

export type AdminConnectorSummary = {
  name: string;
  type: string;
  status: string;
};

export async function registerAdminConnectorRoutes(
  app: FastifyInstance,
  options: { connectors: readonly AdminConnectorSummary[] }
): Promise<void> {
  app.get("/api/v1/admin/connectors", async () => ({
    connectors: options.connectors.map((connector) => ({ ...connector }))
  }));
}
