export type ServiceRegistryEntries = Record<string, string>;

export class ServiceRegistry {
  private readonly entries: ServiceRegistryEntries;

  constructor(entries: ServiceRegistryEntries) {
    this.entries = { ...entries };
  }

  resolve(serviceName: string): string {
    const url = this.entries[serviceName];

    if (url === undefined) {
      throw new Error(`Unknown service: ${serviceName}`);
    }

    return url;
  }
}
