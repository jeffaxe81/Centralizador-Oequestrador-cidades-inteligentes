import { createServer } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { ResilientHttpClient } from "../../src/http/ResilientHttpClient.js";
import { CrossProductQueryClient } from "../../src/query/CrossProductQueryClient.js";
import { ServiceRegistry } from "../../src/registry/ServiceRegistry.js";

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

describe("CrossProductQueryClient", () => {
  it("queries a product through its registered API endpoint", async () => {
    let receivedPath: string | undefined;
    let receivedCorrelationId: string | undefined;
    let receivedRequestId: string | undefined;

    const server = createServer((request, response) => {
      receivedPath = request.url;
      receivedCorrelationId = request.headers["x-correlation-id"] as string | undefined;
      receivedRequestId = request.headers["x-request-id"] as string | undefined;
      response.writeHead(204);
      response.end();
    });
    servers.push(server);

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected TCP server address");
    }

    const registry = new ServiceRegistry({
      crm: `http://127.0.0.1:${address.port}`
    });
    const client = new CrossProductQueryClient({
      registry,
      httpClient: new ResilientHttpClient()
    });

    const result = await client.query({
      service: "crm",
      path: "/api/v1/customers/42",
      correlationId: "corr-int05",
      requestId: "req-int05"
    });

    expect(result.statusCode).toBe(204);
    expect(receivedPath).toBe("/api/v1/customers/42");
    expect(receivedCorrelationId).toBe("corr-int05");
    expect(receivedRequestId).toBe("req-int05");
  });
});
