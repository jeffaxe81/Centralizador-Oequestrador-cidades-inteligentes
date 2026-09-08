import { createHmac } from "node:crypto";

export type HmacAuthInput = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  timestamp: string;
  correlationId: string;
};

export class HmacAuthHeaders {
  constructor(private readonly secret: string) {
    if (secret.trim().length === 0) {
      throw new Error("Invalid HMAC secret configuration");
    }
  }

  headers(input: HmacAuthInput): Record<string, string> {
    const url = new URL(input.url);
    const canonical = [input.method, url.pathname, input.timestamp, input.correlationId].join("\n");
    const signature = createHmac("sha256", this.secret).update(canonical).digest("hex");

    return {
      "x-signature": signature,
      "x-signature-timestamp": input.timestamp
    };
  }
}
