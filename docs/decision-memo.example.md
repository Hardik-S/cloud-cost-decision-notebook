# Ops audit trail

Owner: Operations lead
Decision deadline: Before pilot expansion
Recommendation: Managed Database
Confidence: high
Cost band: $25-$100 synthetic planning band, not a live vendor quote.

## Evidence
- Write pressure: High write frequency means file or static fixture storage will break down.
- Retention horizon: Two-year retention pushes the first real version toward managed persistence.
- Query shape: Operators need searchable history, filters, and exportable audit packets.

## Rejected Options
- Reject Static Site: A static build cannot preserve the audit trail.
- Reject Background Job: Processing alone does not solve interactive querying.

## Supporting Requirements
- No companion service is required for the current synthetic profile.

## Risk Flags
- audit-loss
- schema-delay
- high-write-volume

## Next Deploy Step
Use Vercel for the app and attach a managed Postgres project only after the schema is explicit.
