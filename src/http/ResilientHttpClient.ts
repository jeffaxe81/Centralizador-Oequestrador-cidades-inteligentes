import { request } from "undici";

export type ResilientHttpRequest = {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  correlationId: string;
};

export type ResilientHttpResponse = {
  statusCode: number;
};

export class ResilientHttpClient {
  async request(input: ResilientHttpRequest): Promise<ResilientHttpResponse> {
    const response = await request(input.url, {
      method: input.method,
      headers: {
        "x-correlation-id": input.correlationId
      }
    });

    await response.body.dump();

    return {
      statusCode: response.statusCode
    };
  }
}
