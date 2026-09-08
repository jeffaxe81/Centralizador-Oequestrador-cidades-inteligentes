export type ConnectorHealth = {
  status: "healthy" | "unhealthy";
};

export interface Connector<TConfig, TInput, TOutput> {
  readonly id: string;
  readonly version: string;
  readonly capabilities: readonly string[];

  connect(): Promise<void>;
  disconnect(): Promise<void>;
  health(): Promise<ConnectorHealth>;
  execute(input: TInput): Promise<TOutput>;
  validateConfig(config: TConfig): boolean;
}
