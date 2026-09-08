export class ApiKeyAuthHeaders {
  constructor(private readonly apiKey: string) {
    if (apiKey.trim().length === 0) {
      throw new Error("Invalid API key configuration");
    }
  }

  headers(): Record<string, string> {
    return {
      "x-api-key": this.apiKey
    };
  }
}
