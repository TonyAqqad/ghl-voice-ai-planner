-- GHL Voice AI Platform Database Schema
-- Supabase PostgreSQL

-- Tokens table for OAuth storage
CREATE TABLE IF NOT EXISTS tokens (
    id SERIAL PRIMARY KEY,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at BIGINT,
    location_id TEXT,
    company_token BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Locations table for GHL sub-accounts
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    location_id TEXT UNIQUE NOT NULL,
    location_token TEXT,
    name TEXT,
    company_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Voice AI agents table
CREATE TABLE IF NOT EXISTS agents (
    id SERIAL PRIMARY KEY,
    agent_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    location_id TEXT,
    voice_id TEXT,
    system_prompt TEXT,
    config JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cost tracking table
CREATE TABLE IF NOT EXISTS cost_entries (
    id SERIAL PRIMARY KEY,
    agent_id TEXT NOT NULL,
    type TEXT NOT NULL, -- 'call', 'llm_input', 'llm_output', 'tts', 'sms'
    cost DECIMAL(10, 6) NOT NULL,
    details JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agent logs table for MCP structured logging
CREATE TABLE IF NOT EXISTS agent_logs (
    id SERIAL PRIMARY KEY,
    agent_id TEXT NOT NULL,
    action TEXT NOT NULL,
    payload JSONB,
    context JSONB,
    status TEXT NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MCP Agent states table for saveState/loadState
CREATE TABLE IF NOT EXISTS mcp_agent_states (
    id SERIAL PRIMARY KEY,
    agent_id TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    state_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(agent_id, customer_id)
);

-- MCP Health checks table
CREATE TABLE IF NOT EXISTS mcp_health_checks (
    id SERIAL PRIMARY KEY,
    agent_id TEXT NOT NULL,
    healthy BOOLEAN NOT NULL,
    checks_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MCP Incidents table
CREATE TABLE IF NOT EXISTS mcp_incidents (
    id SERIAL PRIMARY KEY,
    agent_id TEXT NOT NULL,
    title TEXT,
    error_message TEXT,
    severity TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'open',
    source TEXT,
    metadata JSONB,
    resolution TEXT,
    updated_by TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MCP Feedback table
CREATE TABLE IF NOT EXISTS mcp_feedback (
    id SERIAL PRIMARY KEY,
    agent_id TEXT NOT NULL,
    user_id TEXT,
    session_id TEXT,
    feedback_type TEXT NOT NULL,
    feedback_text TEXT NOT NULL,
    rating INTEGER,
    context_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MCP Traces table for live tracing
CREATE TABLE IF NOT EXISTS mcp_traces (
    id SERIAL PRIMARY KEY,
    trace_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    step_number INTEGER NOT NULL,
    action TEXT NOT NULL,
    input_data JSONB,
    output_data JSONB,
    context_data JSONB,
    status TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MCP Action retries table
CREATE TABLE IF NOT EXISTS mcp_action_retries (
    id SERIAL PRIMARY KEY,
    action_id TEXT NOT NULL,
    attempt_number INTEGER NOT NULL,
    status TEXT NOT NULL,
    duration_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tokens_location_id ON tokens(location_id);
CREATE INDEX IF NOT EXISTS idx_tokens_created_at ON tokens(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_locations_location_id ON locations(location_id);
CREATE INDEX IF NOT EXISTS idx_agents_agent_id ON agents(agent_id);
CREATE INDEX IF NOT EXISTS idx_agents_location_id ON agents(location_id);
CREATE INDEX IF NOT EXISTS idx_cost_entries_agent_id ON cost_entries(agent_id);
CREATE INDEX IF NOT EXISTS idx_cost_entries_timestamp ON cost_entries(timestamp DESC);

-- MCP indexes
CREATE INDEX IF NOT EXISTS idx_agent_logs_agent_id ON agent_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_created_at ON agent_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_logs_action ON agent_logs(action);
CREATE INDEX IF NOT EXISTS idx_mcp_agent_states_agent_customer ON mcp_agent_states(agent_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_mcp_health_checks_agent_id ON mcp_health_checks(agent_id);
CREATE INDEX IF NOT EXISTS idx_mcp_health_checks_created_at ON mcp_health_checks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mcp_incidents_agent_id ON mcp_incidents(agent_id);
CREATE INDEX IF NOT EXISTS idx_mcp_incidents_status ON mcp_incidents(status);
CREATE INDEX IF NOT EXISTS idx_mcp_incidents_severity ON mcp_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_mcp_feedback_agent_id ON mcp_feedback(agent_id);
CREATE INDEX IF NOT EXISTS idx_mcp_feedback_created_at ON mcp_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mcp_traces_trace_id ON mcp_traces(trace_id);
CREATE INDEX IF NOT EXISTS idx_mcp_traces_agent_id ON mcp_traces(agent_id);
CREATE INDEX IF NOT EXISTS idx_mcp_action_retries_action_id ON mcp_action_retries(action_id);

