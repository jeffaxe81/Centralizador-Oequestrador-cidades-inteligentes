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

describe("ResilientHttpClient timeout", () => {
  it("aborts a request that exceeds its timeout", async () => {
    const server = createServer((_request, response) => {
      setTimeout(() => {
        response.writeHead(204);
        response.end();
      }, 100);
    });
    servers.push(server);

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected TCP server address");
    }

    const client = new ResilientHttpClient();

    await expect(
      client.request({
        url: `http://127.0.0.1:${address.port}/slow`,
        method: "GET",
        correlationId: "corr-timeout",
        timeoutMs: 20
      })
    ).rejects.toBeDefined();
  });
});
