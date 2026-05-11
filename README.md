# Cloud Cost Decision Notebook

Cloud Cost Decision Notebook is a portfolio product for making early platform choices explicit. It turns synthetic workload profiles into a reviewer-ready deployment memo across static hosting, serverless functions, background jobs, and managed databases.

## Portfolio Signal

This project shows practical platform judgment instead of generic cloud enthusiasm. The visible output is not a pricing calculator; it is an interactive decision notebook that records assumptions, rejected options, risk flags, illustrative cost bands, and the next safe Vercel step.

The first viewport lets a reviewer switch between synthetic workloads and immediately see the recommended architecture, confidence, planning cost band, top rejected option, companion architecture requirement, and the tradeoff that drove the decision.

## Synthetic Data Boundary

- All workloads, owners, evidence notes, deadlines, and risk flags are synthetic fixtures in `src/decision.ts`.
- Cost bands are illustrative planning bands, not live vendor quotes.
- No cloud account data, pricing API, customer data, credentials, or private workload telemetry is used.
- The demo can remain public under `Hardik-S` because it is fixture-first and deterministic.

## File Map

| Path | Purpose |
| --- | --- |
| `app/ProfileNotebook.tsx` | Interactive client-side notebook, workload selector, decision trace, and reviewer packet UI. |
| `app/page.tsx` | App Router page entry that renders the notebook. |
| `app/styles.css` | Responsive visual system and first-viewport decision layout. |
| `src/decision.ts` | Typed fixtures, recommendation rules, composite support requirements, operational risk scoring, memo generation, and notebook summary helpers. |
| `src/decision.test.ts` | Vitest coverage for static, serverless, background-job, managed-database, memo, and summary behavior. |
| `docs/decision-memo.example.md` | Committed example of the generated reviewer memo for the highest-risk synthetic workload. |
| `.github/workflows/verify.yml` | GitHub Actions gate for install, tests, typecheck, and production build. |

## Stack Rationale

- Next.js App Router keeps the UI deployable on Vercel and leaves room for future server routes.
- TypeScript keeps the recommendation rules inspectable and testable.
- Fixture-first data keeps the public demo free of customer data, account data, or credentials.
- Vitest covers the rules that matter, so the portfolio claim is backed by executable evidence.
- The build script uses webpack to avoid deep Windows worktree path issues seen in similar automation runs.

## Local Setup

Requires Node.js 22 and npm.

```powershell
npm ci
npm run verify
npm run dev
```

Useful individual checks:

```powershell
npm run test
npm run typecheck
npm run build
```

## Verification

- `npm run test` checks deterministic recommendation, risk, memo, and summary rules.
- `npm run typecheck` checks TypeScript with incremental output disabled.
- `npm run build` checks the production Next.js bundle with webpack.
- `npm run verify` runs the full local verification contract.
- The deployed page should contain `Cloud Cost Decision Notebook`, `Selected decision`, `Avoided:`, `Risk Breakdown`, and `Generated Decision Memo`.
- `src/decision.test.ts` compares `docs/decision-memo.example.md` against the generated highest-risk memo so the committed artifact cannot drift silently.

Last worker deployment evidence:

- Production URL: https://cloud-cost-decision-notebook.vercel.app
- Worker commit: `ba6478b44701d01050a24f84446f2c064565bb66`
- Worker verification: `npm run test`, `npm run build`, and live HTTP check for `Cloud Cost Decision Notebook` plus `Managed Database`

Previous fixer deployment evidence:

- Fixer commit: `f9442193c51a72d7a003c9603c75afbb98040aa5`
- Production deployment: `https://cloud-cost-decision-notebook-79wg9lh78-batb4016-9101s-projects.vercel.app`
- Production alias: https://cloud-cost-decision-notebook.vercel.app
- Vercel deployment id: `dpl_8Efu38W9BtGzux7zSxpqnMJmbyE8`
- Inspect URL: https://vercel.com/batb4016-9101s-projects/cloud-cost-decision-notebook/8Efu38W9BtGzux7zSxpqnMJmbyE8
- Verified on 2026-05-11 America/Toronto with `npm run verify`, source-only redaction scans, built-output smoke, Vercel production build, and production HTTP smoke for `Selected decision`, `Avoided:`, `Review Questions`, and `Ops audit trail`.

This fixer branch adds composite architecture support requirements, visible risk-factor rows, generated memo preview, memo artifact drift coverage, and conservative response headers. Record the final fixer commit and deployment evidence here after this branch is verified and deployed.

## Decision Log

- Kept the product deterministic because the acceptance criteria require testable recommendation rules, not live cloud pricing integrations.
- Used broad cost bands instead of precise vendor prices because current pricing changes often and would create false precision without live quote APIs.
- Added visible rejected options because the product signal is decision support, not a one-word recommendation.
- Added risk scoring and reviewer questions so the demo reads like a platform decision artifact rather than a static recommendation gallery.
- Added companion architecture requirements so a persistence-first recommendation can still preserve scheduled or long-running worker needs.
- Added conservative response headers in `next.config.ts` because this public portfolio surface should demonstrate deploy hygiene even without secrets or account data.
- Kept all profiles synthetic so the repository can remain public under `Hardik-S`.

## Assumption Table

| Assumption | Why it matters |
| --- | --- |
| Static pages with no writes should stay static-first. | Avoids paying for runtime when CDN delivery is enough. |
| Long-running or scheduled work should leave the request path. | Makes retry behavior and logs easier to reason about. |
| High-write or long-retention workflows need managed persistence. | Auditability usually beats the cheapest initial deploy. |
| Moderate interactive workflows can start with serverless functions. | Keeps the first architecture small while preserving an upgrade path. |

## Limitations

- The notebook does not call provider pricing APIs.
- The memo output is generated from static fixtures, not editable user input.
- Accessibility coverage is limited to semantic structure, keyboard-focusable memo output, and responsive checks; no automated axe run is included yet.
- The product does not provision infrastructure or mutate cloud accounts.

## Future Work

- Add a form-based profile editor that recalculates the recommendation client-side.
- Add pricing-source dates if live provider pricing is introduced.
- Add export controls for the generated Markdown memo after the reviewer workflow is validated.
- Add a rendered accessibility check to the verification contract.
