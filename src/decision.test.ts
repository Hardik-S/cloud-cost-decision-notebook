import { describe, expect, it } from "vitest";
import { fixtureProfiles, recommend } from "./decision";

describe("recommend", () => {
  it("keeps static fixture-only pages on the cheapest deploy path", () => {
    expect(recommend(fixtureProfiles[0]).recommendation).toBe("Static Site");
  });

  it("routes long-running scheduled work away from request-time functions", () => {
    const result = recommend(fixtureProfiles[2]);
    expect(result.recommendation).toBe("Background Job");
    expect(result.rejectedOptions.some((option) => option.option === "Serverless Functions")).toBe(true);
  });

  it("recommends managed persistence for high-write audit trails", () => {
    const result = recommend(fixtureProfiles[3]);
    expect(result.recommendation).toBe("Managed Database");
    expect(result.assumptions.join(" ")).toContain("Durable records");
  });
});
