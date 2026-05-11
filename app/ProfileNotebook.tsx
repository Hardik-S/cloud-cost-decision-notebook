"use client";

import { useMemo, useState } from "react";
import { breakdownOperationalRisk, buildNotebookSummary, scoreOperationalRisk } from "../src/decision";

const notebook = buildNotebookSummary();

export function ProfileNotebook() {
  const [selectedId, setSelectedId] = useState(notebook.entries[0]?.profile.id ?? "");
  const selected = useMemo(
    () => notebook.entries.find((entry) => entry.profile.id === selectedId) ?? notebook.entries[0],
    [selectedId]
  );
  if (!selected) {
    return (
      <main>
        <section className="decisionPanel" aria-label="Empty notebook">
          <p className="eyebrow">Portfolio product / platform judgment</p>
          <h1>Cloud Cost Decision Notebook</h1>
          <p>{notebook.nextReviewAction}</p>
        </section>
      </main>
    );
  }
  const topRejected = selected.result.rejectedOptions[0] ?? {
    option: selected.result.recommendation,
    reason: "No rejected option was generated for this synthetic workload."
  };
  const supportingRequirement = selected.result.supportingRequirements[0];
  const riskFactors = breakdownOperationalRisk(selected.profile);

  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow">Portfolio product / platform judgment</p>
          <h1>Cloud Cost Decision Notebook</h1>
          <p className="lede">
            A fixture-first notebook that turns workload assumptions into a reviewer-ready deployment memo, including
            the cheapest wrong answer avoided and the next pragmatic Vercel step.
          </p>
          <div className="heroActions" role="list" aria-label="Selectable workload profiles">
            {notebook.entries.map(({ profile, result }) => (
              <button
                aria-pressed={profile.id === selected.profile.id}
                className="profileButton"
                key={profile.id}
                onClick={() => setSelectedId(profile.id)}
                type="button"
              >
                <span>{profile.name}</span>
                <strong>{result.recommendation}</strong>
              </button>
            ))}
          </div>
        </div>
        <aside className="decisionPanel" aria-label="Selected recommendation trace">
          <p className="eyebrow">Selected decision</p>
          <h2>{selected.result.recommendation}</h2>
          <dl className="decisionFacts">
            <div>
              <dt>Confidence</dt>
              <dd>{selected.result.confidence}</dd>
            </div>
            <div>
              <dt>Cost band</dt>
              <dd>{selected.result.monthlyCostBand}</dd>
            </div>
            <div>
              <dt>Risk</dt>
              <dd>{selected.memo.operationalRisk}</dd>
            </div>
          </dl>
          <p className="tradeoff">{selected.memo.primaryTradeoff}</p>
          <p className="wrongAnswer">
            Avoided: <strong>{topRejected.option}</strong> because {topRejected.reason.toLowerCase()}
          </p>
          {supportingRequirement ? (
            <p className="supportingRequirement">
              Companion: <strong>{supportingRequirement.option}</strong> because {supportingRequirement.reason.toLowerCase()}
            </p>
          ) : null}
        </aside>
      </section>

      <section className="summary" aria-label="Decision summary">
        <div>
          <strong>{notebook.entries.length}</strong>
          <span>synthetic workload profiles</span>
        </div>
        <div>
          <strong>{notebook.highConfidenceCount}</strong>
          <span>high-confidence decisions</span>
        </div>
        <div>
          <strong>{notebook.totalEvidenceItems}</strong>
          <span>evidence items traced</span>
        </div>
        <div>
          <strong>{notebook.highestRiskProfile}</strong>
          <span>{notebook.nextReviewAction}</span>
        </div>
      </section>

      <section className="selectedGrid" aria-label="Selected workload details">
        <article className="detailPanel">
          <p className="type">{selected.profile.kind}</p>
          <h2>{selected.profile.name}</h2>
          <dl className="metrics">
            <div>
              <dt>Owner</dt>
              <dd>{selected.profile.owner}</dd>
            </div>
            <div>
              <dt>Deadline</dt>
              <dd>{selected.profile.decisionDeadline}</dd>
            </div>
            <div>
              <dt>Monthly requests</dt>
              <dd>{selected.profile.monthlyRequests.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Write frequency</dt>
              <dd>{selected.profile.writeFrequency}</dd>
            </div>
            <div>
              <dt>Retention</dt>
              <dd>{selected.profile.dataRetentionDays} days</dd>
            </div>
            <div>
              <dt>Latency target</dt>
              <dd>{selected.profile.latencyTargetMs}ms</dd>
            </div>
          </dl>
        </article>

        <article className="detailPanel">
          <p className="type">Reviewer memo</p>
          <h2>{selected.memo.headline}</h2>
          <ul className="evidenceList">
            {selected.profile.evidence.map((item) => (
              <li key={item.label}>
                <strong>{item.label}</strong>
                <span>{item.detail}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="reviewGrid" aria-label="Decision review packet">
        <article>
          <h2>Risk Breakdown</h2>
          <ul className="factorList">
            {riskFactors.map((factor) => (
              <li key={factor.label}>
                <span>
                  <strong>{factor.label}</strong>
                  {factor.reason}
                </span>
                <b>{factor.points}</b>
              </li>
            ))}
          </ul>
        </article>
        <article>
          <h2>Review Questions</h2>
          <ol>
            {selected.memo.reviewQuestions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ol>
        </article>
        <article>
          <h2>Rejected Options</h2>
          <ul>
            {selected.result.rejectedOptions.map((option) => (
              <li key={option.option}>
                <strong>{option.option}:</strong> {option.reason}
              </li>
            ))}
          </ul>
        </article>
        <article>
          <h2>Risk Flags</h2>
          <ul>
            {selected.profile.riskFlags.map((flag) => (
              <li key={flag}>{flag}</li>
            ))}
          </ul>
          <p className="riskScore">Risk score: {scoreOperationalRisk(selected.profile)}</p>
        </article>
      </section>

      <section className="memoPanel" aria-label="Generated decision memo">
        <div>
          <p className="type">Copy-safe artifact</p>
          <h2>Generated Decision Memo</h2>
          <p>
            This is the deterministic Markdown packet mirrored in `docs/decision-memo.example.md` for the highest-risk
            fixture.
          </p>
        </div>
        <pre tabIndex={0}>{selected.memo.markdown}</pre>
      </section>

      <section className="grid" aria-label="All workload recommendations">
        {notebook.entries.map(({ profile, result, memo }) => (
          <article className="card" key={profile.id}>
            <div className="cardHeader">
              <div>
                <p className="type">{profile.kind}</p>
                <h2>{profile.name}</h2>
              </div>
              <span className="badge">{result.recommendation}</span>
            </div>
            <p>{memo.primaryTradeoff}</p>
            <p className="nextStep">{result.nextDeployStep}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
