export class ApiKeyAuthHeaders {
  constructor(private readonly apiKey: string) {}

  headers(): Record<string, string> {
    return {
      "x-api-key": this.apiKey
    };
  }
}
