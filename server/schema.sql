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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tokens_location_id ON tokens(location_id);
CREATE INDEX IF NOT EXISTS idx_tokens_created_at ON tokens(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_locations_location_id ON locations(location_id);
CREATE INDEX IF NOT EXISTS idx_agents_agent_id ON agents(agent_id);
CREATE INDEX IF NOT EXISTS idx_agents_location_id ON agents(location_id);
CREATE INDEX IF NOT EXISTS idx_cost_entries_agent_id ON cost_entries(agent_id);
CREATE INDEX IF NOT EXISTS idx_cost_entries_timestamp ON cost_entries(timestamp DESC);

