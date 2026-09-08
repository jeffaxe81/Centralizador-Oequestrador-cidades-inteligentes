import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { registerAdminConnectorRoutes } from "../../src/app/routes/admin-connectors.js";

describe("admin connector catalog", () => {
  it("lists configured connectors through a readonly endpoint", async () => {
    const app = Fastify();

    await app.register(registerAdminConnectorRoutes, {
      connectors: [
        { name: "reference-health", type: "http", status: "configured" },
        { name: "crm", type: "http", status: "configured" }
      ]
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/admin/connectors"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      connectors: [
        { name: "reference-health", type: "http", status: "configured" },
        { name: "crm", type: "http", status: "configured" }
      ]
    });
  });
});
