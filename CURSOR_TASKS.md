# Cursor Tasks — Make It Real

1) Add a **Readiness Panel** that executes `DEPLOYMENT_READINESS.md` checks and renders PASS/WARN/BLOCK.
2) Implement a **Schema Registry**: read fields → create missing via v2 → cache IDs per location → drift detector.
3) Build **Voice AI Deployer**: upsert agent, attach actions, produce a deployment manifest (for rollback).
4) Wire **Workflows**: ensure outbound trigger & guards; attach numbers/IVR for inbound.
5) Add **Custom Actions Latency Guard**: mid-call webhooks must respond < 1500ms (else fallback branch).
6) Create **Golden QA Runner**: seed test contact → trigger test call → fetch call log → assert outcomes → render a report.
7) Add a **Rate-Limit Aware Queue**: throttle per-location, exponential backoff on 429.
8) Extend **Export Center**: JSON bundle + Markdown Implementation Guide + CSV of workflow nodes/edges + readiness & QA report.

**Acceptance:** No orphan nodes, no missing variables, readiness PASS/WARN only (no BLOCK), QA report = green with transcript snippet.
