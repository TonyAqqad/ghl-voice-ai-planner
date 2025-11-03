-- ============================================================================
-- GHL Voice AI Planner - Rollback Migration
-- ============================================================================
-- Purpose: Safely rollback changes from 001_improved_schema_migration.sql
-- Version: 1.0
-- Date: 2025-11-03
--
-- WARNING: This will DROP newly created tables and indices!
-- Only run this if you need to undo the migration completely.
--
-- DATA LOSS WARNING:
-- - Drops context7_scopes table (and all its data)
-- - Drops agent_training_snippets table (and all its data)
-- - Drops master_memories table (and all its data)
--
-- SAFE OPERATIONS:
-- - Does NOT drop columns from existing tables (to preserve data)
-- - Does NOT remove existing rows
-- ============================================================================

BEGIN;

\echo '========================================'
\echo 'ROLLBACK MIGRATION - Starting'
\echo '========================================'
\echo ''
\echo 'WARNING: This will remove tables and indices!'
\echo 'Press Ctrl+C now to abort, or continue to proceed...'
\echo ''

-- Give time to abort (in psql client)
SELECT pg_sleep(3);

-- ============================================================================
-- SECTION 1: Drop Context7 Scope Tracking
-- ============================================================================

\echo 'Dropping context7_scopes table and related objects...'

-- Drop trigger first
DROP TRIGGER IF EXISTS context7_scopes_updated_at ON public.context7_scopes;

-- Drop function
DROP FUNCTION IF EXISTS update_context7_scopes_updated_at();

-- Drop indices
DROP INDEX IF EXISTS public.idx_context7_scopes_unique;
DROP INDEX IF EXISTS public.idx_context7_scopes_scope_id;
DROP INDEX IF EXISTS public.idx_context7_scopes_status;
DROP INDEX IF EXISTS public.idx_context7_scopes_updated;

-- Drop table
DROP TABLE IF EXISTS public.context7_scopes;

\echo '✓ context7_scopes removed'
\echo ''

-- ============================================================================
-- SECTION 2: Drop Agent Training Snippets
-- ============================================================================

\echo 'Dropping agent_training_snippets table and related objects...'

-- Drop indices
DROP INDEX IF EXISTS public.idx_snippets_scope;
DROP INDEX IF EXISTS public.idx_snippets_usage;
DROP INDEX IF EXISTS public.idx_snippets_created;

-- Drop table
DROP TABLE IF EXISTS public.agent_training_snippets;

\echo '✓ agent_training_snippets removed'
\echo ''

-- ============================================================================
-- SECTION 3: Drop Master Memories
-- ============================================================================

\echo 'Dropping master_memories table and related objects...'

-- Drop indices
DROP INDEX IF EXISTS public.idx_master_memories_lookup;
DROP INDEX IF EXISTS public.idx_master_memories_created;
DROP INDEX IF EXISTS public.idx_master_memories_applied;
DROP INDEX IF EXISTS public.idx_master_memories_content_gin;

-- Drop table
DROP TABLE IF EXISTS public.master_memories;

\echo '✓ master_memories removed'
\echo ''

-- ============================================================================
-- SECTION 4: Drop New Indices from agent_prompts
-- ============================================================================

\echo 'Dropping new indices from agent_prompts...'

DROP INDEX IF EXISTS public.idx_agent_prompts_scope;
DROP INDEX IF EXISTS public.idx_agent_prompts_hash;
DROP INDEX IF EXISTS public.idx_agent_prompts_rev;

\echo '✓ agent_prompts indices removed'
\echo ''

-- ============================================================================
-- SECTION 5: Drop New Indices from agent_call_logs
-- ============================================================================

\echo 'Dropping new indices from agent_call_logs...'

DROP INDEX IF EXISTS public.idx_call_logs_agent_created;
DROP INDEX IF EXISTS public.idx_call_logs_channel;
DROP INDEX IF EXISTS public.idx_call_logs_owner;
DROP INDEX IF EXISTS public.idx_call_logs_niche_created;
DROP INDEX IF EXISTS public.idx_call_logs_tags_gin;
DROP INDEX IF EXISTS public.idx_call_logs_scorecard_gin;

\echo '✓ agent_call_logs indices removed'
\echo ''

-- ============================================================================
-- SECTION 6: Drop New Index from agents
-- ============================================================================

\echo 'Dropping new indices from agents...'

DROP INDEX IF EXISTS public.idx_agents_location;

\echo '✓ agents indices removed'
\echo ''

-- ============================================================================
-- SECTION 7: Revert Column Changes (OPTIONAL - Commented out for safety)
-- ============================================================================
--
-- WARNING: Uncommenting these will DELETE DATA!
-- Only do this if you're absolutely sure you want to lose this data.
--
-- Revert agent_prompts columns:
-- ALTER TABLE public.agent_prompts DROP COLUMN IF EXISTS status;
-- ALTER TABLE public.agent_prompts DROP COLUMN IF EXISTS rev;
--
-- Revert agent_call_logs columns:
-- ALTER TABLE public.agent_call_logs DROP COLUMN IF EXISTS tags;
-- ALTER TABLE public.agent_call_logs DROP COLUMN IF EXISTS channel;
-- ALTER TABLE public.agent_call_logs DROP COLUMN IF EXISTS niche;
-- ALTER TABLE public.agent_call_logs DROP COLUMN IF EXISTS owner_ref;
-- ALTER TABLE public.agent_call_logs DROP COLUMN IF EXISTS scorecard;
--
-- Rename tags_legacy back to tags (if needed):
-- ALTER TABLE public.agent_call_logs RENAME COLUMN tags_legacy TO tags;
--
-- Revert agents columns:
-- ALTER TABLE public.agents DROP COLUMN IF EXISTS location_id;

\echo ''
\echo 'NOTE: Column changes were NOT reverted (to preserve data)'
\echo 'If you need to remove columns, uncomment SECTION 7 in this script'
\echo ''

-- ============================================================================
-- SECTION 8: Verification
-- ============================================================================

\echo '========================================'
\echo 'Rollback Verification'
\echo '========================================'

DO $$
DECLARE
  context7_exists boolean;
  snippets_exists boolean;
  memories_exists boolean;
BEGIN
  -- Check if tables still exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'context7_scopes'
  ) INTO context7_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'agent_training_snippets'
  ) INTO snippets_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'master_memories'
  ) INTO memories_exists;

  RAISE NOTICE 'context7_scopes exists: %', context7_exists;
  RAISE NOTICE 'agent_training_snippets exists: %', snippets_exists;
  RAISE NOTICE 'master_memories exists: %', memories_exists;
  
  IF context7_exists OR snippets_exists OR memories_exists THEN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  WARNING: Some tables still exist!';
    RAISE NOTICE 'Rollback may not have completed successfully.';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '✓ All new tables successfully removed';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Remaining indices count: %', (
    SELECT COUNT(*) 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename IN ('agent_prompts', 'agent_call_logs', 'agents')
  );
END$$;

\echo ''
\echo '========================================'

COMMIT;

-- ============================================================================
-- Rollback Complete
-- ============================================================================
-- Next Steps:
-- 1. Verify tables are removed (should show "false" above)
-- 2. Check your application still works with reverted schema
-- 3. If columns need to be removed, uncomment SECTION 7 and re-run
-- 4. Consider keeping indices even if reverting tables (for performance)
-- ============================================================================

\echo ''
\echo 'Rollback complete!'
\echo ''
\echo 'If you need to remove columns added by the migration,'
\echo 'uncomment SECTION 7 in this script and re-run.'
\echo ''

