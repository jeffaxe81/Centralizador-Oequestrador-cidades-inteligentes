import { createServer } from "node:http";
import { describe, expect, it } from "vitest";
import {
  ResilientHttpClient,
  ResilientHttpError
} from "../../src/http/ResilientHttpClient.js";

describe("ResilientHttpClient transport errors", () => {
  it("normalizes a connection refusal", async () => {
    const server = createServer();

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected TCP server address");
    }

    const port = address.port;
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });

    const client = new ResilientHttpClient();

    await expect(
      client.request({
        url: `http://127.0.0.1:${port}/unavailable`,
        method: "GET",
        correlationId: "corr-transport",
        requestId: "req-transport"
      })
    ).rejects.toEqual(
      expect.objectContaining<Partial<ResilientHttpError>>({
        name: "ResilientHttpError",
        code: "TRANSPORT",
        correlationId: "corr-transport",
        requestId: "req-transport"
      })
    );
  });
});
