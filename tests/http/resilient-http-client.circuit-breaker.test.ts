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

describe("ResilientHttpClient circuit breaker", () => {
  it("opens after consecutive retryable failures and blocks the next call", async () => {
    let requests = 0;
    const server = createServer((_req, res) => {
      requests += 1;
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
      circuitBreaker: { failureThreshold: 2 }
    });
    const input = {
      url: `http://127.0.0.1:${address.port}/health`,
      method: "GET" as const,
      correlationId: "corr-int11-001"
    };

    expect((await client.request(input)).statusCode).toBe(503);
    expect((await client.request(input)).statusCode).toBe(503);

    await expect(client.request(input)).rejects.toMatchObject({
      code: "CIRCUIT_OPEN"
    });
    expect(requests).toBe(2);
  });
});
