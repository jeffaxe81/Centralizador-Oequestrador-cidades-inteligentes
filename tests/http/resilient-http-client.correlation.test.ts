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

describe("ResilientHttpClient correlation propagation", () => {
  it("sends the correlation id on outbound requests", async () => {
    let receivedCorrelationId: string | undefined;

    const server = createServer((request, response) => {
      receivedCorrelationId = request.headers["x-correlation-id"] as string | undefined;
      response.writeHead(204);
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
      url: `http://127.0.0.1:${address.port}/ping`,
      method: "GET",
      correlationId: "corr-123"
    });

    expect(result.statusCode).toBe(204);
    expect(receivedCorrelationId).toBe("corr-123");
  });
});
