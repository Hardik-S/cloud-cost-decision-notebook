# Cloud Cost Decision Notebook

Cloud Cost Decision Notebook is a small portfolio product for making early platform choices explicit. It turns synthetic workload profiles into a deploy recommendation across static hosting, serverless functions, background jobs, and managed databases.

## Portfolio Signal

This project shows practical platform judgment instead of generic cloud enthusiasm. The visible output is not a pricing calculator; it is a decision notebook that records assumptions, rejected options, likely cost band, and the next safe deploy step.

## Stack Rationale

- Next.js App Router keeps the UI deployable on Vercel and leaves room for future server routes.
- TypeScript keeps the recommendation rules inspectable and testable.
- Fixture-first data keeps the public demo free of customer data, account data, or credentials.
- Vitest covers the rules that matter, so the portfolio claim is backed by executable evidence.

## Local Setup

```powershell
npm install
npm run test
npm run build
npm run dev
```

## Verification

- `npm run test` checks deterministic recommendation rules.
- `npm run build` checks the production Next.js bundle.
- The deployed page should contain `Cloud Cost Decision Notebook` and the four recommendation options.
- Production URL: https://cloud-cost-decision-notebook.vercel.app

## Decision Log

- Kept the first slice deterministic because the acceptance criteria require testable recommendation rules, not live cloud pricing integrations.
- Used broad cost bands instead of precise vendor prices because current pricing changes often and would create false precision without live quote APIs.
- Surfaced rejected options on every card because the product signal is decision support, not a one-word recommendation.
- Kept all profiles synthetic so the repository can remain public under `Hardik-S`.

## Assumption Table

| Assumption | Why it matters |
| --- | --- |
| Static pages with no writes should stay static-first. | Avoids paying for runtime when CDN delivery is enough. |
| Long-running or scheduled work should leave the request path. | Makes retry behavior and logs easier to reason about. |
| High-write or long-retention workflows need managed persistence. | Auditability usually beats the cheapest initial deploy. |
| Moderate interactive workflows can start with serverless functions. | Keeps the first architecture small while preserving an upgrade path. |

## Future Work

- Add a form-based profile editor that recalculates the recommendation client-side.
- Add a pricing-source date field if live provider pricing is introduced.
- Add Vercel deployment metadata after production deployment.
