import { createServer } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { ApiKeyAuthHeaders } from "../../src/http/ApiKeyAuthHeaders.js";
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

describe("ApiKeyAuthHeaders", () => {
  it("adds x-api-key to the upstream request without exposing the secret in logs", async () => {
    const secret = "service-secret-int14a";
    let receivedApiKey: string | undefined;
    const events: unknown[] = [];

    const server = createServer((req, res) => {
      receivedApiKey = req.headers["x-api-key"] as string | undefined;
      res.statusCode = 204;
      res.end();
    });
    servers.push(server);

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (address === null || typeof address === "string") {
      throw new Error("Expected TCP address");
    }

    const auth = new ApiKeyAuthHeaders(secret);
    const client = new ResilientHttpClient({
      logger: {
        info(event) {
          events.push(event);
        }
      }
    });

    const response = await client.request({
      url: `http://127.0.0.1:${address.port}/secure`,
      method: "GET",
      correlationId: "corr-int14a-001",
      headers: auth.headers()
    });

    expect(response.statusCode).toBe(204);
    expect(receivedApiKey).toBe(secret);
    expect(JSON.stringify(events)).not.toContain(secret);
    expect(JSON.stringify(events)).toContain("[REDACTED]");
  });

  it("fails fast when the API key is empty", () => {
    expect(() => new ApiKeyAuthHeaders("")).toThrow(/invalid api key configuration/i);
  });
});
