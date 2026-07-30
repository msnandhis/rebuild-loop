import "server-only";

import { auth } from "./auth";

export async function getApiUser(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

export function apiProblem(
  status: number,
  message: string,
  correlationId: string,
  code = "REQUEST_FAILED",
) {
  return Response.json(
    {
      correlationId,
      error: { code, message },
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/problem+json",
      },
      status,
    },
  );
}

export function apiJson(body: Record<string, unknown>, status = 200): Response {
  return Response.json(body, {
    headers: {
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
    status,
  });
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function readIdempotencyKey(request: Request): string | null {
  const value = request.headers.get("Idempotency-Key")?.trim() ?? "";
  return isUuid(value) ? value : null;
}
