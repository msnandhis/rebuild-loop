# ReBuild Loop ADK agent

This standalone TypeScript agent uses Google Agent Development Kit with Gemini. It explains preliminary material proposals and calls a deterministic decision-gate tool before recommending the next human action.

It does not replace the existing image-analysis worker. It has no database, object-storage, authentication, or write access, so running it cannot change project records.

## Run

From the repository root, set `GEMINI_API_KEY` in your environment, then use:

```bash
pnpm adk:run
```

For the ADK development interface:

```bash
pnpm adk:web
```

ADK Web is for local development and debugging only.
