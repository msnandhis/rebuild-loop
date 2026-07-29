# Scalable Monorepo Blueprint

## Decision

Use a modular monolith with one independently deployed background worker. This creates enterprise-grade internal boundaries without adding premature service, network, and consistency overhead.

## Bounded contexts

| Context   | Owns                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------- |
| Projects  | Organizations, projects, sites, lifecycle, deadlines                                              |
| Evidence  | Uploads, media, BOQs, manifests, clarification requests                                           |
| Inventory | Analysis runs, immutable model outputs, candidates, evidence references, reviews, confirmed items |
| Recovery  | Pathway rules, demand matching, potential impact, plans, passports, exports                       |

Recovery may split later when matching, impact, or reporting gains independent ownership. Do not create a package per page or workflow screen.

## Target structure

```text
rebuild-loop/
├── apps/
│   ├── web/                 Next.js UI and Route Handlers
│   ├── worker/              Durable asynchronous tasks; no public API
│   └── evals/               Labelled AI evaluation datasets and reports
├── packages/
│   ├── modules/
│   │   ├── projects/
│   │   ├── evidence/
│   │   ├── inventory/
│   │   └── recovery/
│   ├── platform/
│   │   ├── ai/
│   │   ├── auth/
│   │   ├── db/
│   │   ├── jobs/
│   │   ├── observability/
│   │   └── storage/
│   └── shared/
│       ├── kernel/
│       ├── testing/
│       └── ui/
├── tooling/
│   ├── eslint/
│   └── typescript/
├── design-system/
├── docs/
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Module internals

```text
packages/modules/inventory/src/
├── domain/          Pure entities, value objects, policies, errors
├── application/     Commands, queries, ports, use cases
├── infrastructure/  Database/Gemini adapters implementing ports
├── contracts/       Zod boundary schemas
├── public.ts        Intentional public API
└── testing.ts       Explicit test helpers only
```

## Dependency direction

```text
apps → modules → shared kernel
apps/module infrastructure → platform adapters → shared kernel
```

- Platform packages never import business modules.
- Modules only consume another module through its documented public export.
- Broad business flow is Projects → Evidence → Inventory → Recovery.
- Browser code never imports modules, database code, auth internals, jobs, or server environment variables.
- `@rebuild/ui` contains reusable primitives, not ReBuild-specific workflow components.
- Prompts and candidate schemas belong to Inventory; the AI package is only a Gemini transport adapter.
- Recovery rules belong to Recovery; they never live in prompts.

## Composition

No dependency-injection framework. Explicit application factories in web and worker bootstrap the database, logger, repositories, Gemini gateway, storage, queue, and use cases. This keeps imports side-effect-free and tests easy to wire with in-memory adapters.

## Scale trigger

Extract a service only when a context has a separate team/owner, independent scaling or reliability needs, a stable API contract, and enough operational value to justify network failure modes. Package boundaries are the proving ground for future service boundaries.
