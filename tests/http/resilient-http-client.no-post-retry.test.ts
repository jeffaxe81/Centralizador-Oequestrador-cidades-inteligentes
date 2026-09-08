import { createServer } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { ResilientHttpClient } from "../../src/http/ResilientHttpClient.js";

const servers: Array<ReturnType<typeof createServer>> = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        })
    )
  );
});

describe("ResilientHttpClient retry safety", () => {
  it("does not retry POST automatically", async () => {
    let attempts = 0;

    const server = createServer((_request, response) => {
      attempts += 1;
      response.writeHead(503);
      response.end();
    });
    servers.push(server);

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected TCP server address");
    }

    const client = new ResilientHttpClient();
    const result = await client.request({
      url: `http://127.0.0.1:${address.port}/unsafe`,
      method: "POST",
      correlationId: "corr-post-no-retry",
      retry: {
        maxAttempts: 3,
        backoffMs: 1
      }
    });

    expect(result.statusCode).toBe(503);
    expect(attempts).toBe(1);
  });
});
