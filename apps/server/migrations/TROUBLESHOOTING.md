# 🔧 Migration Troubleshooting Guide

**Having issues? This guide will help you fix common problems.**

---

## 🔍 How to Use This Guide

1. Find the error message or problem you're experiencing
2. Follow the solution steps
3. If still stuck, see "Getting Help" at the bottom

---

## ❌ Common Errors & Solutions

### Error: "syntax error at or near..."

**What it looks like:**
```
ERROR: 42601: syntax error at or near ")"
LINE 8: );
```

**What it means:** There's a typo in the SQL code you pasted.

**Solution:**
1. Make sure you copied the ENTIRE file (Ctrl+A before Ctrl+C)
2. Check you didn't accidentally delete or add any characters
3. Re-copy the file and try again
4. Make sure you're using the file from the migrations folder, not code from an example

**How to fix:**
```sql
-- DON'T paste this (example of broken SQL):
CREATE TABLE test (
  name text,
  -- comment here
);  -- ❌ EXTRA COMMA BEFORE COMMENT

-- DO paste the actual migration file contents
```

---

### Error: "relation already exists"

**What it looks like:**
```
ERROR: relation "context7_scopes" already exists
```

**What it means:** The table is already in your database! This is actually GOOD news.

**Solution:**
1. This means the migration already ran successfully before
2. Your tables are already created
3. Skip to Step 5 in the beginner guide (verification)
4. No action needed!

**Verify everything is okay:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('agent_training_snippets', 'master_memories', 'context7_scopes');
```

**Expected:** You should see all 3 tables listed.

---

### Error: "permission denied"

**What it looks like:**
```
ERROR: permission denied for schema public
```

**What it means:** Your database user doesn't have permission to create tables.

**Solution:**
1. Make sure you're logged in as the project owner in Supabase
2. Check you selected the correct project
3. Try logging out and back in
4. If still stuck, you may need to use the project owner account

**Check your permissions:**
```sql
SELECT current_user, current_database();
```

**Expected:** Should show `postgres` as user.

---

### Error: "column already exists"

**What it looks like:**
```
ERROR: column "status" of relation "agent_prompts" already exists
```

**What it means:** The migration already added this column before.

**Solution:**
1. This is NORMAL and SAFE
2. The migration uses `IF NOT EXISTS` guards
3. It will skip columns that already exist
4. Continue with the rest of the migration
5. Check the final verification output

**This is fine! No action needed.**

---

### Error: "foreign key violation"

**What it looks like:**
```
ERROR: insert or update on table "X" violates foreign key constraint "Y"
```

**What it means:** Your data has orphaned references (data pointing to records that don't exist).

**Solution:**
1. This shouldn't happen with our migration (we don't add FKs by default)
2. If you see this, you may have uncommented the FK section
3. Run the pre-flight checks again to find the orphaned data
4. Option A: Fix the orphaned data
5. Option B: Comment out the FK constraints in the migration

**Find orphaned data:**
```sql
-- Check for orphaned agent references
SELECT COUNT(*) as orphaned_count
FROM agents a
WHERE a.location_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM locations l 
    WHERE l.location_id = a.location_id
  );
```

---

### Error: "out of memory"

**What it looks like:**
```
ERROR: out of memory
```

**What it means:** The database ran out of memory during the migration (very rare).

**Solution:**
1. This is extremely rare with our migration
2. Try running the migration during off-peak hours
3. Close other queries/connections to the database
4. Contact Supabase support if it persists

---

### Problem: "Migration seems stuck / Taking forever"

**What it looks like:**
- Green "Run" button shows loading spinner for 5+ minutes
- No results appear
- Browser tab seems frozen

**What it means:** Either:
- Large dataset taking time to index
- Database connection issue
- Browser issue

**Solution:**

**Step 1: Wait a bit longer**
- For databases with 10,000+ rows, it can take 2-5 minutes
- Don't close the tab!

**Step 2: If still stuck after 5 minutes:**
1. Open a new browser tab
2. Go to your Supabase project
3. Check if you can see the new tables in the Table Editor
4. If yes, the migration worked! The UI just got stuck.
5. If no, try running the migration again

**Check if it worked (in new tab):**
```sql
SELECT COUNT(*) FROM context7_scopes;
```

If this works, your migration succeeded!

---

### Problem: "Row counts don't match"

**What it looks like:**
After migration, you see:
```
agent_prompts rows: 50  (but you had 67 before!)
```

**What it means:** Data may have been lost (VERY BAD - but unlikely with our migration).

**Solution:**

**Step 1: Don't panic! Check if it's a different project**
```sql
SELECT COUNT(*) FROM agent_prompts;
```

**Step 2: If count is really different:**
1. Check Supabase > Settings > Database > Backups
2. Restore from the most recent backup
3. Contact me immediately

**Step 3: Check your notes**
- Did you write down the counts correctly?
- Are you in the correct project?

---

### Problem: "New tables don't show up in my app"

**What it looks like:**
- Migration succeeded in Supabase
- But your application code can't find the tables
- Getting "relation does not exist" errors

**Solution:**

**Step 1: Verify tables exist in database:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('agent_training_snippets', 'master_memories', 'context7_scopes');
```

**Step 2: Check your application's database connection:**
- Is it pointing to the correct Supabase project?
- Check environment variables in `.env`
- Verify `DATABASE_URL` or Supabase credentials

**Step 3: Restart your application:**
```bash
# Stop the app
# Clear any connection pools
# Restart
npm run dev
```

---

### Problem: "I want to undo everything"

**What it looks like:**
- Migration completed but you want to revert
- Need to go back to original schema

**Solution:**

**Option 1: Remove only new tables (recommended):**

1. Open `002_rollback_migration.sql`
2. Copy all contents
3. Paste into Supabase SQL Editor
4. Click Run
5. Wait for completion
6. Verify old data is still there:
   ```sql
   SELECT COUNT(*) FROM agent_prompts;
   SELECT COUNT(*) FROM agent_call_logs;
   ```

**Option 2: Restore from backup:**

1. Go to Supabase Dashboard
2. Settings > Database > Backups
3. Find backup from before migration
4. Click "Restore"
5. Wait 5-10 minutes
6. Verify data is back

**Option 3: Manual cleanup:**

```sql
-- Drop new tables
DROP TABLE IF EXISTS context7_scopes;
DROP TABLE IF EXISTS agent_training_snippets;
DROP TABLE IF EXISTS master_memories;

-- Verify old data is safe
SELECT COUNT(*) FROM agent_prompts;
```

---

## 🎯 Verification Queries

Use these to check the state of your database at any time:

### Check if migration completed:
```sql
SELECT 
  'Tables Exist' as status,
  CASE 
    WHEN COUNT(*) = 3 THEN '✅ YES'
    ELSE '❌ NO'
  END as result
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('agent_training_snippets', 'master_memories', 'context7_scopes');
```

### Check if old data is safe:
```sql
SELECT 
  'agent_prompts' as table_name,
  COUNT(*) as row_count,
  CASE WHEN COUNT(*) > 0 THEN '✅ SAFE' ELSE '❌ EMPTY' END as status
FROM agent_prompts
UNION ALL
SELECT 
  'agent_call_logs',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅ SAFE' ELSE '❌ EMPTY' END
FROM agent_call_logs
UNION ALL
SELECT 
  'agents',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅ SAFE' ELSE '⚠️ EMPTY (maybe okay)' END
FROM agents;
```

### Check column additions:
```sql
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'agent_prompts' AND column_name IN ('status', 'rev'))
    OR (table_name = 'agent_call_logs' AND column_name IN ('channel', 'niche', 'owner_ref', 'scorecard'))
    OR (table_name = 'agents' AND column_name = 'location_id')
  )
ORDER BY table_name, column_name;
```

### Check indices were created:
```sql
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('agent_training_snippets', 'master_memories', 'context7_scopes')
ORDER BY tablename, indexname;
```

---

## 🆘 Getting Help

If you're still stuck after trying the solutions above:

### What to Include When Asking for Help:

1. **Which step you're on:**
   - "I'm on Step 4 of the Beginner Guide"

2. **The exact error message:**
   - Copy the full error text
   - Include the error code (e.g., `ERROR: 42601`)

3. **Screenshot of the error:**
   - Show the SQL Editor with the error visible
   - Include the query you ran

4. **What you expected vs. what happened:**
   - "I expected to see 3 tables, but I only see 2"

5. **Results of verification queries:**
   ```sql
   -- Run this and include results:
   SELECT COUNT(*) FROM agent_prompts;
   SELECT COUNT(*) FROM agent_call_logs;
   
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
     AND table_name LIKE '%agent%'
   ORDER BY table_name;
   ```

6. **Your environment:**
   - Supabase (free/pro tier)
   - Database size (roughly)
   - When the issue started

---

## 📚 Additional Resources

- **Beginner Guide:** `BEGINNER_GUIDE.md` - Step-by-step instructions
- **Quick Checklist:** `QUICK_CHECKLIST.md` - Printable checklist
- **Migration README:** `README.md` - Technical documentation
- **Rollback Script:** `002_rollback_migration.sql` - Undo migration

---

## 🔐 Safety Reminders

**Your data is safe if:**
- ✅ You ran the pre-flight checks first
- ✅ The migration is wrapped in a transaction (it is!)
- ✅ You have a backup (Supabase auto-backups daily)
- ✅ You didn't manually modify the migration files

**Red flags to watch for:**
- ❌ Row counts suddenly drop to 0
- ❌ Can't query old tables at all
- ❌ Error says "DROP TABLE" (our migration never drops tables)

**If you see red flags:**
1. STOP immediately
2. Don't run any more queries
3. Check Supabase backups
4. Contact support/me

---

**Remember:** The migration is designed to be safe. Most "errors" are actually just informational messages or expected behavior (like "already exists"). When in doubt, ask!

**Version:** 1.0  
**Last Updated:** 2025-11-03

