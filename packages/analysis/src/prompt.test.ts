import { afterEach, describe, expect, test, vi } from "vitest";

import {
  ANALYSIS_RESPONSE_JSON_SCHEMA,
  analyzeEvidenceWithGemini,
} from "./prompt.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Gemini evidence analysis transport", () => {
  test("uses the supported Gemini 3.6 structured-output request shape", async () => {
    let requestBody: Record<string, unknown> | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
        requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: { parts: [{ text: '{"candidates":[]}' }] },
                finishReason: "STOP",
              },
            ],
            responseId: "response-1",
          }),
          {
            headers: { "Content-Type": "application/json" },
            status: 200,
          },
        );
      }),
    );

    await analyzeEvidenceWithGemini({
      apiKey: "test-key",
      evidence: [
        {
          assetId: "00000000-0000-4000-8000-000000000000",
          base64: "AA==",
          mimeType: "image/jpeg",
        },
      ],
      model: "gemini-3.6-flash",
    });

    const generationConfig = requestBody?.generationConfig as
      Record<string, unknown> | undefined;
    expect(generationConfig).toEqual({
      responseJsonSchema: ANALYSIS_RESPONSE_JSON_SCHEMA,
      responseMimeType: "application/json",
    });
    expect(generationConfig).not.toHaveProperty("temperature");
    expect(
      (
        ANALYSIS_RESPONSE_JSON_SCHEMA.properties.candidates as Record<
          string,
          unknown
        >
      ).maxItems,
    ).toBeUndefined();
  });
});
