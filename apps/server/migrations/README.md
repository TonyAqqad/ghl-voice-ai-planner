# Database Migrations

This directory contains SQL migration scripts for the GHL Voice AI Planner database schema.

## Migration Files

### `000_pre_flight_checks.sql`
**Run this FIRST** before any migrations to verify data integrity.

**Purpose:**
- Check for orphaned foreign key references
- Verify table and column states
- Identify potential conflicts
- Establish baseline row counts

**Usage:**
```bash
# In Supabase SQL Editor or psql:
\i apps/server/migrations/000_pre_flight_checks.sql

# Or via psql command line:
psql -h db.xxxxx.supabase.co -U postgres -d postgres -f apps/server/migrations/000_pre_flight_checks.sql
```

**Expected Output:**
- All checks should show `0` orphaned records
- All required tables should show `✓ EXISTS`
- No FK violations

---

### `001_improved_schema_migration.sql`
**The main migration** - Enhanced schema with Context7 integration support.

**What it does:**
1. ✅ Adds `status` and `rev` columns to `agent_prompts`
2. ✅ Migrates `tags` column to proper `text[]` type in `agent_call_logs`
3. ✅ Adds `channel`, `niche`, `owner_ref`, `scorecard` to `agent_call_logs`
4. ✅ Creates `agent_training_snippets` table (scoped runtime snippets)
5. ✅ Creates `master_memories` table (Master AI learning repository)
6. ✅ Creates `context7_scopes` table (Context7 integration tracking)
7. ✅ Adds performance indices for all tables
8. ✅ Adds helpful comments and documentation
9. ⚠️ Leaves FK constraints commented (enable after data verification)

**Usage:**
```bash
# IMPORTANT: Run pre-flight checks first!
\i apps/server/migrations/000_pre_flight_checks.sql

# If all checks pass, run the migration:
\i apps/server/migrations/001_improved_schema_migration.sql
```

**Safety Features:**
- ✅ Fully idempotent (safe to run multiple times)
- ✅ Uses `IF NOT EXISTS` / `IF EXISTS` guards
- ✅ Wrapped in transaction (all-or-nothing)
- ✅ Includes verification queries
- ✅ Non-destructive (renames instead of dropping)

---

### `002_rollback_migration.sql`
**Emergency rollback** - Use only if you need to undo the migration.

**What it does:**
- ❌ Drops `context7_scopes` table (DATA LOSS!)
- ❌ Drops `agent_training_snippets` table (DATA LOSS!)
- ❌ Drops `master_memories` table (DATA LOSS!)
- ✅ Removes all new indices
- ✅ Preserves existing columns (commented out for safety)

**Usage:**
```bash
# WARNING: This will delete data!
# Only run if you need to completely undo the migration
\i apps/server/migrations/002_rollback_migration.sql
```

**Note:** By default, this script does NOT drop columns to preserve data. If you need to remove columns too, uncomment SECTION 7 in the script.

---

## Quick Start Guide

### Option 1: Safe Migration (Recommended)

```bash
# Step 1: Run pre-flight checks
psql -h db.xxxxx.supabase.co -U postgres -d postgres \
  -f apps/server/migrations/000_pre_flight_checks.sql

# Step 2: Review output - ensure all checks pass

# Step 3: Take a backup (in Supabase dashboard)
# Settings > Database > Backups > Create Backup

# Step 4: Run migration
psql -h db.xxxxx.supabase.co -U postgres -d postgres \
  -f apps/server/migrations/001_improved_schema_migration.sql

# Step 5: Verify (check the output at the end of migration)
```

### Option 2: Supabase SQL Editor

1. Open **Supabase Dashboard** → **SQL Editor**
2. Create new query
3. Copy contents of `000_pre_flight_checks.sql`
4. Click **Run** and review results
5. If all checks pass:
   - Create new query
   - Copy contents of `001_improved_schema_migration.sql`
   - Click **Run**
6. Review verification output

---

## New Tables Created

### `agent_training_snippets`
Stores runtime-injectable snippets (≤200 chars) for scoped agent learning.

**Key Features:**
- Scoped by `location_id`, `agent_id`, `prompt_hash`
- Phase-aware (opening, collect, verify, book, fallback)
- Usage tracking for ranking
- Fast lookup via composite indices

**Example Query:**
```sql
SELECT text, uses, rank
FROM agent_training_snippets
WHERE location_id = 'loc123'
  AND agent_id = 'agent456'
  AND prompt_hash = 'abc...'
  AND phase = 'collect'
ORDER BY rank DESC, uses DESC
LIMIT 5;
```

---

### `master_memories`
Master AI learning repository for praise, corrections, and knowledge deltas.

**Key Features:**
- Lesson types: `praise`, `correction`, `kb_delta`
- Niche-aware for vertical-specific learning
- Trigger patterns for context-aware retrieval
- JSON content for flexible storage

**Example Query:**
```sql
SELECT content, lesson_type, created_at
FROM master_memories
WHERE master_agent_id = 'master-1'
  AND niche = 'fitness_gym'
  AND lesson_type = 'correction'
ORDER BY created_at DESC
LIMIT 10;
```

---

### `context7_scopes`
Tracks Context7 memory API integration and scope management.

**Key Features:**
- Unique scope identifier: `scope:{location}:{agent}:{prompt_hash}`
- Sync status tracking (pending, syncing, synced, error)
- Memory source toggle (localStorage vs context7)
- Auto-updating `updated_at` trigger

**Example Query:**
```sql
SELECT scope_id, memory_source, sync_status, last_synced_at
FROM context7_scopes
WHERE location_id = 'loc123'
  AND agent_id = 'agent456'
ORDER BY updated_at DESC;
```

---

## Enhanced Indices

### Performance Improvements

**agent_prompts:**
- `idx_agent_prompts_scope` - Fast scoped queries
- `idx_agent_prompts_hash` - Prompt hash lookups
- `idx_agent_prompts_rev` - Revision history queries

**agent_call_logs:**
- `idx_call_logs_agent_created` - Agent timeline queries
- `idx_call_logs_niche_created` - Niche-based filtering
- `idx_call_logs_tags_gin` - Full-text tag search
- `idx_call_logs_scorecard_gin` - JSON scorecard queries

**agent_training_snippets:**
- `idx_snippets_scope` - Scoped snippet lookup
- `idx_snippets_usage` - Usage-based ranking

**master_memories:**
- `idx_master_memories_lookup` - Master AI queries
- `idx_master_memories_content_gin` - Content search

---

## Foreign Key Constraints (Optional)

The migration includes commented-out FK constraints. To enable referential integrity:

1. **Verify data integrity first:**
   ```sql
   -- Check for orphaned records
   SELECT COUNT(*) FROM agents a
   WHERE a.location_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM locations l 
       WHERE l.location_id = a.location_id
     );
   ```

2. **If count is 0, enable FKs:**
   - Edit `001_improved_schema_migration.sql`
   - Uncomment SECTION 7
   - Re-run the migration

---

## Troubleshooting

### "Permission denied" error
**Solution:** Make sure you're running as the `postgres` user or a role with sufficient privileges.

### "Relation already exists"
**Solution:** This is expected and safe - the migration uses `IF NOT EXISTS` guards.

### Migration fails mid-way
**Solution:** The transaction will automatically rollback. Fix the issue and re-run the migration.

### Need to rollback
**Solution:** Run `002_rollback_migration.sql` (WARNING: data loss!)

---

## Testing the Migration

After running the migration, test with these queries:

```sql
-- Verify new tables
SELECT COUNT(*) FROM agent_training_snippets;
SELECT COUNT(*) FROM master_memories;
SELECT COUNT(*) FROM context7_scopes;

-- Verify new columns
SELECT status, rev FROM agent_prompts LIMIT 1;
SELECT tags, channel, niche, owner_ref FROM agent_call_logs LIMIT 1;

-- Verify indices
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'context7_scopes';
```

---

## Next Steps After Migration

1. ✅ Update your application code to use new tables
2. ✅ Implement Context7 integration (see `CONTEXT7_INTEGRATION.md`)
3. ✅ Monitor query performance with new indices
4. ✅ Populate `agent_training_snippets` from localStorage
5. ✅ Enable FK constraints after data verification
6. ✅ Set up automated backups

---

## Support

If you encounter issues:
1. Check the pre-flight checks output
2. Review Supabase logs
3. Consult `CONTEXT7_CLEAN_DEPLOYMENT_PLAN.md`
4. File an issue on GitHub

---

**Migration Version:** 1.0  
**Last Updated:** 2025-11-03  
**Compatibility:** PostgreSQL 12+, Supabase

