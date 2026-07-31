# ReBuild Loop ADK agent

This standalone TypeScript agent uses the
[Google Agent Development Kit for TypeScript](https://adk.dev/get-started/typescript/)
with Gemini. It explains preliminary material proposals and calls a deterministic
decision-gate tool before recommending the next human action.

It does not replace the existing image-analysis worker. It has no database, object-storage, authentication, or write access, so running it cannot change project records.

## Flow

1. The `LlmAgent` receives a material proposal, its unknowns, and its risk flags.
2. The agent calls the `check_decision_gate` `FunctionTool`.
3. The deterministic tool returns `REQUEST_EVIDENCE`,
   `SEND_TO_SPECIALIST`, or `READY_FOR_HUMAN_REVIEW`.
4. The agent explains the result in plain English.
5. A named person makes the decision.

The tool never approves reuse or certifies safety.

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

The installed ADK versions are pinned in [`package.json`](package.json). Use the
[official ADK TypeScript repository](https://github.com/google/adk-js) and
documentation when reviewing an upgrade.
