import { createServer } from "node:http";

import { getSqlClient, pingDatabase } from "@rebuild/db";
import type { ServiceHealth } from "@rebuild/kernel";
import {
  createInternalS3Client,
  ensurePrivateBucket,
  readStorageConfig,
} from "@rebuild/storage";

import { readWorkerConfig } from "./config.js";
import { analyzeProject } from "./tasks/analyze-project.js";
import { verifyUpload } from "./tasks/verify-upload.js";

const config = readWorkerConfig();
let ready = false;
let stopping = false;

const server = createServer((request, response) => {
  if (request.url !== "/health/live" && request.url !== "/health/ready") {
    response.writeHead(404, { "Content-Type": "application/problem+json" });
    response.end(
      JSON.stringify({ status: 404, title: "Not found", type: "about:blank" }),
    );
    return;
  }

  const readinessRequest = request.url === "/health/ready";
  const health: ServiceHealth = {
    checkedAt: new Date().toISOString(),
    service: "worker",
    state: readinessRequest && !ready ? "degraded" : "ok",
    version: process.env.npm_package_version ?? "0.1.0",
  };
  response.writeHead(readinessRequest && !ready ? 503 : 200, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json",
  });
  response.end(JSON.stringify(health));
});

server.listen(config.WORKER_HEALTH_PORT, "0.0.0.0", () => {
  process.stdout.write(
    JSON.stringify({
      environment: config.APP_ENV,
      level: "info",
      message: "worker control plane listening",
      port: config.WORKER_HEALTH_PORT,
    }) + "\n",
  );
});

await pingDatabase();
const storage = readStorageConfig();
await ensurePrivateBucket(
  createInternalS3Client(storage),
  storage.bucket,
  new URL(config.APP_URL).origin,
);
await recoverStaleJobs();
ready = true;
void workLoop();

async function workLoop(): Promise<void> {
  while (!stopping) {
    const job = await claimJob();
    if (!job) {
      await wait(750);
      continue;
    }

    try {
      if (job.task === "verify_upload") {
        await verifyUpload(job.payload);
      } else if (job.task === "analyze_project") {
        await analyzeProject(job.payload);
      } else {
        throw new Error("UNKNOWN_TASK");
      }
      await markJobSucceeded(job.id);
    } catch (error) {
      await markJobFailed(job, error);
    }
  }
}

interface ClaimedJob {
  attempts: number;
  id: string;
  max_attempts: number;
  payload: unknown;
  task: string;
}

async function claimJob(): Promise<ClaimedJob | null> {
  const sql = getSqlClient();
  const [job] = await sql<ClaimedJob[]>`
    with next_job as (
      select id
      from workflow_jobs
      where status = 'QUEUED' and run_at <= now()
      order by run_at, created_at
      for update skip locked
      limit 1
    )
    update workflow_jobs jobs
    set status = 'RUNNING',
        locked_at = now(),
        attempts = jobs.attempts + 1,
        updated_at = now()
    from next_job
    where jobs.id = next_job.id
    returning jobs.id, jobs.task, jobs.payload, jobs.attempts, jobs.max_attempts
  `;
  return job ?? null;
}

async function markJobSucceeded(jobId: string): Promise<void> {
  const sql = getSqlClient();
  await sql`
    update workflow_jobs
    set status = 'SUCCEEDED', locked_at = null, updated_at = now()
    where id = ${jobId}::uuid
  `;
}

async function markJobFailed(job: ClaimedJob, error: unknown): Promise<void> {
  const sql = getSqlClient();
  const retry = job.attempts < job.max_attempts;
  const delaySeconds = Math.min(30, 2 ** job.attempts);
  const nextRun = new Date(Date.now() + delaySeconds * 1_000);
  const code =
    error instanceof Error
      ? error.message.replace(/[^A-Z0-9_:-]/gi, "_").slice(0, 80)
      : "UNKNOWN_ERROR";

  await sql`
    update workflow_jobs
    set status = ${retry ? "QUEUED" : "FAILED"}::workflow_job_status,
        run_at = ${nextRun},
        locked_at = null,
        last_error_code = ${code},
        updated_at = now()
    where id = ${job.id}::uuid
  `;
}

async function recoverStaleJobs(): Promise<void> {
  const sql = getSqlClient();
  await sql`
    update workflow_jobs
    set status = 'QUEUED', locked_at = null, run_at = now(), updated_at = now()
    where status = 'RUNNING'
      and locked_at < now() - interval '5 minutes'
  `;
}

async function shutdown(signal: string) {
  ready = false;
  stopping = true;
  process.stdout.write(
    JSON.stringify({ level: "info", message: "worker stopping", signal }) +
      "\n",
  );
  server.close((error?: Error) => {
    process.exitCode = error ? 1 : 0;
  });
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
