import { describe, expect, it } from "vitest";
import { buildApp } from "../../src/app/buildApp.js";

describe("health endpoints", () => {
  it("reports liveness and readiness", async () => {
    const app = buildApp({
      env: {
        NODE_ENV: "test",
        PORT: 3000,
        LOG_LEVEL: "silent"
      }
    });

    const live = await app.inject({ method: "GET", url: "/health/live" });
    expect(live.statusCode).toBe(200);
    expect(live.json()).toEqual({ status: "ok" });

    const ready = await app.inject({ method: "GET", url: "/health/ready" });
    expect(ready.statusCode).toBe(200);
    expect(ready.json()).toEqual({ status: "ready" });

    await app.close();
  });
});
