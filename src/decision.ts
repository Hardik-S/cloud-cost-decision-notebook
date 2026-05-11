export type WorkloadKind = "static" | "interactive" | "scheduled" | "data-heavy";
export type RecommendationKind = "Static Site" | "Serverless Functions" | "Background Job" | "Managed Database";

export type WorkloadProfile = {
  id: string;
  name: string;
  kind: WorkloadKind;
  monthlyRequests: number;
  writeFrequency: "none" | "low" | "medium" | "high";
  latencyTargetMs: number;
  needsLongRunningWork: boolean;
  dataRetentionDays: number;
  teamTolerance: "lowest-cost" | "balanced" | "operational-headroom";
};

export type DecisionResult = {
  recommendation: RecommendationKind;
  confidence: "high" | "medium";
  monthlyCostBand: string;
  assumptions: string[];
  rejectedOptions: Array<{ option: RecommendationKind; reason: string }>;
  nextDeployStep: string;
};

export const fixtureProfiles: WorkloadProfile[] = [
  {
    id: "portfolio-proof",
    name: "Portfolio proof page",
    kind: "static",
    monthlyRequests: 8000,
    writeFrequency: "none",
    latencyTargetMs: 250,
    needsLongRunningWork: false,
    dataRetentionDays: 0,
    teamTolerance: "lowest-cost"
  },
  {
    id: "ai-intake-review",
    name: "AI intake review console",
    kind: "interactive",
    monthlyRequests: 60000,
    writeFrequency: "medium",
    latencyTargetMs: 900,
    needsLongRunningWork: false,
    dataRetentionDays: 90,
    teamTolerance: "balanced"
  },
  {
    id: "nightly-ledger",
    name: "Nightly ledger summarizer",
    kind: "scheduled",
    monthlyRequests: 1200,
    writeFrequency: "low",
    latencyTargetMs: 5000,
    needsLongRunningWork: true,
    dataRetentionDays: 365,
    teamTolerance: "operational-headroom"
  },
  {
    id: "ops-audit-trail",
    name: "Ops audit trail",
    kind: "data-heavy",
    monthlyRequests: 180000,
    writeFrequency: "high",
    latencyTargetMs: 700,
    needsLongRunningWork: false,
    dataRetentionDays: 730,
    teamTolerance: "operational-headroom"
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
      nextDeployStep: "Ship as a Vercel static-first Next.js route and keep data in versioned fixtures."
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
      nextDeployStep: "Start with a scheduled worker plus a small status table, then expose results through a read-only route."
    };
  }

  if (profile.writeFrequency === "high" || profile.dataRetentionDays > 180 || profile.kind === "data-heavy") {
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
      nextDeployStep: "Use Vercel for the app and attach a managed Postgres project only after the schema is explicit."
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
    nextDeployStep: "Implement the decision path as a Vercel serverless route and keep persistence behind an interface."
  };
}
