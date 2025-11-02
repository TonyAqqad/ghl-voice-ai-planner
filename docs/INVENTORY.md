# Repository Inventory

Generated: 11/2/2025, 12:42:14 PM

## Overview

- **Name:** GHL Voice AI Builder
- **Type:** monorepo
- **Structure:** npm workspaces

## Apps & Packages

### Applications

| Name | Path | Language | Framework | Description |
|------|------|----------|-----------|-------------|
| server | apps/server | JavaScript | Express.js | No description |
| web | apps/web | TypeScript | React + Vite | No description |

### Packages

| Name | Path | Language | Description |
|------|------|----------|-------------|
| evaluation | packages/evaluation | TypeScript | No description |
| promptkit | packages/promptkit | TypeScript | No description |
| shared | packages/shared | TypeScript | No description |

## Express Routes (Server)

| Method | Path | File |
|--------|------|------|
| GET | /api/health | apps/server/server\ghl-express-api.js |
| GET | /api/monitoring/ghl-status | apps/server/server\ghl-express-api.js |
| POST | /api/monitoring/ghl-circuit/reset | apps/server/server\ghl-express-api.js |
| POST | /api/monitoring/ghl-circuit/emergency-open | apps/server/server\ghl-express-api.js |
| POST | /api/monitoring/ghl-queue/clear | apps/server/server\ghl-express-api.js |
| GET | /health/db | apps/server/server\ghl-express-api.js |
| GET | /auth/ghl | apps/server/server\ghl-express-api.js |
| GET | /auth/callback | apps/server/server\ghl-express-api.js |
| POST | /api/voice-ai/process-contact | apps/server/server\ghl-express-api.js |
| GET | /health | apps/server/server\ghl-express-api.js |
| GET | /api/tokens/latest | apps/server/server\ghl-express-api.js |
| GET | /api/locations | apps/server/server\ghl-express-api.js |
| GET | /api/locations/:locationId | apps/server/server\ghl-express-api.js |
| POST | /api/ghl/training/sync | apps/server/server\ghl-express-api.js |
| GET | /api/ghl/contacts | apps/server/server\ghl-express-api.js |
| POST | /api/ghl/contacts/upsert | apps/server/server\ghl-express-api.js |
| GET | /api/ghl/contacts/:contactId | apps/server/server\ghl-express-api.js |
| POST | /api/ghl/conversations/messages | apps/server/server\ghl-express-api.js |
| GET | /api/ghl/conversations | apps/server/server\ghl-express-api.js |
| POST | /api/voice-ai/deploy | apps/server/server\ghl-express-api.js |
| POST | /api/voice-ai/agents | apps/server/server\ghl-express-api.js |
| GET | /api/voice-ai/agents | apps/server/server\ghl-express-api.js |
| GET | /api/elevenlabs/voices | apps/server/server\ghl-express-api.js |
| GET | /api/elevenlabs/voices/:voiceId | apps/server/server\ghl-express-api.js |
| POST | /api/elevenlabs/speech | apps/server/server\ghl-express-api.js |
| POST | /api/openai/speech | apps/server/server\ghl-express-api.js |
| GET | /api/elevenlabs/usage | apps/server/server\ghl-express-api.js |
| GET | /api/voice-ai/agents/:agentId | apps/server/server\ghl-express-api.js |
| PUT | /api/voice-ai/agents/:agentId | apps/server/server\ghl-express-api.js |
| POST | /api/voice-ai/agents/:agentId/activate | apps/server/server\ghl-express-api.js |
| POST | /api/voice-ai/agents/:agentId/deactivate | apps/server/server\ghl-express-api.js |
| DELETE | /api/voice-ai/agents/:agentId | apps/server/server\ghl-express-api.js |
| GET | /ghl-api | apps/server/server\ghl-express-api.js |
| POST | /api/demo/create-agent | apps/server/server\ghl-express-api.js |
| POST | /api/demo/test-conversation | apps/server/server\ghl-express-api.js |
| GET | /api/demo/agent-stats/:agentId | apps/server/server\ghl-express-api.js |
| POST | /api/voice-ai/agents | apps/server/server\ghl-express-api.js |
| GET | /api/voice-ai/agents/:agentId | apps/server/server\ghl-express-api.js |
| PUT | /api/voice-ai/agents/:agentId | apps/server/server\ghl-express-api.js |
| DELETE | /api/voice-ai/agents/:agentId | apps/server/server\ghl-express-api.js |
| POST | /api/voice-ai/agents/:agentId/custom-actions | apps/server/server\ghl-express-api.js |
| GET | /api/voice-ai/agents/:agentId/custom-actions | apps/server/server\ghl-express-api.js |
| PUT | /api/voice-ai/agents/:agentId/custom-actions/:actionId | apps/server/server\ghl-express-api.js |
| DELETE | /api/voice-ai/agents/:agentId/custom-actions/:actionId | apps/server/server\ghl-express-api.js |
| POST | /api/workflows | apps/server/server\ghl-express-api.js |
| POST | /api/voice-ai/generate | apps/server/server\ghl-express-api.js |
| GET | /api/templates | apps/server/server\ghl-express-api.js |
| GET | /api/templates/:templateId | apps/server/server\ghl-express-api.js |
| POST | /api/templates | apps/server/server\ghl-express-api.js |
| POST | /api/templates/:templateId/generate | apps/server/server\ghl-express-api.js |
| GET | /api/voice-ai/agents/:agentId/costs | apps/server/server\ghl-express-api.js |
| GET | /api/voice-ai/agents/:agentId/analytics | apps/server/server\ghl-express-api.js |
| GET | /api/voice-ai/agents/:agentId/costs/daily | apps/server/server\ghl-express-api.js |
| POST | /api/voice-ai/agents/:agentId/costs/estimate | apps/server/server\ghl-express-api.js |
| POST | /api/webhooks/voice-ai | apps/server/server\ghl-express-api.js |
| POST | /api/webhooks/agent | apps/server/server\ghl-express-api.js |
| POST | /api/mcp/master/applyFix | apps/server/server\ghl-express-api.js |
| POST | /api/mcp/master/analyzeTurn | apps/server/server\ghl-express-api.js |
| POST | /api/mcp/master/preTurnGuidance | apps/server/server\ghl-express-api.js |
| POST | /api/mcp/master/reviewResponse | apps/server/server\ghl-express-api.js |
| POST | /api/mcp/master/intervene | apps/server/server\ghl-express-api.js |
| POST | /api/mcp/master/learnPattern | apps/server/server\ghl-express-api.js |
| POST | /voiceAgent/call | apps/server/server\mcp\server.js |
| POST | /voiceAgent/generatePrompt | apps/server/server\mcp\server.js |
| POST | /ghl/triggerWorkflow | apps/server/server\mcp\server.js |
| POST | /webhook/onEvent | apps/server/server\mcp\server.js |
| POST | /webhook/processEvent/:eventType | apps/server/server\mcp\server.js |
| POST | /contact/extractAndUpdate | apps/server/server\mcp\server.js |
| POST | /action/retryIfFail | apps/server/server\mcp\server.js |
| POST | /agent/log | apps/server/server\mcp\server.js |
| POST | /agent/checkHealth | apps/server/server\mcp\server.js |
| POST | /agent/saveState | apps/server/server\mcp\server.js |
| POST | /agent/loadState | apps/server/server\mcp\server.js |
| POST | /integration/connect | apps/server/server\mcp\server.js |
| POST | /agent/autoRecovery | apps/server/server\mcp\server.js |
| POST | /agent/anomalyDetect | apps/server/server\mcp\server.js |
| POST | /agent/feedbackLoop | apps/server/server\mcp\server.js |
| POST | /configDrift/detect | apps/server/server\mcp\server.js |
| POST | /agent/liveTrace | apps/server/server\mcp\server.js |
| GET | /agent/getTrace/:traceId | apps/server/server\mcp\server.js |
| POST | /autoPatch/deploy | apps/server/server\mcp\server.js |
| POST | /incidentReport/create | apps/server/server\mcp\server.js |
| GET | /incidentReport/getIncidents | apps/server/server\mcp\server.js |
| GET | /health | apps/server/server\mcp\server.js |
| POST | /prompt/compose | apps/server/server\mcp\server.js |
| GET | /prompt/niches | apps/server/server\mcp\server.js |
| GET | /prompt/:agentId | apps/server/server\mcp\server.js |
| GET | /prompt/:agentId/history | apps/server/server\mcp\server.js |
| POST | /prompt/validate | apps/server/server\mcp\server.js |
| POST | /agent/ingestTranscript | apps/server/server\mcp\server.js |
| GET | /prompt/reviewQueue | apps/server/server\mcp\server.js |
| POST | /prompt/applyPatch | apps/server/server\mcp\server.js |
| POST | /prompt/rollback | apps/server/server\mcp\server.js |
| POST | /agent/batchReview | apps/server/server\mcp\server.js |
| POST | /agent/saveCorrection | apps/server/server\mcp\server.js |
| GET | /agent/corrections | apps/server/server\mcp\server.js |
| GET | /prompt/versions | apps/server/server\mcp\server.js |
| GET | /agent/performance | apps/server/server\mcp\server.js |

## Environment Variables

| Variable | Purpose | Used In |
|----------|---------|---------| n| DATABASE_URL | Database connection | apps/server/server\database.js, apps/server/server\ghl-express-api.js, apps/server/server\test-connection.js... (4 files) |
| NODE_ENV | Environment mode | apps/server/server\database.js, apps/server/server\ghl-express-api.js, apps/server/server\mcp\promptComposer.js... (6 files) |
| GHL_CLIENT_ID | GHL OAuth client ID | apps/server/server\ghl-express-api.js, apps/server/server\test-api.js, apps/server/server\test-connection.js |
| GHL_CLIENT_SECRET | GHL OAuth secret | apps/server/server\ghl-express-api.js, apps/server/server\test-api.js, apps/server/server\test-connection.js |
| GHL_REDIRECT_URI | OAuth redirect URL | apps/server/server\ghl-express-api.js |
| GHL_WEBHOOK_SECRET | Unknown | apps/server/server\ghl-express-api.js |
| GHL_API_ENABLED | Unknown | apps/server/server\ghl-express-api.js |
| ELEVENLABS_API_KEY | Unknown | apps/server/server\ghl-express-api.js, apps/server/server\mcp\examples.js, apps/server/server\mcp\server.js... (4 files) |
| OPENAI_API_KEY | Unknown | apps/server/server\ghl-express-api.js, apps/server/server\mcp\examples.js, apps/server/server\mcp\masterAIManager.js... (7 files) |
| FRONTEND_URL | Unknown | apps/server/server\ghl-express-api.js |
| FRONTEND_DIST_PATH | Frontend build output path | apps/server/server\ghl-express-api.js |
| ENABLE_CORRECTION_SYNC | Unknown | apps/server/server\ghl-express-api.js |
| PORT | Server port | apps/server/server\ghl-express-api.js |
| GHL_BASE_URL | Unknown | apps/server/server\mcp\server.js |
| NODE_OPTIONS | Unknown | apps/server/server\test-render-connection.js |
| GHL_CIRCUIT_BREAKER_THRESHOLD | Unknown | apps/server/server\utils\circuitBreaker.js |
| GHL_CIRCUIT_BREAKER_TIMEOUT | Unknown | apps/server/server\utils\circuitBreaker.js |
| GHL_REQUESTS_PER_SECOND | Unknown | apps/server/server\utils\ghlRequestQueue.js |
| GHL_MAX_RETRIES | Unknown | apps/server/server\utils\ghlRequestQueue.js |
| GHL_RETRY_DELAY | Unknown | apps/server/server\utils\ghlRequestQueue.js |

## Build & Deployment

**Platform:** Render.com

**Build Command:**
```bash
npm ci && npm run build
```

**Start Command:**
```bash
node apps/server/ghl-express-api.js
```

## Risk Assessment

- **Duplicate Routes:** Found 5 duplicate(s)
- **Missing Env Vars:** Check that all env vars are set in Render dashboard
- **Build Dependencies:** Ensure npm ci runs successfully

