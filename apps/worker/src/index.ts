import { createServer } from "node:http";

import type { ServiceHealth } from "@rebuild/kernel";

import { readWorkerConfig } from "./config.js";

const config = readWorkerConfig();

const server = createServer((request, response) => {
  if (request.url !== "/health/live" && request.url !== "/health/ready") {
    response.writeHead(404, { "Content-Type": "application/problem+json" });
    response.end(
      JSON.stringify({
        type: "about:blank",
        title: "Not found",
        status: 404,
      }),
    );
    return;
  }

  const health: ServiceHealth = {
    service: "worker",
    state: "ok",
    checkedAt: new Date().toISOString(),
    version: process.env.npm_package_version ?? "0.1.0",
  };

  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json",
  });
  response.end(JSON.stringify(health));
});

server.listen(config.WORKER_HEALTH_PORT, "0.0.0.0", () => {
  process.stdout.write(
    JSON.stringify({
      level: "info",
      message: "worker control plane ready",
      environment: config.APP_ENV,
      port: config.WORKER_HEALTH_PORT,
    }) + "\n",
  );
});

function shutdown(signal: string) {
  process.stdout.write(
    JSON.stringify({ level: "info", message: "worker stopping", signal }) +
      "\n",
  );
  server.close((error) => {
    process.exitCode = error ? 1 : 0;
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
