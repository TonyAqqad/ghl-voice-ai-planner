-- ============================================================================
-- GHL Voice AI Planner - Improved Schema Migration
-- ============================================================================
-- Purpose: Enhanced schema migration with Context7 integration support
-- Version: 1.0
-- Date: 2025-11-03
-- 
-- IMPORTANT: Run pre-flight checks before executing this migration!
-- See: 000_pre_flight_checks.sql
--
-- This migration is IDEMPOTENT - safe to run multiple times
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: agent_prompts - Add status + rev, drop duplicate hash col
-- ============================================================================

ALTER TABLE public.agent_prompts
  ADD COLUMN IF NOT EXISTS status text
    CHECK (status IN ('draft','approved')) DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS rev bigint DEFAULT 1;

-- Drop hash column if it exists (keeping prompt_hash)
ALTER TABLE public.agent_prompts
  DROP COLUMN IF EXISTS hash;

-- Performance indices for prompt lineage tracking
CREATE INDEX IF NOT EXISTS idx_agent_prompts_scope
  ON public.agent_prompts (agent_id, niche, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_prompts_hash
  ON public.agent_prompts (prompt_hash);

-- Additional index for revision tracking
CREATE INDEX IF NOT EXISTS idx_agent_prompts_rev
  ON public.agent_prompts (agent_id, rev DESC);

COMMENT ON COLUMN public.agent_prompts.status IS 'Prompt approval status: draft (testing) or approved (production)';
COMMENT ON COLUMN public.agent_prompts.rev IS 'Revision number for prompt versioning';

-- ============================================================================
-- SECTION 2: agent_call_logs - Fix tags type; add channel/niche/owner_ref/scorecard
-- ============================================================================

-- Safely migrate tags column from incorrect type to text[]
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='agent_call_logs' AND column_name='tags'
      AND data_type != 'ARRAY' -- Only rename if it's not already the correct type
  ) THEN
    ALTER TABLE public.agent_call_logs RENAME COLUMN tags TO tags_legacy;
  END IF;
END$$;

-- Add new columns for enhanced call tracking
ALTER TABLE public.agent_call_logs
  ADD COLUMN IF NOT EXISTS tags text[],
  ADD COLUMN IF NOT EXISTS channel text CHECK (channel IN ('sms','voice')),
  ADD COLUMN IF NOT EXISTS niche text,
  ADD COLUMN IF NOT EXISTS owner_ref text,
  ADD COLUMN IF NOT EXISTS scorecard jsonb;

-- Performance indices for call log queries
CREATE INDEX IF NOT EXISTS idx_call_logs_agent_created
  ON public.agent_call_logs (agent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_call_logs_channel
  ON public.agent_call_logs (channel);

CREATE INDEX IF NOT EXISTS idx_call_logs_owner
  ON public.agent_call_logs (owner_ref);

-- NEW: Additional indices for Context7 integration
CREATE INDEX IF NOT EXISTS idx_call_logs_niche_created
  ON public.agent_call_logs (niche, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_call_logs_tags_gin
  ON public.agent_call_logs USING GIN (tags);

CREATE INDEX IF NOT EXISTS idx_call_logs_scorecard_gin
  ON public.agent_call_logs USING GIN (scorecard);

COMMENT ON COLUMN public.agent_call_logs.channel IS 'Communication channel: sms or voice';
COMMENT ON COLUMN public.agent_call_logs.niche IS 'Business niche/industry vertical for context-aware training';
COMMENT ON COLUMN public.agent_call_logs.owner_ref IS 'Reference to location or company owner for data scoping';
COMMENT ON COLUMN public.agent_call_logs.scorecard IS 'Evaluation metrics and rubric scores (JSON)';

-- ============================================================================
-- SECTION 3: agent_training_snippets - Scoped snippets for runtime injection
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.agent_training_snippets (
  id bigserial PRIMARY KEY,
  location_id text NOT NULL,
  agent_id text NOT NULL,
  prompt_hash text NOT NULL,
  phase text NOT NULL CHECK (phase IN ('opening','collect','verify','book','fallback')),
  trigger text NOT NULL,
  text text NOT NULL CHECK (length(text) <= 200),
  uses int DEFAULT 0,
  rank int DEFAULT 0,
  rev bigint DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Composite index for scoped snippet lookup (location+agent+prompt+phase)
CREATE INDEX IF NOT EXISTS idx_snippets_scope
  ON public.agent_training_snippets (location_id, agent_id, prompt_hash, phase);

-- NEW: Performance index for usage-based ranking
CREATE INDEX IF NOT EXISTS idx_snippets_usage
  ON public.agent_training_snippets (uses DESC, rank DESC);

-- NEW: Index for temporal queries
CREATE INDEX IF NOT EXISTS idx_snippets_created
  ON public.agent_training_snippets (created_at DESC);

COMMENT ON TABLE public.agent_training_snippets IS 'Runtime-injected snippets (≤200 chars) for scoped agent learning';
COMMENT ON COLUMN public.agent_training_snippets.phase IS 'Conversation phase: opening, collect, verify, book, or fallback';
COMMENT ON COLUMN public.agent_training_snippets.trigger IS 'Pattern or keyword that triggers this snippet';
COMMENT ON COLUMN public.agent_training_snippets.uses IS 'Number of times this snippet was used (for ranking)';
COMMENT ON COLUMN public.agent_training_snippets.rank IS 'Manual ranking override (higher = more priority)';

-- ============================================================================
-- SECTION 4: master_memories - Master AI learning repository
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.master_memories (
  id bigserial PRIMARY KEY,
  master_agent_id text NOT NULL,
  niche text,
  owner_ref text,
  voice_agent_id text,
  lesson_type text NOT NULL CHECK (lesson_type IN ('praise','correction','kb_delta')),
  trigger text,
  content jsonb NOT NULL,
  last_applied_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- NEW: Optimized lookup index for master AI queries
CREATE INDEX IF NOT EXISTS idx_master_memories_lookup
  ON public.master_memories (master_agent_id, niche, lesson_type);

-- NEW: Index for temporal analysis
CREATE INDEX IF NOT EXISTS idx_master_memories_created
  ON public.master_memories (created_at DESC);

-- NEW: Index for usage tracking
CREATE INDEX IF NOT EXISTS idx_master_memories_applied
  ON public.master_memories (last_applied_at DESC NULLS LAST);

-- NEW: GIN index for content search
CREATE INDEX IF NOT EXISTS idx_master_memories_content_gin
  ON public.master_memories USING GIN (content);

COMMENT ON TABLE public.master_memories IS 'Master AI learning repository for praise, corrections, and KB deltas';
COMMENT ON COLUMN public.master_memories.lesson_type IS 'Type of lesson: praise (good example), correction (fix), or kb_delta (knowledge update)';
COMMENT ON COLUMN public.master_memories.trigger IS 'Optional trigger pattern for context-aware retrieval';
COMMENT ON COLUMN public.master_memories.content IS 'JSON payload containing the lesson details';

-- ============================================================================
-- SECTION 5: context7_scopes - Context7 integration tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.context7_scopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_id text NOT NULL UNIQUE,
  location_id text NOT NULL,
  agent_id text NOT NULL,
  prompt_hash text NOT NULL,
  snippet_count int DEFAULT 0,
  memory_source text CHECK (memory_source IN ('localStorage', 'context7')) DEFAULT 'localStorage',
  last_synced_at timestamptz,
  sync_status text CHECK (sync_status IN ('pending', 'syncing', 'synced', 'error')) DEFAULT 'pending',
  error_message text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Unique scope identifier (location+agent+prompt_hash)
CREATE UNIQUE INDEX IF NOT EXISTS idx_context7_scopes_unique
  ON public.context7_scopes (location_id, agent_id, prompt_hash);

-- Lookup by scope_id
CREATE INDEX IF NOT EXISTS idx_context7_scopes_scope_id
  ON public.context7_scopes (scope_id);

-- Filter by sync status
CREATE INDEX IF NOT EXISTS idx_context7_scopes_status
  ON public.context7_scopes (sync_status, last_synced_at DESC);

-- Temporal queries
CREATE INDEX IF NOT EXISTS idx_context7_scopes_updated
  ON public.context7_scopes (updated_at DESC);

COMMENT ON TABLE public.context7_scopes IS 'Context7 memory API integration tracking and scope management';
COMMENT ON COLUMN public.context7_scopes.scope_id IS 'Format: scope:{location}:{agent}:{prompt_hash}';
COMMENT ON COLUMN public.context7_scopes.snippet_count IS 'Number of snippets stored in this scope';
COMMENT ON COLUMN public.context7_scopes.memory_source IS 'Current memory backend: localStorage or context7';
COMMENT ON COLUMN public.context7_scopes.sync_status IS 'Sync state: pending, syncing, synced, or error';

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_context7_scopes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER context7_scopes_updated_at
  BEFORE UPDATE ON public.context7_scopes
  FOR EACH ROW
  EXECUTE FUNCTION update_context7_scopes_updated_at();

-- ============================================================================
-- SECTION 6: Enhanced agent/location relationships
-- ============================================================================

-- Add location_id to agents if not exists
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS location_id text;

-- Performance index for agent-location queries
CREATE INDEX IF NOT EXISTS idx_agents_location
  ON public.agents (location_id);

COMMENT ON COLUMN public.agents.location_id IS 'Reference to locations.location_id (FK constraint optional)';

-- ============================================================================
-- SECTION 7: Foreign Key Constraints (OPTIONAL - Enable after data verification)
-- ============================================================================
-- 
-- IMPORTANT: Only uncomment these if you've verified data integrity!
-- Run the pre-flight checks first to ensure no orphaned records.
--
-- Enable referential integrity for agents -> locations:
-- ALTER TABLE public.agents
--   ADD CONSTRAINT agents_location_fk
--   FOREIGN KEY (location_id) REFERENCES public.locations(location_id)
--   ON DELETE SET NULL;
--
-- Enable referential integrity for tokens -> locations:
-- ALTER TABLE public.tokens
--   ADD CONSTRAINT tokens_location_fk
--   FOREIGN KEY (location_id) REFERENCES public.locations(location_id)
--   ON DELETE SET NULL;
--
-- Link context7_scopes -> locations:
-- ALTER TABLE public.context7_scopes
--   ADD CONSTRAINT context7_scopes_location_fk
--   FOREIGN KEY (location_id) REFERENCES public.locations(location_id)
--   ON DELETE CASCADE;
--
-- Link context7_scopes -> agents:
-- ALTER TABLE public.context7_scopes
--   ADD CONSTRAINT context7_scopes_agent_fk
--   FOREIGN KEY (agent_id) REFERENCES public.agents(agent_id)
--   ON DELETE CASCADE;

-- ============================================================================
-- SECTION 8: Verification Queries
-- ============================================================================

-- Run these after migration to verify success
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration Verification';
  RAISE NOTICE '========================================';
  
  RAISE NOTICE 'agent_prompts rows: %', (SELECT COUNT(*) FROM public.agent_prompts);
  RAISE NOTICE 'agent_call_logs rows: %', (SELECT COUNT(*) FROM public.agent_call_logs);
  RAISE NOTICE 'agent_training_snippets rows: %', (SELECT COUNT(*) FROM public.agent_training_snippets);
  RAISE NOTICE 'master_memories rows: %', (SELECT COUNT(*) FROM public.master_memories);
  RAISE NOTICE 'context7_scopes rows: %', (SELECT COUNT(*) FROM public.context7_scopes);
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'New Indices Created:';
  RAISE NOTICE '========================================';
  
  RAISE NOTICE 'Total indices: %', (
    SELECT COUNT(*) 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename IN (
      'agent_prompts', 
      'agent_call_logs', 
      'agent_training_snippets', 
      'master_memories',
      'context7_scopes'
    )
  );
END$$;

COMMIT;

-- ============================================================================
-- Migration Complete!
-- ============================================================================
-- Next Steps:
-- 1. Review the verification output above
-- 2. Test Context7 integration with new tables
-- 3. Monitor query performance with new indices
-- 4. Consider enabling FK constraints after data cleanup
-- ============================================================================

