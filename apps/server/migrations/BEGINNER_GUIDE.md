# 🎓 Complete Beginner's Guide to Database Migration

**Welcome!** This guide will walk you through updating your database step-by-step. No database experience needed!

---

## 📋 What We're Going to Do

We're adding 3 new tables to your database:
1. **agent_training_snippets** - Stores learning snippets for your AI agents
2. **master_memories** - Master AI's memory bank
3. **context7_scopes** - Tracks Context7 integration

**Good news:** Your existing data is 100% safe. We're only ADDING new stuff, not changing anything that exists.

---

## ⏱️ Time Required

- **Total time:** 10-15 minutes
- **Active work:** 5 minutes (mostly copy-paste)
- **Waiting:** 5-10 minutes (database doing its thing)

---

## 🛠️ What You'll Need

- ✅ Access to Supabase Dashboard (the website where your database lives)
- ✅ This guide (you're reading it now!)
- ✅ 10 minutes of uninterrupted time

---

## 📍 Step 1: Open Supabase Dashboard

### 1.1 Go to Supabase
1. Open your web browser
2. Go to: https://supabase.com
3. Click **"Sign In"** (top right)
4. Log in with your account

### 1.2 Select Your Project
1. You'll see a list of your projects
2. Click on **"ghl-voice-ai-planner"** (or whatever you named it)
3. Wait for the dashboard to load

**✅ You should now see:** Dashboard with menu on the left side

---

## 📍 Step 2: Open SQL Editor

### 2.1 Find the SQL Editor
1. Look at the left sidebar menu
2. Find the **"SQL Editor"** option (it has a `</>` icon)
3. Click on it

**✅ You should now see:** A big text box where you can type SQL

---

## 📍 Step 3: Run Pre-Flight Checks (IMPORTANT!)

This checks if your database is ready for the upgrade. It's like a health check.

### 3.1 Open the Pre-Flight Check File
1. In your code editor (VS Code/Cursor), open this file:
   ```
   apps/server/migrations/000_pre_flight_checks.sql
   ```

### 3.2 Copy the Contents
1. Press `Ctrl+A` (Windows) or `Cmd+A` (Mac) to select all
2. Press `Ctrl+C` (Windows) or `Cmd+C` (Mac) to copy

### 3.3 Paste into Supabase
1. Go back to Supabase SQL Editor
2. Click in the big text box
3. Press `Ctrl+V` (Windows) or `Cmd+V` (Mac) to paste

### 3.4 Run the Check
1. Click the green **"Run"** button (bottom right of the text box)
2. Wait 10-30 seconds
3. Scroll down to see the results

### 3.5 Read the Results

**Look for these key things:**

#### ✅ CHECK 1: Orphaned location references
```
orphaned_count | orphaned_location_ids
0              | 
```
**Good:** `orphaned_count` should be `0`  
**Bad:** If it's more than 0, stop and tell me!

#### ✅ CHECK 5: Required tables exist
```
table_name                    | status
agent_call_logs               | ✓ EXISTS
agent_prompt_reviews          | ✓ EXISTS
agent_prompts                 | ✓ EXISTS
agent_response_corrections    | ✓ EXISTS
agents                        | ✓ EXISTS
locations                     | ✓ EXISTS
tokens                        | ✓ EXISTS
```
**Good:** All tables show `✓ EXISTS`  
**Bad:** If any show `✗ MISSING`, stop and tell me!

#### ✅ CHECK 7: Current row counts
```
table_name        | row_count
agent_call_logs   | 84
agent_prompts     | 67
agents            | 1
locations         | 0
```
**Action:** Write these numbers down! We'll check them later to make sure nothing got deleted.

#### ✅ CHECK 8: Potential FK violations
```
check_name                                    | violation_count
agent_call_logs->agent_prompts                | 0
agent_prompt_reviews->agent_call_logs         | 0
agent_response_corrections->agent_call_logs   | 0
```
**Good:** All `violation_count` should be `0`  
**Bad:** If any are more than 0, stop and tell me!

---

### 3.6 Decision Time

**IF ALL CHECKS PASSED (all counts are 0, all tables exist):**
✅ Continue to Step 4!

**IF ANY CHECK FAILED:**
❌ Stop here and send me a screenshot. We need to fix something first.

---

## 📍 Step 4: Run the Main Migration

This is where we actually create the new tables.

### 4.1 Clear the SQL Editor
1. In Supabase SQL Editor, click in the text box
2. Press `Ctrl+A` (Windows) or `Cmd+A` (Mac) to select all
3. Press `Delete` to clear it

### 4.2 Open the Migration File
1. In your code editor (VS Code/Cursor), open this file:
   ```
   apps/server/migrations/001_improved_schema_migration.sql
   ```

### 4.3 Copy the Contents
1. Press `Ctrl+A` (Windows) or `Cmd+A` (Mac) to select all
2. Press `Ctrl+C` (Windows) or `Cmd+C` (Mac) to copy

### 4.4 Paste into Supabase
1. Go back to Supabase SQL Editor
2. Click in the big text box (should be empty)
3. Press `Ctrl+V` (Windows) or `Cmd+V` (Mac) to paste

### 4.5 Double-Check Before Running
Look at the pasted code. You should see:
- Starts with: `-- ============================================================================`
- Has sections labeled `SECTION 1`, `SECTION 2`, etc.
- Ends with: `-- ============================================================================`

**Looks good?** ✅ Continue!  
**Something weird?** ❌ Stop and tell me!

### 4.6 Run the Migration
1. Click the green **"Run"** button (bottom right)
2. **WAIT!** This will take 30-60 seconds
3. Don't close the browser tab
4. You'll see a loading spinner

### 4.7 Check for Success

Scroll to the **very bottom** of the results. You should see:

```
========================================
Migration Verification
========================================
agent_prompts rows: 67
agent_call_logs rows: 84
agent_training_snippets rows: 0
master_memories rows: 0
context7_scopes rows: 0
========================================
New Indices Created:
========================================
Total indices: 15
```

**✅ Success indicators:**
- Row counts match what you wrote down in Step 3.7
- `agent_training_snippets rows: 0` (new table, empty is correct)
- `master_memories rows: 0` (new table, empty is correct)
- `context7_scopes rows: 0` (new table, empty is correct)
- `Total indices: 15` (or similar number)

**❌ Error indicators:**
- Red error messages
- Row counts don't match (data was lost!)
- "syntax error" messages

**IF YOU SEE ERRORS:** Take a screenshot and send it to me. Don't panic - we can roll back!

---

## 📍 Step 5: Verify Everything Worked

Let's do a final check to make sure the new tables exist.

### 5.1 Clear the SQL Editor Again
1. In Supabase SQL Editor, select all (`Ctrl+A` / `Cmd+A`)
2. Delete it

### 5.2 Run This Simple Check
Copy and paste this into the SQL Editor:

```sql
-- Check if new tables exist
SELECT table_name, 
       (SELECT COUNT(*) 
        FROM information_schema.columns 
        WHERE table_name = t.table_name 
          AND table_schema = 'public') as column_count
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
```

### 5.3 Click Run

**You should see:**
```
table_name                 | column_count
agent_training_snippets    | 9
context7_scopes            | 11
master_memories            | 9
```

**✅ If you see all 3 tables:** SUCCESS! You're done! 🎉  
**❌ If you see fewer than 3 tables:** Something went wrong. Send me a screenshot.

---

## 📍 Step 6: Test the New Tables (Optional but Recommended)

Let's make sure you can actually use the new tables.

### 6.1 Insert a Test Record
Copy and paste this into SQL Editor:

```sql
-- Test insert into agent_training_snippets
INSERT INTO agent_training_snippets 
  (location_id, agent_id, prompt_hash, phase, trigger, text)
VALUES 
  ('test-loc', 'test-agent', 'test-hash', 'opening', 'test trigger', 'This is a test snippet');

-- Test insert into context7_scopes
INSERT INTO context7_scopes 
  (scope_id, location_id, agent_id, prompt_hash)
VALUES 
  ('scope:test:test:test', 'test-loc', 'test-agent', 'test-hash');

-- Test insert into master_memories
INSERT INTO master_memories 
  (master_agent_id, lesson_type, content)
VALUES 
  ('master-test', 'correction', '{"message": "Test correction"}');

-- Now check if they were inserted
SELECT 'agent_training_snippets' as table_name, COUNT(*) as count FROM agent_training_snippets
UNION ALL
SELECT 'context7_scopes', COUNT(*) FROM context7_scopes
UNION ALL
SELECT 'master_memories', COUNT(*) FROM master_memories;
```

### 6.2 Click Run

**You should see:**
```
table_name                 | count
agent_training_snippets    | 1
context7_scopes            | 1
master_memories            | 1
```

**✅ If you see 1 for each table:** Perfect! Your tables are working!

### 6.3 Clean Up Test Data (Optional)
If you want to remove the test data:

```sql
DELETE FROM agent_training_snippets WHERE location_id = 'test-loc';
DELETE FROM context7_scopes WHERE location_id = 'test-loc';
DELETE FROM master_memories WHERE master_agent_id = 'master-test';
```

---

## 🎉 Congratulations! You're Done!

Your database now has:
- ✅ All your original data (nothing lost!)
- ✅ 3 new tables for Context7 integration
- ✅ 15+ new performance indices (makes queries faster)
- ✅ Enhanced columns on existing tables

---

## 🆘 Troubleshooting

### "I got an error in Step 4!"

**Don't panic!** The migration is wrapped in a transaction, which means:
- If ANY part failed, NOTHING changed
- Your original data is 100% safe
- We can try again

**What to do:**
1. Take a screenshot of the error
2. Send it to me
3. We'll figure out what went wrong

### "I'm not sure if it worked"

Run this query to check:

```sql
SELECT 
  'Original Tables' as category,
  COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('agents', 'agent_prompts', 'agent_call_logs')

UNION ALL

SELECT 
  'New Tables',
  COUNT(*)
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('agent_training_snippets', 'master_memories', 'context7_scopes');
```

**Expected:**
```
category         | table_count
Original Tables  | 3
New Tables       | 3
```

### "I want to undo everything!"

We have a rollback script! Follow these steps:

1. Open `apps/server/migrations/002_rollback_migration.sql`
2. Copy all contents
3. Paste into Supabase SQL Editor
4. Click Run
5. Wait 30 seconds
6. Check results

**Note:** This will DELETE the new tables but keep your original data safe.

---

## 📚 What You Just Did (In Plain English)

1. ✅ Checked your database was healthy
2. ✅ Added 3 new tables for AI learning and Context7
3. ✅ Added performance improvements (indices)
4. ✅ Verified everything worked
5. ✅ Tested the new tables

**Your app can now:**
- Store agent learning snippets
- Track Context7 memory sync
- Build a master AI knowledge base

---

## 🚀 Next Steps

1. **Update your code** to use the new tables (see `CONTEXT7_INTEGRATION.md`)
2. **Deploy to Render** (see `CONTEXT7_CLEAN_DEPLOYMENT_PLAN.md`)
3. **Enable Context7** when you're ready (optional)

---

## 💬 Need Help?

If you got stuck or something doesn't look right:

1. Take a screenshot of the error/problem
2. Note which step you're on (Step 1, 2, 3, etc.)
3. Tell me what you expected vs. what you got
4. Send it my way!

Remember: Your data is safe. We can always roll back if needed.

---

**Migration Version:** 1.0  
**Last Updated:** 2025-11-03  
**Difficulty:** Beginner-friendly ⭐  
**Estimated Time:** 10-15 minutes

**Happy migrating!** 🎉

