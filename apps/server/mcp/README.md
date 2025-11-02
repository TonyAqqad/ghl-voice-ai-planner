# MCP Server for Voice AI

Complete Model Context Protocol (MCP) server implementation for Voice AI agents with GoHighLevel, ElevenLabs, and OpenAI integration.

## Overview

This MCP server provides 17 primitives organized into:
- **Core Primitives** (7): Voice agents, workflows, webhooks, contacts, actions, logging, integrations
- **Self-Healing/Monitoring Primitives** (7): Auto-recovery, anomaly detection, feedback loops, config drift, live tracing, auto-patching, incident reporting

## Architecture

```
server/mcp/
├── index.js              # Module exports
├── server.js             # Express router with all endpoints
├── primitives/           # Core MCP primitives
│   ├── voiceAgent.js
│   ├── ghl.js
│   ├── webhook.js
│   ├── contact.js
│   ├── action.js
│   ├── agent.js
│   └── integration.js
└── monitoring/           # Self-healing primitives
    ├── autoRecovery.js
    ├── anomalyDetection.js
    ├── feedbackLoop.js
    ├── configDrift.js
    ├── liveTrace.js
    ├── autoPatch.js
    └── incidentReport.js
```

## API Endpoints

All endpoints are prefixed with `/api/mcp`:

### Core Primitives

#### Voice Agent
- `POST /api/mcp/voiceAgent/call` - Invoke voice agent for conversation
- `POST /api/mcp/voiceAgent/generatePrompt` - Generate dynamic prompts

#### GoHighLevel
- `POST /api/mcp/ghl/triggerWorkflow` - Trigger GHL workflows

#### Webhooks
- `POST /api/mcp/webhook/onEvent` - Register event handler
- `POST /api/mcp/webhook/processEvent/:eventType` - Process webhook event

#### Contact Management
- `POST /api/mcp/contact/extractAndUpdate` - Extract and update contact info from transcripts

#### Actions
- `POST /api/mcp/action/retryIfFail` - Retry action with exponential backoff

#### Agent Operations
- `POST /api/mcp/agent/log` - Structured logging
- `POST /api/mcp/agent/checkHealth` - Health checks
- `POST /api/mcp/agent/saveState` - Save agent state
- `POST /api/mcp/agent/loadState` - Load agent state

#### Integrations
- `POST /api/mcp/integration/connect` - Connect to external services

### Monitoring/Self-Healing

- `POST /api/mcp/agent/autoRecovery` - Auto-recover from failures
- `POST /api/mcp/agent/anomalyDetect` - Detect anomalies
- `POST /api/mcp/agent/feedbackLoop` - Collect feedback
- `POST /api/mcp/configDrift/detect` - Detect config drift
- `POST /api/mcp/agent/liveTrace` - Create trace entry
- `GET /api/mcp/agent/getTrace/:traceId` - Get trace
- `POST /api/mcp/autoPatch/deploy` - Deploy patches
- `POST /api/mcp/incidentReport/create` - Create incident
- `GET /api/mcp/incidentReport/getIncidents` - Get incidents

### Health Check
- `GET /api/mcp/health` - System health check

## Usage Examples

### Frontend (React)

```typescript
import { useMCP } from '@/hooks/useMCP';

function MyComponent() {
  const mcp = useMCP();

  // Call voice agent
  const handleVoiceCall = async () => {
    const result = await mcp.voiceAgentCall({
      agentId: 'agent-123',
      phoneNumber: '+1234567890',
      context: { userMessage: 'Hello' }
    });

    if (result.success) {
      console.log('Call succeeded:', result.data);
    }
  };

  // Check health
  const checkHealth = async () => {
    const result = await mcp.agentCheckHealth({
      agentId: 'agent-123',
      checks: ['database', 'apis']
    });
    
    console.log('Health:', result.data);
  };

  // Trigger workflow
  const triggerWorkflow = async () => {
    const result = await mcp.ghlTriggerWorkflow({
      locationId: 'location-123',
      workflowId: 'workflow-456',
      contactId: 'contact-789',
      data: { customField: 'value' }
    });
  };

  return (
    <div>
      <button onClick={handleVoiceCall}>Call Agent</button>
      <button onClick={checkHealth}>Check Health</button>
    </div>
  );
}
```

### Backend (Node.js)

```javascript
const { VoiceAgentPrimitive, GHLPrimitive } = require('./mcp');

// Initialize primitives
const voiceAgent = new VoiceAgentPrimitive({
  elevenlabsApiKey: process.env.ELEVENLABS_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY
});

const ghl = new GHLPrimitive({
  baseUrl: 'https://services.leadconnectorhq.com'
});

// Use primitives
async function example() {
  // Call voice agent
  const callResult = await voiceAgent.call({
    agentId: 'agent-123',
    phoneNumber: '+1234567890',
    context: { userMessage: 'Hello' }
  });

  // Trigger workflow
  const workflowResult = await ghl.triggerWorkflow({
    locationId: 'location-123',
    workflowId: 'workflow-456',
    contactId: 'contact-789'
  });
}
```

## Environment Variables

Add to `server/.env`:

```bash
# Required
ELEVENLABS_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
DATABASE_URL=postgresql://...

# Optional MCP Configuration
MCP_BASE_URL=http://localhost:10000/api/mcp
CHAINLIT_API_KEY=your_chainlit_key (if using Chainlit)
CONTEXT7_API_KEY=your_context7_key (if using Context7)
CONTEXT7_BASE_URL=https://api.context7.ai
```

## Database Setup

Run the SQL schema to create MCP tables:

```bash
# Connect to your Supabase/PostgreSQL database
psql $DATABASE_URL < server/schema.sql
```

Or run via Node.js:

```javascript
const { pool } = require('./database');
const fs = require('fs');
const schema = fs.readFileSync('./schema.sql', 'utf8');
await pool.query(schema);
```

## Cursor IDE Integration

The MCP server is configured in `cursor-agent-builder/mcp.json`. To use MCP primitives in Cursor:

1. Ensure MCP servers are running
2. Cursor will automatically connect to configured servers
3. Use MCP tools in your prompts (e.g., "Use voiceAgent.call to make a call")

## Testing

Test an endpoint:

```bash
# Health check
curl http://localhost:10000/api/mcp/health

# Call voice agent
curl -X POST http://localhost:10000/api/mcp/voiceAgent/call \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "agent-123",
    "phoneNumber": "+1234567890",
    "context": {"userMessage": "Hello"}
  }'
```

## Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Success responses:

```json
{
  "success": true,
  "data": { ... }
}
```

## Monitoring

- All operations are logged to `agent_logs` table
- Health checks stored in `mcp_health_checks`
- Traces available via `agent/liveTrace` and `getTrace`
- Incidents tracked in `mcp_incidents`

## Self-Healing Features

1. **Auto-Recovery**: Automatically rolls back to last working state on failures
2. **Anomaly Detection**: Detects high error rates, missed calls, unresponsive workflows
3. **Config Drift**: Monitors and can auto-repair configuration changes
4. **Auto-Patch**: Deploys tested fixes to production agents
5. **Feedback Loop**: Collects user feedback for continuous improvement

## Next Steps

1. ✅ Install dependencies: `cd server && npm install`
2. ✅ Run database migrations
3. ✅ Set environment variables
4. ✅ Test endpoints
5. ✅ Integrate frontend hook in React components
6. ✅ Set up scheduled health checks (cron job)
7. ✅ Configure Chainlit (optional)

## Support

For issues or questions, check:
- Database connection issues → Verify DATABASE_URL
- API key errors → Check environment variables
- Missing tables → Run schema.sql
- Endpoint 404s → Verify Express router is mounted

