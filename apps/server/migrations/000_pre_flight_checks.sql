-- ============================================================================
-- GHL Voice AI Planner - Pre-Flight Checks
-- ============================================================================
-- Purpose: Verify data integrity before running schema migration
-- Version: 1.0
-- Date: 2025-11-03
--
-- Run these checks BEFORE executing 001_improved_schema_migration.sql
-- ============================================================================

\echo '========================================'
\echo 'PRE-FLIGHT CHECKS - Data Integrity'
\echo '========================================'
\echo ''

-- ============================================================================
-- CHECK 1: Orphaned agent_id references in agents table
-- ============================================================================
\echo 'CHECK 1: Orphaned location references in agents table'
\echo '=========================================='

SELECT 
  COUNT(*) as orphaned_count,
  ARRAY_AGG(DISTINCT a.location_id) as orphaned_location_ids
FROM public.agents a
WHERE a.location_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM public.locations l 
    WHERE l.location_id = a.location_id
  );

\echo ''
\echo 'Expected: orphaned_count = 0'
\echo 'If orphaned_count > 0, you need to either:'
\echo '  1. Create missing locations, OR'
\echo '  2. Set orphaned location_ids to NULL'
\echo ''

-- ============================================================================
-- CHECK 2: Orphaned location references in tokens table
-- ============================================================================
\echo 'CHECK 2: Orphaned location references in tokens table'
\echo '=========================================='

SELECT 
  COUNT(*) as orphaned_count,
  ARRAY_AGG(DISTINCT t.location_id) as orphaned_location_ids
FROM public.tokens t
WHERE t.location_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM public.locations l 
    WHERE l.location_id = t.location_id
  );

\echo ''
\echo 'Expected: orphaned_count = 0'
\echo ''

-- ============================================================================
-- CHECK 3: Current tags column state in agent_call_logs
-- ============================================================================
\echo 'CHECK 3: Tags column current state'
\echo '=========================================='

SELECT 
  column_name,
  data_type,
  udt_name,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'agent_call_logs'
  AND column_name LIKE 'tags%'
ORDER BY column_name;

\echo ''
\echo 'Expected: Either "tags" or "tags_legacy" (not both)'
\echo 'If "tags" exists with wrong type, migration will rename it'
\echo ''

-- ============================================================================
-- CHECK 4: Duplicate prompt_hash values
-- ============================================================================
\echo 'CHECK 4: Duplicate prompt_hash values'
\echo '=========================================='

SELECT 
  prompt_hash,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id) as duplicate_ids
FROM public.agent_prompts 
WHERE prompt_hash IS NOT NULL
GROUP BY prompt_hash 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 10;

\echo ''
\echo 'Expected: No results (no duplicates)'
\echo 'If duplicates exist, they are still valid (same hash = same prompt)'
\echo ''

-- ============================================================================
-- CHECK 5: Verify required tables exist
-- ============================================================================
\echo 'CHECK 5: Required tables exist'
\echo '=========================================='

SELECT 
  table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = t.table_name
    ) THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END as status
FROM (VALUES 
  ('agents'),
  ('locations'),
  ('tokens'),
  ('agent_prompts'),
  ('agent_call_logs'),
  ('agent_prompt_reviews'),
  ('agent_response_corrections')
) AS t(table_name)
ORDER BY table_name;

\echo ''
\echo 'Expected: All tables show "✓ EXISTS"'
\echo ''

-- ============================================================================
-- CHECK 6: Existing column status in target tables
-- ============================================================================
\echo 'CHECK 6: Column existence check'
\echo '=========================================='

SELECT 
  table_name,
  column_name,
  '✓ EXISTS' as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'agent_prompts' AND column_name IN ('status', 'rev', 'hash'))
    OR (table_name = 'agent_call_logs' AND column_name IN ('tags', 'tags_legacy', 'channel', 'niche', 'owner_ref', 'scorecard'))
    OR (table_name = 'agents' AND column_name = 'location_id')
  )
ORDER BY table_name, column_name;

\echo ''
\echo 'Note: Columns shown above already exist and will be skipped by migration'
\echo ''

-- ============================================================================
-- CHECK 7: Table row counts (for verification post-migration)
-- ============================================================================
\echo 'CHECK 7: Current row counts (baseline)'
\echo '=========================================='

SELECT 
  'agents' as table_name, 
  COUNT(*) as row_count 
FROM public.agents
UNION ALL
SELECT 
  'locations', 
  COUNT(*) 
FROM public.locations
UNION ALL
SELECT 
  'agent_prompts', 
  COUNT(*) 
FROM public.agent_prompts
UNION ALL
SELECT 
  'agent_call_logs', 
  COUNT(*) 
FROM public.agent_call_logs
ORDER BY table_name;

\echo ''
\echo 'Save these counts to verify no data loss after migration'
\echo ''

-- ============================================================================
-- CHECK 8: Check for potential FK constraint violations
-- ============================================================================
\echo 'CHECK 8: Potential FK constraint violations'
\echo '=========================================='

-- Check agent_call_logs -> agent_prompts
SELECT 
  'agent_call_logs->agent_prompts' as check_name,
  COUNT(*) as violation_count
FROM public.agent_call_logs acl
WHERE acl.prompt_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.agent_prompts ap 
    WHERE ap.id = acl.prompt_id
  )

UNION ALL

-- Check agent_prompt_reviews -> agent_call_logs
SELECT 
  'agent_prompt_reviews->agent_call_logs',
  COUNT(*)
FROM public.agent_prompt_reviews apr
WHERE apr.call_log_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.agent_call_logs acl 
    WHERE acl.id = apr.call_log_id
  )

UNION ALL

-- Check agent_response_corrections -> agent_call_logs
SELECT 
  'agent_response_corrections->agent_call_logs',
  COUNT(*)
FROM public.agent_response_corrections arc
WHERE arc.call_log_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.agent_call_logs acl 
    WHERE acl.id = arc.call_log_id
  );

\echo ''
\echo 'Expected: violation_count = 0 for all checks'
\echo 'These FKs already exist, so violations would cause data issues'
\echo ''

-- ============================================================================
-- CHECK 9: Database version and settings
-- ============================================================================
\echo 'CHECK 9: PostgreSQL version and settings'
\echo '=========================================='

SELECT 
  version() as postgres_version,
  current_database() as database_name,
  current_user as current_user,
  pg_size_pretty(pg_database_size(current_database())) as database_size;

\echo ''

-- ============================================================================
-- SUMMARY
-- ============================================================================
\echo '========================================'
\echo 'PRE-FLIGHT CHECKS COMPLETE'
\echo '========================================'
\echo ''
\echo 'Review results above. If all checks pass:'
\echo '  ✓ No orphaned references'
\echo '  ✓ All required tables exist'
\echo '  ✓ No FK violations'
\echo ''
\echo 'Then you are SAFE to run:'
\echo '  001_improved_schema_migration.sql'
\echo ''
\echo 'If any checks FAIL:'
\echo '  1. Fix data integrity issues first'
\echo '  2. Re-run these pre-flight checks'
\echo '  3. Then proceed with migration'
\echo ''
\echo '========================================'

