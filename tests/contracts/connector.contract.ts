import type { Connector } from "../../src/connectors/Connector.js";

type PingInput = { message: string };
type PingOutput = { echoed: string };

type TestConfig = {
  baseUrl: string;
};

const connector: Connector<TestConfig, PingInput, PingOutput> = {
  id: "test-connector",
  version: "1.0.0",
  capabilities: ["execute"],

  async connect() {},
  async disconnect() {},
  async health() {
    return { status: "healthy" };
  },
  async execute(input) {
    return { echoed: input.message };
  },
  validateConfig(config) {
    return config.baseUrl.length > 0;
  }
};

void connector;
