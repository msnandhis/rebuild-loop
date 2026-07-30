import {
  apiProblem,
  getApiUser,
  isUuid,
} from "../../../../../../../../lib/api";
import { findOwnedProject } from "../../../../../../../../lib/projects";
import { findCurrentRecoveryPlan } from "../../../../../../../../lib/recovery";

export async function GET(
  request: Request,
  context: { params: Promise<{ planId: string; projectId: string }> },
) {
  const correlationId = crypto.randomUUID();
  const user = await getApiUser(request);
  if (!user) {
    return apiProblem(
      401,
      "Sign in to print the recovery pack.",
      correlationId,
    );
  }
  const { planId, projectId } = await context.params;
  if (!isUuid(projectId) || !isUuid(planId)) {
    return apiProblem(404, "Approved recovery pack not found.", correlationId);
  }
  const project = await findOwnedProject(projectId, user.id);
  if (!project) {
    return apiProblem(404, "Approved recovery pack not found.", correlationId);
  }

  const plan = await findCurrentRecoveryPlan(projectId, user.id);
  if (!plan || plan.id !== planId) {
    return apiProblem(404, "Approved recovery pack not found.", correlationId);
  }
  if (plan.status !== "APPROVED") {
    return apiProblem(
      409,
      "Named human approval is required before printing.",
      correlationId,
      "PRINT_REQUIRES_APPROVAL",
    );
  }

  return new Response(renderPrintDocument(project, plan), {
    headers: {
      "Cache-Control": "no-store, private",
      "Content-Disposition": `inline; filename="${safeFilename(project.code)}-recovery-pack.html"`,
      "Content-Security-Policy":
        "default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'self'",
      "Content-Type": "text/html; charset=utf-8",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function renderPrintDocument(
  project: {
    code: string;
    locationText: string;
    name: string;
    siteName: string;
    type: string;
  },
  plan: NonNullable<Awaited<ReturnType<typeof findCurrentRecoveryPlan>>>,
) {
  const approvalDate = plan.approvedAt
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      }).format(plan.approvedAt)
    : "";
  const rows = plan.items
    .map(
      (item) => `
        <tr>
          <td class="mono">${String(item.sequence).padStart(2, "0")}</td>
          <td><strong>${escapeHtml(item.subtype ?? label(item.materialFamily))}</strong><br><span class="mono muted">${escapeHtml(item.lotCode)}</span></td>
          <td>${escapeHtml(label(item.pathway))}</td>
          <td>${item.instructions.map(escapeHtml).join("<br>")}</td>
          <td>${item.risks.length ? item.risks.map(escapeHtml).join("<br>") : "No unresolved control recorded."}</td>
        </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(project.code)} recovery pack</title>
  <style>
    :root { --ink:#12131a; --muted:#52545e; --rule:#8b8d96; --paper:#fff; --wash:#f6f6f7; --verified:#087a55; }
    * { box-sizing:border-box; }
    body { margin:0; background:var(--paper); color:var(--ink); font:14px/1.55 Arial,sans-serif; }
    main { margin:0 auto; max-width:1100px; padding:32px; }
    h1 { font-size:32px; line-height:1.15; margin:8px 0 12px; }
    h2 { font-size:18px; margin:28px 0 10px; }
    p { margin:0; }
    .mono { font-family:"Courier New",monospace; font-size:12px; }
    .muted { color:var(--muted); }
    .header { border-bottom:2px solid var(--ink); padding-bottom:20px; }
    .meta { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin:20px 0; border:1px solid var(--rule); padding:16px; }
    .meta dt { color:var(--muted); font-size:11px; text-transform:uppercase; }
    .meta dd { margin:3px 0 0; font-weight:700; }
    table { width:100%; border-collapse:collapse; table-layout:fixed; }
    th,td { border:1px solid var(--rule); padding:10px; text-align:left; vertical-align:top; overflow-wrap:anywhere; }
    th { background:var(--wash); font-size:11px; text-transform:uppercase; }
    th:nth-child(1){width:6%} th:nth-child(2){width:19%} th:nth-child(3){width:15%} th:nth-child(4){width:32%} th:nth-child(5){width:28%}
    .approval { margin-top:24px; border:2px solid var(--verified); padding:16px; }
    .notice { margin-top:24px; border-left:4px solid var(--rule); padding:10px 14px; color:var(--muted); }
    @media print {
      main { max-width:none; padding:0; }
      @page { margin:14mm; size:A4 landscape; }
      tr { break-inside:avoid; }
    }
    @media (max-width:700px) {
      main { padding:20px; }
      .meta { grid-template-columns:1fr; }
      .table-wrap { overflow-x:auto; }
      table { min-width:900px; }
    }
  </style>
</head>
<body>
<main>
  <header class="header">
    <p class="mono">${escapeHtml(project.code)} / APPROVED REVISION ${String(plan.revisionNumber).padStart(2, "0")}</p>
    <h1>${escapeHtml(project.name)}</h1>
    <p class="muted">Preliminary, evidence-led recovery plan. Not a professional certification.</p>
  </header>
  <dl class="meta">
    <div><dt>Site</dt><dd>${escapeHtml(project.siteName)}</dd></div>
    <div><dt>Location</dt><dd>${escapeHtml(project.locationText)}</dd></div>
    <div><dt>Project type</dt><dd>${escapeHtml(label(project.type))}</dd></div>
  </dl>
  <h2>Selective deconstruction sequence</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Seq.</th><th>Material lot</th><th>Pathway</th><th>Removal instruction</th><th>Risk / control</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
  <section class="approval">
    <strong>Named human approval recorded</strong>
    <p>${escapeHtml(plan.approvedBy ?? userFallback())} · ${escapeHtml(approvalDate)}</p>
    <p class="mono muted">Source ${escapeHtml(plan.sourceHash)}</p>
  </section>
  <p class="notice">This pack records preliminary recovery planning. A qualified professional must resolve safety-critical unknowns and approve reuse in its actual project context.</p>
</main>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character] ?? character;
  });
}

function label(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

function safeFilename(value: string) {
  return value.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
}

function userFallback() {
  return "Project owner";
}
