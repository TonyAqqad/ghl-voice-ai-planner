-- ============================================================================
-- Quick Verification - Check if migration was successful
-- ============================================================================

\echo '========================================'
\echo 'Migration Verification Check'
\echo '========================================'
\echo ''

-- Check if new tables exist
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
  ('agent_training_snippets'),
  ('master_memories'),
  ('context7_scopes')
) AS t(table_name)
ORDER BY table_name;

\echo ''
\echo 'If all three tables show "✓ EXISTS", migration is complete!'
\echo 'If any show "✗ MISSING", you need to run 001_improved_schema_migration.sql'
\echo ''

-- Check row counts
SELECT 
  'agent_training_snippets' as table_name,
  COUNT(*) as row_count
FROM public.agent_training_snippets
UNION ALL
SELECT 
  'master_memories',
  COUNT(*)
FROM public.master_memories
UNION ALL
SELECT 
  'context7_scopes',
  COUNT(*)
FROM public.context7_scopes;

\echo ''
\echo 'Note: 0 rows is expected for new tables'
\echo ''

