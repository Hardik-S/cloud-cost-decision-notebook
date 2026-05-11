import { describe, expect, it } from "vitest";
import {
  breakdownOperationalRisk,
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
    expect(result.supportingRequirements).toContainEqual({
      option: "Background Job",
      reason: "Long-running or scheduled work still needs an observable worker path beside managed persistence."
    });
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

  it("explains the risk score with stable factor rows for reviewer inspection", () => {
    const factors = breakdownOperationalRisk(fixtureProfiles[3]);

    expect(factors).toEqual([
      { label: "Write pressure", points: 3, reason: "High write frequency increases data-loss and consistency risk." },
      { label: "Retention horizon", points: 3, reason: "Two-year retention needs durable records and backup posture." },
      { label: "Runtime shape", points: 0, reason: "No long-running worker is required for this workload." },
      { label: "Traffic scale", points: 2, reason: "180,000 monthly requests requires capacity headroom." },
      { label: "Known risk flags", points: 3, reason: "3 fixture risk flags need explicit review." }
    ]);
    expect(factors.reduce((total, factor) => total + factor.points, 0)).toBe(scoreOperationalRisk(fixtureProfiles[3]));
  });

  it("builds reviewer-ready memos with evidence and rejected-option context", () => {
    const result = recommend(fixtureProfiles[3]);
    const memo = createDecisionMemo(fixtureProfiles[3], result);

    expect(memo.headline).toContain("choose Managed Database");
    expect(memo.markdown).toContain("Cost band: $25-$100 synthetic planning band, not a live vendor quote.");
    expect(memo.markdown).toContain("Reject Static Site");
    expect(memo.markdown).toContain("## Supporting Requirements");
    expect(memo.reviewQuestions).toHaveLength(3);
  });

  it("keeps memos explicit when a profile has no risk flags", () => {
    const noFlagProfile: WorkloadProfile = {
      ...fixtureProfiles[0],
      riskFlags: []
    };
    const memo = createDecisionMemo(noFlagProfile, recommend(noFlagProfile));

    expect(memo.markdown).toContain("- No risk flags were identified for this synthetic profile.");
    expect(memo.markdown).not.toContain("## Risk Flags\n\n## Next Deploy Step");
  });

  it("keeps the committed decision memo example synchronized with the generated high-risk memo", async () => {
    const { readFile } = await import("node:fs/promises");
    const summary = buildNotebookSummary();
    const expected = summary.entries.find((entry) => entry.profile.name === summary.highestRiskProfile)?.memo.markdown;
    const committed = await readFile("docs/decision-memo.example.md", "utf8");

    expect(committed.replace(/\r\n/g, "\n")).toBe(`${expected}\n`);
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
