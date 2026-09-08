import { createServer } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { CachedHttpClient } from "../../src/http/CachedHttpClient.js";
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

describe("CachedHttpClient fallback", () => {
  it("returns the last successful GET response when the circuit is open", async () => {
    let statusCode = 200;
    let requests = 0;
    const server = createServer((_req, res) => {
      requests += 1;
      res.statusCode = statusCode;
      res.end();
    });
    servers.push(server);

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (address === null || typeof address === "string") {
      throw new Error("Expected TCP address");
    }

    const resilient = new ResilientHttpClient({
      circuitBreaker: { failureThreshold: 1 }
    });
    const client = new CachedHttpClient(resilient);
    const input = {
      url: `http://127.0.0.1:${address.port}/health`,
      method: "GET" as const,
      correlationId: "corr-int12-001"
    };

    expect((await client.request(input)).statusCode).toBe(200);

    statusCode = 503;
    expect((await client.request(input)).statusCode).toBe(503);

    expect((await client.request(input)).statusCode).toBe(200);
    expect(requests).toBe(2);
  });
});
