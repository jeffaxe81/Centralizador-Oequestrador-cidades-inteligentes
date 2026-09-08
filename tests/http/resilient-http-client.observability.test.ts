import { createServer } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { ResilientHttpClient } from "../../src/http/ResilientHttpClient.js";

const servers: ReturnType<typeof createServer>[] = [];

afterEach(async () => {
  await Promise.all(
    servers.map(
      (server) =>
        new Promise<void>((resolve) => {
          server.close(() => resolve());
        })
    )
  );
  servers.length = 0;
});

describe("ResilientHttpClient observability", () => {
  it("logs circuit opened and blocked events with correlation id", async () => {
    const events: Array<{ event: string; correlationId: string }> = [];
    const server = createServer((_req, res) => {
      res.statusCode = 503;
      res.end();
    });
    servers.push(server);

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (address === null || typeof address === "string") {
      throw new Error("Expected TCP address");
    }

    const client = new ResilientHttpClient({
      logger: {
        info(event) {
          events.push({ event: event.event, correlationId: event.correlationId });
        }
      },
      circuitBreaker: { failureThreshold: 1 }
    });
    const input = {
      url: `http://127.0.0.1:${address.port}/health`,
      method: "GET" as const,
      correlationId: "corr-int13-001"
    };

    expect((await client.request(input)).statusCode).toBe(503);
    await expect(client.request(input)).rejects.toMatchObject({ code: "CIRCUIT_OPEN" });

    expect(events).toEqual([
      { event: "http.request", correlationId: "corr-int13-001" },
      { event: "http.circuit_opened", correlationId: "corr-int13-001" },
      { event: "http.circuit_blocked", correlationId: "corr-int13-001" }
    ]);
  });
});
