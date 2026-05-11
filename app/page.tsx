import { fixtureProfiles, recommend } from "../src/decision";

const orderedOptions = ["Static Site", "Serverless Functions", "Background Job", "Managed Database"];

export default function Home() {
  const results = fixtureProfiles.map((profile) => ({ profile, result: recommend(profile) }));

  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow">Portfolio product / platform judgment</p>
          <h1>Cloud Cost Decision Notebook</h1>
          <p className="lede">
            A fixture-first notebook that turns workload assumptions into a visible deploy recommendation, including
            rejected options and the next pragmatic Vercel step.
          </p>
        </div>
        <div className="heroPanel" aria-label="Recommendation coverage">
          {orderedOptions.map((option) => (
            <span key={option}>{option}</span>
          ))}
        </div>
      </section>

      <section className="summary" aria-label="Decision summary">
        <div>
          <strong>{fixtureProfiles.length}</strong>
          <span>workload profiles</span>
        </div>
        <div>
          <strong>4</strong>
          <span>deploy choices compared</span>
        </div>
        <div>
          <strong>0</strong>
          <span>live credentials required</span>
        </div>
      </section>

      <section className="grid" aria-label="Workload recommendations">
        {results.map(({ profile, result }) => (
          <article className="card" key={profile.id}>
            <div className="cardHeader">
              <div>
                <p className="type">{profile.kind}</p>
                <h2>{profile.name}</h2>
              </div>
              <span className="badge">{result.recommendation}</span>
            </div>

            <dl className="metrics">
              <div>
                <dt>Monthly requests</dt>
                <dd>{profile.monthlyRequests.toLocaleString()}</dd>
              </div>
              <div>
                <dt>Latency target</dt>
                <dd>{profile.latencyTargetMs}ms</dd>
              </div>
              <div>
                <dt>Cost band</dt>
                <dd>{result.monthlyCostBand}</dd>
              </div>
            </dl>

            <div className="sectionBlock">
              <h3>Assumptions</h3>
              <ul>
                {result.assumptions.map((assumption) => (
                  <li key={assumption}>{assumption}</li>
                ))}
              </ul>
            </div>

            <div className="sectionBlock">
              <h3>Rejected options</h3>
              <ul>
                {result.rejectedOptions.map((option) => (
                  <li key={option.option}>
                    <strong>{option.option}:</strong> {option.reason}
                  </li>
                ))}
              </ul>
            </div>

            <p className="nextStep">{result.nextDeployStep}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
