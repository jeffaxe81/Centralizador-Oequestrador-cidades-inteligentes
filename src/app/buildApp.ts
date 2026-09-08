import Fastify, { type FastifyInstance } from "fastify";
import type { AppEnv } from "../config/env.js";
import { loadEnv } from "../config/env.js";
import { registerHealthRoutes } from "./routes/health.js";

export function buildApp(options: { env?: AppEnv } = {}): FastifyInstance {
  const env = options.env ?? loadEnv();
  const app = Fastify({
    logger: env.LOG_LEVEL === "silent" ? false : { level: env.LOG_LEVEL }
  });

  void app.register(registerHealthRoutes);
  return app;
}
