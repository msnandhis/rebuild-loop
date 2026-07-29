import { describe, expect, it } from "vitest";

import { FOUNDATION_CASES } from "./dataset";

describe("foundation evaluation dataset", () => {
  it("covers every decision posture", () => {
    expect(
      new Set(FOUNDATION_CASES.map((item) => item.expectedAction)),
    ).toEqual(new Set(["propose", "request-evidence", "specialist-review"]));
  });
});
