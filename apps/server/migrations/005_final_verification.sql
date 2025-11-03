-- ============================================================================
-- GHL Voice AI Planner - Final Migration Verification
-- ============================================================================
-- Purpose: Verify all migration steps completed successfully
-- Version: 1.0
-- Date: 2025-11-03
--
-- Run this to verify your database is ready for production
-- ============================================================================

\echo '========================================'
\echo 'FINAL MIGRATION VERIFICATION'
\echo '========================================'
\echo ''

-- ============================================================================
-- CHECK 1: New Tables Exist
-- ============================================================================

\echo 'CHECK 1: New Tables Status'
\echo '=========================================='

SELECT 
  table_name,
  (SELECT COUNT(*) 
   FROM information_schema.columns 
   WHERE table_name = t.table_name 
     AND table_schema = 'public') as column_count,
  '✅ EXISTS' as status
FROM (VALUES 
  ('agent_training_snippets'),
  ('master_memories'),
  ('context7_scopes')
) AS t(table_name)
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name = t.table_name
)
ORDER BY table_name;

\echo ''
\echo 'Expected: All 3 tables listed'
\echo ''

-- ============================================================================
-- CHECK 2: New Columns on Existing Tables
-- ============================================================================

\echo 'CHECK 2: Enhanced Columns Status'
\echo '=========================================='

SELECT 
  table_name,
  column_name,
  data_type,
  '✅ EXISTS' as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'agent_prompts' AND column_name IN ('status', 'rev'))
    OR (table_name = 'agent_call_logs' AND column_name IN ('channel', 'niche', 'owner_ref', 'scorecard', 'tags'))
    OR (table_name = 'agents' AND column_name = 'location_id')
  )
ORDER BY table_name, column_name;

\echo ''
\echo 'Expected: 8 columns listed (status, rev, channel, niche, owner_ref, scorecard, tags, location_id)'
\echo ''

-- ============================================================================
-- CHECK 3: Tags Column Clean
-- ============================================================================

\echo 'CHECK 3: Tags Column (Legacy Removed?)'
\echo '=========================================='

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
\echo 'Expected: Only "tags" column (no tags_legacy)'
\echo ''

-- ============================================================================
-- CHECK 4: Data Integrity
-- ============================================================================

\echo 'CHECK 4: Data Integrity Check'
\echo '=========================================='

SELECT 
  'agent_prompts' as table_name,
  COUNT(*) as row_count,
  CASE WHEN COUNT(*) > 0 THEN '✅ HAS DATA' ELSE '⚠️ EMPTY' END as status
FROM public.agent_prompts

UNION ALL

SELECT 
  'agent_call_logs',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅ HAS DATA' ELSE '⚠️ EMPTY' END
FROM public.agent_call_logs

UNION ALL

SELECT 
  'agents',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅ HAS DATA' ELSE '⚠️ EMPTY' END
FROM public.agents

UNION ALL

SELECT 
  'agent_training_snippets',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ NEW TABLE (empty ok)' ELSE '✅ HAS DATA' END
FROM public.agent_training_snippets

UNION ALL

SELECT 
  'master_memories',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ NEW TABLE (empty ok)' ELSE '✅ HAS DATA' END
FROM public.master_memories

UNION ALL

SELECT 
  'context7_scopes',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ NEW TABLE (empty ok)' ELSE '✅ HAS DATA' END
FROM public.context7_scopes

ORDER BY table_name;

\echo ''
\echo 'Expected: Old tables have data, new tables can be empty'
\echo ''

-- ============================================================================
-- CHECK 5: Performance Indices
-- ============================================================================

\echo 'CHECK 5: New Indices Created'
\echo '=========================================='

SELECT 
  tablename,
  COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'agent_training_snippets',
    'master_memories', 
    'context7_scopes',
    'agent_prompts',
    'agent_call_logs',
    'agents'
  )
GROUP BY tablename
ORDER BY tablename;

\echo ''
\echo 'Expected: Each table should have multiple indices'
\echo ''

-- ============================================================================
-- CHECK 6: Tags Data Present
-- ============================================================================

\echo 'CHECK 6: Tags Data Verification'
\echo '=========================================='

SELECT 
  COUNT(*) as total_rows,
  COUNT(tags) as rows_with_tags,
  ROUND(100.0 * COUNT(tags) / NULLIF(COUNT(*), 0), 2) as percentage_with_tags,
  CASE 
    WHEN COUNT(tags) = COUNT(*) THEN '✅ ALL ROWS HAVE TAGS'
    WHEN COUNT(tags) > 0 THEN '✅ SOME ROWS HAVE TAGS'
    ELSE '⚠️ NO TAGS DATA'
  END as status
FROM public.agent_call_logs;

\echo ''

-- Show some example tags
SELECT 
  'Sample Tags' as info,
  tags
FROM public.agent_call_logs
WHERE tags IS NOT NULL
LIMIT 3;

\echo ''
\echo '========================================'
\echo 'MIGRATION VERIFICATION COMPLETE'
\echo '========================================'
\echo ''
\echo 'If all checks show ✅, your migration is SUCCESSFUL!'
\echo ''
\echo 'Next Steps:'
\echo '  1. Update application code to use new tables'
\echo '  2. Implement Context7 integration'
\echo '  3. Deploy to production'
\echo '  4. Enable Context7 memory (optional)'
\echo ''
\echo 'Documentation:'
\echo '  - CONTEXT7_CLEAN_DEPLOYMENT_PLAN.md'
\echo '  - CONTEXT7_INTEGRATION.md'
\echo ''
\echo '========================================'

