# GHL Voice AI — Deployment Readiness (Preflight)

Outcome: BLOCK, WARN, or PASS before any deploy/export.

## Telephony & Trust
- [ ] LC Phone active, at least one number attached
- [ ] Outbound Voice AI enabled (if using outbound)
- [ ] Business hours + holidays configured
- [ ] Regulatory bundle/A2P campaign approved
- [ ] STIR/SHAKEN status checked

## GHL Objects & Schema
- [ ] Pipelines + default stage exist
- [ ] Calendars/resources present if booking is used
- [ ] Custom Field Schema synced (contact/opportunity/company)
- [ ] Location Custom Values present (all referenced in scripts/workflows)
- [ ] Merge tag preview renders without “{{missing}}”

## Webhooks & Custom Actions
- [ ] Webhook endpoints reachable (< 1500ms p95)
- [ ] Signature verification on
- [ ] Idempotency key support (dedupe writes)
- [ ] Retry/backoff on 429/5xx

## Rate Limits & Quotas
- [ ] Estimated request budget < limit window
- [ ] Queue with exponential backoff configured

## QA “Golden Pack”
- [ ] Test contact created
- [ ] Outbound (or inbound) test call triggered
- [ ] Call log pulled: intents fired, actions executed
- [ ] Booking/field updates verified
- [ ] Transcript snippet saved to /qa-reports

## Compliance & Safety
- [ ] TCPA / GDPR checklist completed
- [ ] Recording consent script present
- [ ] DNC metadata loaded (rows > 0 if configured)

## Export Sanity
- [ ] No orphan workflow nodes/edges
- [ ] All {{variables}} mapped
- [ ] At least one knowledge base source attached (if used)

> Any BLOCK stops deploy; WARN allows deploy with explicit override & reason.
