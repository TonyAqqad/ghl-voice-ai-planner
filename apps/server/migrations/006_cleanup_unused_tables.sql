-- ============================================================================
-- GHL Voice AI Planner - Cleanup Unused Tables
-- ============================================================================
-- Purpose: Remove deprecated/unused tables to keep database clean
-- Version: 1.0
-- Date: 2025-11-03
--
-- IMPORTANT: Review the analysis below before running!
-- This will DROP tables and DELETE data permanently.
-- ============================================================================

-- ============================================================================
-- ANALYSIS: Tables in Your Database
-- ============================================================================
-- 
-- ✅ KEEP - Core Tables (actively used):
--   - agent_call_logs
--   - agent_logs
--   - agent_prompt_reviews
--   - agent_prompts
--   - agent_response_corrections
--   - agents
--   - locations
--   - tokens
--   - prompt_kits
--   - prompt_kits_niche_overlays
--   - cost_entries
--
-- ✅ KEEP - New Context7 Tables (just created):
--   - agent_training_snippets
--   - master_memories
--   - context7_scopes
--
-- ✅ KEEP - MCP Tables (for monitoring):
--   - mcp_action_retries
--   - mcp_agent_states
--   - mcp_feedback
--   - mcp_health_checks
--   - mcp_incidents
--   - mcp_traces
--
-- ⚠️ EVALUATE - Potentially Unused:
--   - agent_training_data (marked "Unrestricted")
--   - learned_patterns (marked "Unrestricted")
--
-- ❌ REMOVE - Duplicates/Deprecated:
--   (None identified yet - need to check your usage)
--
-- ============================================================================

\echo '========================================'
\echo 'Database Cleanup Analysis'
\echo '========================================'
\echo ''
\echo 'This script will help you identify and remove unused tables.'
\echo 'We will be VERY CAREFUL and check data first!'
\echo ''

-- ============================================================================
-- STEP 1: Check Potentially Unused Tables
-- ============================================================================

\echo 'STEP 1: Checking potentially unused tables...'
\echo '=========================================='
\echo ''

-- Check agent_training_data
\echo 'Checking agent_training_data...'
SELECT 
  'agent_training_data' as table_name,
  COUNT(*) as row_count,
  pg_size_pretty(pg_total_relation_size('agent_training_data')) as table_size,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ SAFE TO DROP (empty)'
    ELSE '⚠️ HAS DATA - Review before dropping'
  END as recommendation
FROM agent_training_data;

\echo ''

-- Check learned_patterns
\echo 'Checking learned_patterns...'
SELECT 
  'learned_patterns' as table_name,
  COUNT(*) as row_count,
  pg_size_pretty(pg_total_relation_size('learned_patterns')) as table_size,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ SAFE TO DROP (empty)'
    ELSE '⚠️ HAS DATA - Review before dropping'
  END as recommendation
FROM learned_patterns;

\echo ''
\echo 'Review the recommendations above before proceeding!'
\echo ''

-- ============================================================================
-- STEP 2: Check Table Schemas (to understand what they store)
-- ============================================================================

\echo 'STEP 2: Understanding table structures...'
\echo '=========================================='
\echo ''

-- agent_training_data structure
\echo 'agent_training_data columns:'
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'agent_training_data'
  AND table_schema = 'public'
ORDER BY ordinal_position;

\echo ''

-- learned_patterns structure
\echo 'learned_patterns columns:'
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'learned_patterns'
  AND table_schema = 'public'
ORDER BY ordinal_position;

\echo ''

-- ============================================================================
-- STEP 3: Check for Foreign Key Dependencies
-- ============================================================================

\echo 'STEP 3: Checking for foreign key dependencies...'
\echo '=========================================='
\echo ''

-- Check if any other tables reference agent_training_data
SELECT 
  tc.table_name as referencing_table,
  kcu.column_name as referencing_column,
  ccu.table_name as referenced_table,
  ccu.column_name as referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND (ccu.table_name = 'agent_training_data' OR ccu.table_name = 'learned_patterns')
ORDER BY tc.table_name;

\echo ''
\echo 'If results shown above, other tables depend on these!'
\echo 'If no results, safe to drop.'
\echo ''

-- ============================================================================
-- STEP 4: Sample Data (if exists)
-- ============================================================================

\echo 'STEP 4: Sample data (to decide if important)...'
\echo '=========================================='
\echo ''

-- Show sample from agent_training_data
\echo 'Sample from agent_training_data (first 3 rows):'
SELECT * FROM agent_training_data LIMIT 3;

\echo ''

-- Show sample from learned_patterns
\echo 'Sample from learned_patterns (first 3 rows):'
SELECT * FROM learned_patterns LIMIT 3;

\echo ''

-- ============================================================================
-- DECISION POINT - DO NOT PROCEED PAST HERE WITHOUT REVIEWING ABOVE!
-- ============================================================================

\echo '========================================'
\echo 'DECISION POINT'
\echo '========================================'
\echo ''
\echo 'Review the analysis above and decide:'
\echo ''
\echo 'Option 1: Tables are EMPTY and safe to drop'
\echo '  -> Uncomment the DROP statements in STEP 5'
\echo ''
\echo 'Option 2: Tables have DATA but are unused'
\echo '  -> Export data first (pg_dump), then drop'
\echo ''
\echo 'Option 3: Tables are ACTUALLY USED'
\echo '  -> STOP! Do not drop these tables'
\echo ''
\echo 'Press Ctrl+C to abort now if unsure!'
\echo ''

SELECT pg_sleep(5);  -- 5 second pause to review

-- ============================================================================
-- STEP 5: Drop Tables (UNCOMMENT ONLY IF SAFE)
-- ============================================================================

/*
-- COMMENTED OUT FOR SAFETY
-- Only uncomment these lines if you're CERTAIN these tables should be dropped

BEGIN;

\echo 'Dropping agent_training_data...'
DROP TABLE IF EXISTS agent_training_data CASCADE;

\echo 'Dropping learned_patterns...'
DROP TABLE IF EXISTS learned_patterns CASCADE;

\echo ''
\echo 'Tables dropped successfully!'
\echo ''

-- Verify they're gone
SELECT 
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('agent_training_data', 'learned_patterns');

\echo ''
\echo 'If no results above, cleanup complete!'
\echo ''

COMMIT;
*/

\echo '========================================'
\echo 'Cleanup Script Complete'
\echo '========================================'
\echo ''
\echo 'Next steps:'
\echo '  1. Review the analysis above'
\echo '  2. If tables are empty/unused, uncomment STEP 5'
\echo '  3. Re-run this script to actually drop tables'
\echo '  4. Verify with: SELECT * FROM information_schema.tables WHERE table_schema = ''public'';'
\echo ''
\echo '========================================'

