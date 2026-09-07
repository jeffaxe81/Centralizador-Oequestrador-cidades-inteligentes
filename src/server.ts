import { buildApp } from "./app/buildApp.js";
import { loadEnv } from "./config/env.js";

const env = loadEnv();
const app = buildApp({ env });

await app.listen({ host: "0.0.0.0", port: env.PORT });
