export type WorkloadKind = "static" | "interactive" | "scheduled" | "data-heavy";
export type RecommendationKind = "Static Site" | "Serverless Functions" | "Background Job" | "Managed Database";

export type WorkloadProfile = {
  id: string;
  name: string;
  kind: WorkloadKind;
  owner: string;
  decisionDeadline: string;
  monthlyRequests: number;
  writeFrequency: "none" | "low" | "medium" | "high";
  latencyTargetMs: number;
  needsLongRunningWork: boolean;
  dataRetentionDays: number;
  teamTolerance: "lowest-cost" | "balanced" | "operational-headroom";
  evidence: Array<{ label: string; detail: string }>;
  riskFlags: string[];
};

export type DecisionResult = {
  recommendation: RecommendationKind;
  confidence: "high" | "medium";
  monthlyCostBand: string;
  assumptions: string[];
  rejectedOptions: Array<{ option: RecommendationKind; reason: string }>;
  supportingRequirements: Array<{ option: RecommendationKind; reason: string }>;
  nextDeployStep: string;
};

export type RiskFactor = {
  label: string;
  points: number;
  reason: string;
};

export type DecisionMemo = {
  profileId: string;
  owner: string;
  headline: string;
  operationalRisk: "low" | "medium" | "high";
  evidenceScore: number;
  primaryTradeoff: string;
  reviewQuestions: string[];
  markdown: string;
};

export type NotebookSummary = {
  entries: Array<{ profile: WorkloadProfile; result: DecisionResult; memo: DecisionMemo }>;
  highestRiskProfile: string;
  highConfidenceCount: number;
  totalEvidenceItems: number;
  nextReviewAction: string;
};

export const fixtureProfiles: WorkloadProfile[] = [
  {
    id: "portfolio-proof",
    name: "Portfolio proof page",
    kind: "static",
    owner: "Portfolio owner",
    decisionDeadline: "Before public case-study share",
    monthlyRequests: 8000,
    writeFrequency: "none",
    latencyTargetMs: 250,
    needsLongRunningWork: false,
    dataRetentionDays: 0,
    teamTolerance: "lowest-cost",
    evidence: [
      { label: "Traffic shape", detail: "Read-heavy static proof page with no logged-in workflow." },
      { label: "Data boundary", detail: "Versioned synthetic project facts only; no user writes." },
      { label: "Rollback path", detail: "Redeploy the previous static build if copy or fixture changes regress." }
    ],
    riskFlags: ["overbuilding-runtime", "false-precision-pricing"]
  },
  {
    id: "ai-intake-review",
    name: "AI intake review console",
    kind: "interactive",
    owner: "Product engineer",
    decisionDeadline: "Before adding reviewer comments",
    monthlyRequests: 60000,
    writeFrequency: "medium",
    latencyTargetMs: 900,
    needsLongRunningWork: false,
    dataRetentionDays: 90,
    teamTolerance: "balanced",
    evidence: [
      { label: "Interaction need", detail: "Reviewers need request-time validation and packet generation." },
      { label: "Storage horizon", detail: "Ninety-day retention is enough for audit replay in the first slice." },
      { label: "Latency target", detail: "A sub-second response target tolerates light serverless cold starts." }
    ],
    riskFlags: ["premature-database", "review-state-loss"]
  },
  {
    id: "nightly-ledger",
    name: "Nightly ledger summarizer",
    kind: "scheduled",
    owner: "Finance operations",
    decisionDeadline: "Before month-end dry run",
    monthlyRequests: 1200,
    writeFrequency: "low",
    latencyTargetMs: 5000,
    needsLongRunningWork: true,
    dataRetentionDays: 365,
    teamTolerance: "operational-headroom",
    evidence: [
      { label: "Batch shape", detail: "The heavy summarization happens after hours, not during a user request." },
      { label: "Audit need", detail: "A one-year result trail is needed for reconciliation review." },
      { label: "Failure mode", detail: "Retries and job logs are more important than immediate UI response." }
    ],
    riskFlags: ["request-time-timeout", "missing-retry-log", "month-end-pressure"]
  },
  {
    id: "ops-audit-trail",
    name: "Ops audit trail",
    kind: "data-heavy",
    owner: "Operations lead",
    decisionDeadline: "Before pilot expansion",
    monthlyRequests: 180000,
    writeFrequency: "high",
    latencyTargetMs: 700,
    needsLongRunningWork: false,
    dataRetentionDays: 730,
    teamTolerance: "operational-headroom",
    evidence: [
      { label: "Write pressure", detail: "High write frequency means file or static fixture storage will break down." },
      { label: "Retention horizon", detail: "Two-year retention pushes the first real version toward managed persistence." },
      { label: "Query shape", detail: "Operators need searchable history, filters, and exportable audit packets." }
    ],
    riskFlags: ["audit-loss", "schema-delay", "high-write-volume"]
  }
];

export function recommend(profile: WorkloadProfile): DecisionResult {
  if (profile.kind === "static" && profile.writeFrequency === "none" && profile.dataRetentionDays === 0) {
    return {
      recommendation: "Static Site",
      confidence: "high",
      monthlyCostBand: "$0-$5",
      assumptions: [
        "Content can be rebuilt when fixtures or copy change.",
        "No user-specific data needs server-side storage.",
        "CDN latency is the main performance requirement."
      ],
      rejectedOptions: [
        { option: "Serverless Functions", reason: "Adds runtime cost without request-time logic." },
        { option: "Managed Database", reason: "No durable records are created by users." }
      ],
      supportingRequirements: [],
      nextDeployStep: "Ship as a Vercel static-first Next.js route and keep data in versioned fixtures."
    };
  }

  if (profile.writeFrequency === "high" || profile.dataRetentionDays > 365 || profile.kind === "data-heavy") {
    return {
      recommendation: "Managed Database",
      confidence: "high",
      monthlyCostBand: "$25-$100",
      assumptions: [
        "Durable records and queryability are core product requirements.",
        "The team accepts managed service cost to avoid hand-rolled persistence.",
        "Retention and audit history are more important than the cheapest first deploy."
      ],
      rejectedOptions: [
        { option: "Static Site", reason: "A static build cannot preserve the audit trail." },
        { option: "Background Job", reason: "Processing alone does not solve interactive querying." }
      ],
      supportingRequirements:
        profile.needsLongRunningWork || profile.kind === "scheduled"
          ? [
              {
                option: "Background Job",
                reason: "Long-running or scheduled work still needs an observable worker path beside managed persistence."
              }
            ]
          : [],
      nextDeployStep: "Use Vercel for the app and attach a managed Postgres project only after the schema is explicit."
    };
  }

  if (profile.needsLongRunningWork || profile.kind === "scheduled") {
    return {
      recommendation: "Background Job",
      confidence: profile.dataRetentionDays > 0 ? "high" : "medium",
      monthlyCostBand: "$10-$50",
      assumptions: [
        "The expensive work can run outside the user request path.",
        "A short status record is enough for the web UI.",
        "Retries and logs matter more than sub-second response time."
      ],
      rejectedOptions: [
        { option: "Static Site", reason: "Cannot execute scheduled or long-running processing." },
        { option: "Serverless Functions", reason: "Request lifetimes are a poor fit for slow batch work." }
      ],
      supportingRequirements: [],
      nextDeployStep: "Start with a scheduled worker plus a small status table, then expose results through a read-only route."
    };
  }

  return {
    recommendation: "Serverless Functions",
    confidence: "medium",
    monthlyCostBand: "$5-$25",
    assumptions: [
      "Request-time logic is needed, but workload volume is still moderate.",
      "Writes exist but do not yet justify a database-first architecture.",
      "Cold starts are acceptable within the stated latency target."
    ],
    rejectedOptions: [
      { option: "Static Site", reason: "The workflow needs request-time decisions." },
      { option: "Managed Database", reason: "Persistence can wait until write volume or retention grows." }
    ],
    supportingRequirements: [],
    nextDeployStep: "Implement the decision path as a Vercel serverless route and keep persistence behind an interface."
  };
}

export function breakdownOperationalRisk(profile: WorkloadProfile): RiskFactor[] {
  const writePoints =
    profile.writeFrequency === "high" ? 3 : profile.writeFrequency === "medium" ? 2 : profile.writeFrequency === "low" ? 1 : 0;
  const retentionPoints = profile.dataRetentionDays > 365 ? 3 : profile.dataRetentionDays > 90 ? 2 : profile.dataRetentionDays > 0 ? 1 : 0;
  const runtimePoints = profile.needsLongRunningWork ? 2 : 0;
  const trafficPoints = profile.monthlyRequests > 100000 ? 2 : profile.monthlyRequests > 50000 ? 1 : 0;

  return [
    {
      label: "Write pressure",
      points: writePoints,
      reason:
        profile.writeFrequency === "high"
          ? "High write frequency increases data-loss and consistency risk."
          : `${profile.writeFrequency} write frequency keeps data-loss pressure at ${writePoints} point${writePoints === 1 ? "" : "s"}.`
    },
    {
      label: "Retention horizon",
      points: retentionPoints,
      reason:
        profile.dataRetentionDays > 365
          ? "Two-year retention needs durable records and backup posture."
          : `${profile.dataRetentionDays} retention days keeps retention pressure at ${retentionPoints} point${retentionPoints === 1 ? "" : "s"}.`
    },
    {
      label: "Runtime shape",
      points: runtimePoints,
      reason: profile.needsLongRunningWork
        ? "Long-running work needs retries, status records, and logs outside the request path."
        : "No long-running worker is required for this workload."
    },
    {
      label: "Traffic scale",
      points: trafficPoints,
      reason:
        profile.monthlyRequests > 100000
          ? `${profile.monthlyRequests.toLocaleString()} monthly requests requires capacity headroom.`
          : `${profile.monthlyRequests.toLocaleString()} monthly requests keeps scale pressure at ${trafficPoints} point${trafficPoints === 1 ? "" : "s"}.`
    },
    {
      label: "Known risk flags",
      points: profile.riskFlags.length,
      reason:
        profile.riskFlags.length > 0
          ? `${profile.riskFlags.length} fixture risk flags need explicit review.`
          : "No fixture risk flags were identified for this synthetic profile."
    }
  ];
}

export function scoreOperationalRisk(profile: WorkloadProfile): number {
  return breakdownOperationalRisk(profile).reduce((total, factor) => total + factor.points, 0);
}

export function createDecisionMemo(profile: WorkloadProfile, result: DecisionResult): DecisionMemo {
  const riskScore = scoreOperationalRisk(profile);
  const operationalRisk = riskScore >= 8 ? "high" : riskScore >= 5 ? "medium" : "low";
  const evidenceScore = Math.min(100, profile.evidence.length * 22 + result.rejectedOptions.length * 12 + result.assumptions.length * 8);
  const primaryTradeoff =
    result.recommendation === "Managed Database"
      ? "Pay for managed persistence only after the audit schema is explicit."
      : result.recommendation === "Background Job"
        ? "Move slow work out of the request path and make retries observable."
        : result.recommendation === "Serverless Functions"
          ? "Keep the first runtime small while deferring durable storage."
          : "Stay static until request-time behavior or writes are proven.";

  const reviewQuestions = [
    `Can ${profile.owner} explain why ${result.recommendation} beats the nearest rejected option?`,
    `Is the ${profile.decisionDeadline.toLowerCase()} deadline blocked by missing evidence?`,
    `Would a failed deploy lose user data, audit history, or only the current UI build?`
  ];

  const rejectedLines =
    result.rejectedOptions.length > 0
      ? result.rejectedOptions.map((option) => `- Reject ${option.option}: ${option.reason}`).join("\n")
      : "- No rejected options were captured for this synthetic profile.";
  const supportingLines =
    result.supportingRequirements.length > 0
      ? result.supportingRequirements.map((item) => `- Add ${item.option}: ${item.reason}`).join("\n")
      : "- No companion service is required for the current synthetic profile.";
  const evidenceLines =
    profile.evidence.length > 0
      ? profile.evidence.map((item) => `- ${item.label}: ${item.detail}`).join("\n")
      : "- No evidence rows were captured for this synthetic profile.";
  const riskLines =
    profile.riskFlags.length > 0
      ? profile.riskFlags.map((flag) => `- ${flag}`).join("\n")
      : "- No risk flags were identified for this synthetic profile.";

  return {
    profileId: profile.id,
    owner: profile.owner,
    headline: `${profile.name}: choose ${result.recommendation} with ${result.confidence} confidence`,
    operationalRisk,
    evidenceScore,
    primaryTradeoff,
    reviewQuestions,
    markdown: [
      `# ${profile.name}`,
      "",
      `Owner: ${profile.owner}`,
      `Decision deadline: ${profile.decisionDeadline}`,
      `Recommendation: ${result.recommendation}`,
      `Confidence: ${result.confidence}`,
      `Cost band: ${result.monthlyCostBand} synthetic planning band, not a live vendor quote.`,
      "",
      "## Evidence",
      evidenceLines,
      "",
      "## Rejected Options",
      rejectedLines,
      "",
      "## Supporting Requirements",
      supportingLines,
      "",
      "## Risk Flags",
      riskLines,
      "",
      "## Next Deploy Step",
      result.nextDeployStep
    ].join("\n")
  };
}

export function buildNotebookSummary(profiles: WorkloadProfile[] = fixtureProfiles): NotebookSummary {
  const entries = profiles.map((profile) => {
    const result = recommend(profile);
    return { profile, result, memo: createDecisionMemo(profile, result) };
  });
  if (entries.length === 0) {
    return {
      entries: [],
      highestRiskProfile: "No profiles",
      highConfidenceCount: 0,
      totalEvidenceItems: 0,
      nextReviewAction: "Add at least one synthetic workload profile before reviewing decisions."
    };
  }
  const highestRiskEntry = entries.reduce((highest, entry) =>
    scoreOperationalRisk(entry.profile) > scoreOperationalRisk(highest.profile) ? entry : highest
  );
  const reviewDeadline = highestRiskEntry.profile.decisionDeadline.replace(/^before\s+/i, "");

  return {
    entries,
    highestRiskProfile: highestRiskEntry.profile.name,
    highConfidenceCount: entries.filter((entry) => entry.result.confidence === "high").length,
    totalEvidenceItems: entries.reduce((total, entry) => total + entry.profile.evidence.length, 0),
    nextReviewAction: `Review ${highestRiskEntry.profile.name} before ${reviewDeadline.toLowerCase()}.`
  };
}
