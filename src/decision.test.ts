import { describe, expect, it } from "vitest";
import {
  buildNotebookSummary,
  createDecisionMemo,
  fixtureProfiles,
  recommend,
  scoreOperationalRisk,
  type WorkloadProfile
} from "./decision";

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

  it("keeps high-write long-running workloads on the persistence-first path", () => {
    const mixedWorkload: WorkloadProfile = {
      ...fixtureProfiles[2],
      kind: "scheduled",
      writeFrequency: "high",
      dataRetentionDays: 730
    };

    const result = recommend(mixedWorkload);

    expect(result.recommendation).toBe("Managed Database");
    expect(result.rejectedOptions.some((option) => option.option === "Background Job")).toBe(true);
  });

  it("keeps moderate interactive review work on serverless until persistence pressure is proven", () => {
    const result = recommend(fixtureProfiles[1]);
    expect(result.recommendation).toBe("Serverless Functions");
    expect(result.rejectedOptions.some((option) => option.option === "Managed Database")).toBe(true);
  });

  it("scores the high-write audit trail as the riskiest profile", () => {
    const scores = fixtureProfiles.map((profile) => ({
      id: profile.id,
      score: scoreOperationalRisk(profile)
    }));

    expect(scores.sort((a, b) => b.score - a.score)[0]).toMatchObject({ id: "ops-audit-trail" });
  });

  it("builds reviewer-ready memos with evidence and rejected-option context", () => {
    const result = recommend(fixtureProfiles[3]);
    const memo = createDecisionMemo(fixtureProfiles[3], result);

    expect(memo.headline).toContain("choose Managed Database");
    expect(memo.markdown).toContain("Cost band: $25-$100 synthetic planning band, not a live vendor quote.");
    expect(memo.markdown).toContain("Reject Static Site");
    expect(memo.reviewQuestions).toHaveLength(3);
  });

  it("summarizes the notebook with the next highest-risk review action", () => {
    const summary = buildNotebookSummary();

    expect(summary.highConfidenceCount).toBe(3);
    expect(summary.totalEvidenceItems).toBe(12);
    expect(summary.highestRiskProfile).toBe("Ops audit trail");
    expect(summary.nextReviewAction).toContain("pilot expansion");
  });

  it("returns an explicit empty summary instead of throwing on missing fixtures", () => {
    const summary = buildNotebookSummary([]);

    expect(summary.entries).toHaveLength(0);
    expect(summary.highestRiskProfile).toBe("No profiles");
    expect(summary.nextReviewAction).toContain("Add at least one synthetic workload");
  });
});
