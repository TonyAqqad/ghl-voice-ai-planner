-- ============================================================================
-- GHL Voice AI Planner - Cleanup Tags Legacy Column
-- ============================================================================
-- Purpose: Remove the tags_legacy column after successful migration
-- Version: 1.0
-- Date: 2025-11-03
--
-- Run this AFTER you've confirmed tags data is migrated
-- ============================================================================

BEGIN;

\echo '========================================'
\echo 'Tags Legacy Cleanup'
\echo '========================================'
\echo ''

-- ============================================================================
-- STEP 1: Final verification before cleanup
-- ============================================================================

\echo 'Step 1: Verifying tags migration...'
\echo ''

-- Check that both columns have the same data
SELECT 
  'Data Verification' as check_type,
  COUNT(*) as total_rows,
  COUNT(tags) as rows_with_new_tags,
  COUNT(tags_legacy) as rows_with_old_tags,
  CASE 
    WHEN COUNT(tags) = COUNT(tags_legacy) THEN '✅ SAFE TO PROCEED'
    WHEN COUNT(tags_legacy) = 0 THEN '✅ LEGACY EMPTY - SAFE'
    ELSE '❌ STOP - Data mismatch!'
  END as status
FROM public.agent_call_logs;

\echo ''
\echo 'If status shows ✅, continue. If ❌, STOP and check your data!'
\echo ''

-- ============================================================================
-- STEP 2: Drop the legacy column
-- ============================================================================

\echo 'Step 2: Dropping tags_legacy column...'
\echo ''

ALTER TABLE public.agent_call_logs 
  DROP COLUMN IF EXISTS tags_legacy;

\echo '✓ tags_legacy column removed'
\echo ''

-- ============================================================================
-- STEP 3: Verify cleanup
-- ============================================================================

\echo 'Step 3: Verification...'
\echo ''

-- Check that only tags column remains
SELECT 
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'agent_call_logs'
  AND column_name LIKE '%tags%'
ORDER BY column_name;

\echo ''
\echo 'Expected: Only "tags" column should be listed'
\echo ''

-- Verify data is still there
SELECT 
  'Final Check' as check_type,
  COUNT(*) as total_rows,
  COUNT(tags) as rows_with_tags,
  CASE 
    WHEN COUNT(tags) > 0 THEN '✅ Data preserved!'
    ELSE '⚠️ Tags column is empty'
  END as status
FROM public.agent_call_logs;

\echo ''
\echo '========================================'
\echo 'Cleanup Complete!'
\echo '========================================'
\echo ''

COMMIT;

