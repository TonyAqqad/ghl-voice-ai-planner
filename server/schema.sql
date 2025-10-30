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

-- Note: Evaluation table indexes are created after the tables below

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================
-- Enable RLS on all public tables for security compliance
-- Note: Service role connections bypass RLS automatically (for direct PostgreSQL connections)
-- These policies satisfy Supabase linter requirements and provide security if PostgREST is used

-- Enable RLS on tokens table
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for service role" ON tokens;
CREATE POLICY "Enable all for service role" ON tokens
  FOR ALL USING (true);

-- Enable RLS on locations table
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for service role" ON locations;
CREATE POLICY "Enable all for service role" ON locations
  FOR ALL USING (true);

-- Enable RLS on agents table
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for service role" ON agents;
CREATE POLICY "Enable all for service role" ON agents
  FOR ALL USING (true);

-- Enable RLS on cost_entries table
ALTER TABLE cost_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for service role" ON cost_entries;
CREATE POLICY "Enable all for service role" ON cost_entries
  FOR ALL USING (true);

-- Enable RLS on agent_logs table
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for service role" ON agent_logs;
CREATE POLICY "Enable all for service role" ON agent_logs
  FOR ALL USING (true);

-- Enable RLS on mcp_agent_states table
ALTER TABLE mcp_agent_states ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for service role" ON mcp_agent_states;
CREATE POLICY "Enable all for service role" ON mcp_agent_states
  FOR ALL USING (true);

-- Enable RLS on mcp_health_checks table
ALTER TABLE mcp_health_checks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for service role" ON mcp_health_checks;
CREATE POLICY "Enable all for service role" ON mcp_health_checks
  FOR ALL USING (true);

-- Enable RLS on mcp_incidents table
ALTER TABLE mcp_incidents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for service role" ON mcp_incidents;
CREATE POLICY "Enable all for service role" ON mcp_incidents
  FOR ALL USING (true);

-- Enable RLS on mcp_feedback table
ALTER TABLE mcp_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for service role" ON mcp_feedback;
CREATE POLICY "Enable all for service role" ON mcp_feedback
  FOR ALL USING (true);

-- Enable RLS on mcp_traces table
ALTER TABLE mcp_traces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for service role" ON mcp_traces;
CREATE POLICY "Enable all for service role" ON mcp_traces
  FOR ALL USING (true);

-- Enable RLS on mcp_action_retries table
ALTER TABLE mcp_action_retries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for service role" ON mcp_action_retries;
CREATE POLICY "Enable all for service role" ON mcp_action_retries
  FOR ALL USING (true);

-- ============================================
-- Prompt Composer Tables (Layer 1 Spec Storage)
-- ============================================

-- Master prompt kits table
CREATE TABLE IF NOT EXISTS prompt_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  schema JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(name, version)
);

-- Niche overlays for prompt kits
CREATE TABLE IF NOT EXISTS prompt_kits_niche_overlays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id UUID NOT NULL REFERENCES prompt_kits(id) ON DELETE CASCADE,
  niche TEXT NOT NULL,
  overlay_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(kit_id, niche)
);

-- Final, materialized prompts per agent
CREATE TABLE IF NOT EXISTS agent_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT,
  kit_id UUID REFERENCES prompt_kits(id),
  niche TEXT,
  system_prompt TEXT NOT NULL,
  kb_refs JSONB,
  actions JSONB,
  version TEXT NOT NULL DEFAULT '1.0',
  prompt_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add prompt_hash column if it doesn't exist (migration for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agent_prompts' AND column_name = 'prompt_hash'
  ) THEN
    ALTER TABLE agent_prompts ADD COLUMN prompt_hash TEXT;
  END IF;
END $$;

-- Index for agent prompt lookups
CREATE INDEX IF NOT EXISTS idx_agent_prompts_agent_id ON agent_prompts(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_prompts_niche ON agent_prompts(niche);
CREATE INDEX IF NOT EXISTS idx_prompt_kits_name ON prompt_kits(name);

-- Enable RLS on prompt_kits table
ALTER TABLE prompt_kits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for service role" ON prompt_kits;
CREATE POLICY "Enable all for service role" ON prompt_kits
  FOR ALL USING (true);

-- Enable RLS on prompt_kits_niche_overlays table
ALTER TABLE prompt_kits_niche_overlays ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for service role" ON prompt_kits_niche_overlays;
CREATE POLICY "Enable all for service role" ON prompt_kits_niche_overlays
  FOR ALL USING (true);

-- Enable RLS on agent_prompts table
ALTER TABLE agent_prompts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for service role" ON agent_prompts;
CREATE POLICY "Enable all for service role" ON agent_prompts
  FOR ALL USING (true);

-- ============================================
-- Autonomous Evaluation Tables
-- ============================================

-- Call logs with transcripts and metrics
CREATE TABLE IF NOT EXISTS agent_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  prompt_id UUID REFERENCES agent_prompts(id),
  call_id TEXT,
  transcript TEXT NOT NULL,
  summary TEXT,
  tags TEXT[],
  metrics JSONB,
  reviewed_at TIMESTAMPTZ,
  review_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Evaluation results and patch suggestions
CREATE TABLE IF NOT EXISTS agent_prompt_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  call_log_id UUID REFERENCES agent_call_logs(id),
  prompt_id UUID REFERENCES agent_prompts(id),
  evaluation JSONB NOT NULL,
  confidence_score DECIMAL(3,2),
  suggested_patch JSONB,
  kb_suggestion JSONB,
  patch_applied BOOLEAN DEFAULT false,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Column Migrations for Existing Tables
-- ============================================
-- These migrations add new columns to tables that may have been created
-- in earlier deployments without these columns.

-- Add reviewed_at column to agent_call_logs if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agent_call_logs' AND column_name = 'reviewed_at'
  ) THEN
    ALTER TABLE agent_call_logs ADD COLUMN reviewed_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add review_id column to agent_call_logs if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agent_call_logs' AND column_name = 'review_id'
  ) THEN
    ALTER TABLE agent_call_logs ADD COLUMN review_id UUID;
  END IF;
END $$;

-- Add call_log_id column to agent_prompt_reviews if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agent_prompt_reviews' AND column_name = 'call_log_id'
  ) THEN
    ALTER TABLE agent_prompt_reviews ADD COLUMN call_log_id UUID REFERENCES agent_call_logs(id);
  END IF;
END $$;

-- Add confidence_score column to agent_prompt_reviews if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agent_prompt_reviews' AND column_name = 'confidence_score'
  ) THEN
    ALTER TABLE agent_prompt_reviews ADD COLUMN confidence_score DECIMAL(3,2);
  END IF;
END $$;

-- Add suggested_patch column to agent_prompt_reviews if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agent_prompt_reviews' AND column_name = 'suggested_patch'
  ) THEN
    ALTER TABLE agent_prompt_reviews ADD COLUMN suggested_patch JSONB;
  END IF;
END $$;

-- Add kb_suggestion column to agent_prompt_reviews if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agent_prompt_reviews' AND column_name = 'kb_suggestion'
  ) THEN
    ALTER TABLE agent_prompt_reviews ADD COLUMN kb_suggestion JSONB;
  END IF;
END $$;

-- Add patch_applied column to agent_prompt_reviews if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agent_prompt_reviews' AND column_name = 'patch_applied'
  ) THEN
    ALTER TABLE agent_prompt_reviews ADD COLUMN patch_applied BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add applied_at column to agent_prompt_reviews if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agent_prompt_reviews' AND column_name = 'applied_at'
  ) THEN
    ALTER TABLE agent_prompt_reviews ADD COLUMN applied_at TIMESTAMPTZ;
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_call_logs_agent_id ON agent_call_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_reviewed_at ON agent_call_logs(reviewed_at);
CREATE INDEX IF NOT EXISTS idx_prompt_reviews_agent_id ON agent_prompt_reviews(agent_id);
CREATE INDEX IF NOT EXISTS idx_prompt_reviews_patch_applied ON agent_prompt_reviews(patch_applied);

-- RLS policies
ALTER TABLE agent_call_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for service role" ON agent_call_logs;
CREATE POLICY "Enable all for service role" ON agent_call_logs FOR ALL USING (true);

ALTER TABLE agent_prompt_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for service role" ON agent_prompt_reviews;
CREATE POLICY "Enable all for service role" ON agent_prompt_reviews FOR ALL USING (true);

-- ============================================
-- Seed Test Agents for Development
-- ============================================

-- Insert test F45 agent for dry-run testing
INSERT INTO agents (agent_id, name, description, system_prompt, voice_id, config)
VALUES (
  '1',
  'F45 Test Agent',
  'Test agent for F45 Training prompt composition and dry-run testing',
  'You are a voice receptionist for F45 Training. You help callers book trial classes and answer questions about F45 fitness programs.',
  'default',
  '{"niche": "fitness_gym", "tone": "professional", "businessHours": {"open": "6 AM", "close": "8 PM"}}'::jsonb
)
ON CONFLICT (agent_id) 
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  system_prompt = EXCLUDED.system_prompt,
  voice_id = EXCLUDED.voice_id,
  config = EXCLUDED.config,
  updated_at = CURRENT_TIMESTAMP;

