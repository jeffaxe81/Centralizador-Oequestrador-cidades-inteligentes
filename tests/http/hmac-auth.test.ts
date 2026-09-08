import { describe, expect, it } from "vitest";
import { HmacAuthHeaders } from "../../src/http/HmacAuthHeaders.js";

describe("HmacAuthHeaders", () => {
  it("produces deterministic HMAC headers and changes signature when canonical inputs change", () => {
    const auth = new HmacAuthHeaders("service-hmac-secret");
    const base = {
      method: "GET" as const,
      url: "https://example.test/api/v1/health?debug=true",
      timestamp: "2026-09-08T12:00:00.000Z",
      correlationId: "corr-int14b-001"
    };

    const first = auth.headers(base);
    const second = auth.headers(base);

    expect(first).toEqual(second);
    expect(first["x-signature-timestamp"]).toBe(base.timestamp);
    expect(first["x-signature"]).toMatch(/^[a-f0-9]{64}$/);

    expect(auth.headers({ ...base, method: "POST" })["x-signature"]).not.toBe(first["x-signature"]);
    expect(auth.headers({ ...base, url: "https://example.test/api/v1/ready" })["x-signature"]).not.toBe(first["x-signature"]);
    expect(auth.headers({ ...base, timestamp: "2026-09-08T12:00:01.000Z" })["x-signature"]).not.toBe(first["x-signature"]);
    expect(auth.headers({ ...base, correlationId: "corr-int14b-002" })["x-signature"]).not.toBe(first["x-signature"]);
  });
});
