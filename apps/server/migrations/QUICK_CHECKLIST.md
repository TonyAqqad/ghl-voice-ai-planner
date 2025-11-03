# ✅ Database Migration Checklist

**Print this or keep it open in another tab!**

---

## Before You Start

- [ ] I have 10-15 minutes of uninterrupted time
- [ ] I'm logged into Supabase Dashboard
- [ ] I can see my project: ghl-voice-ai-planner
- [ ] I have the migration files open in my code editor

---

## Step 1: Open SQL Editor

- [ ] Clicked "SQL Editor" in left sidebar
- [ ] I see a big text box for SQL code

---

## Step 2: Pre-Flight Checks

- [ ] Opened file: `000_pre_flight_checks.sql`
- [ ] Copied all contents (Ctrl+A, Ctrl+C)
- [ ] Pasted into Supabase SQL Editor
- [ ] Clicked green "Run" button
- [ ] Waited for results (10-30 seconds)

### Results to Check:
- [ ] CHECK 1: `orphaned_count = 0` ✅
- [ ] CHECK 5: All tables show `✓ EXISTS` ✅
- [ ] CHECK 8: All `violation_count = 0` ✅
- [ ] Wrote down row counts:
  ```
  agent_call_logs: _____
  agent_prompts: _____
  agents: _____
  ```

**If all checks passed → Continue**  
**If any check failed → STOP and get help**

---

## Step 3: Run Migration

- [ ] Cleared SQL Editor (Ctrl+A, Delete)
- [ ] Opened file: `001_improved_schema_migration.sql`
- [ ] Copied all contents (Ctrl+A, Ctrl+C)
- [ ] Pasted into Supabase SQL Editor
- [ ] Double-checked it looks right (starts with `--`, has SECTION 1, 2, 3...)
- [ ] Clicked green "Run" button
- [ ] Waited patiently (30-60 seconds)
- [ ] Scrolled to bottom of results

### Success Indicators:
- [ ] No red error messages ✅
- [ ] See "Migration Verification" section ✅
- [ ] Row counts match what I wrote down ✅
- [ ] New tables show 0 rows:
  - [ ] `agent_training_snippets rows: 0`
  - [ ] `master_memories rows: 0`
  - [ ] `context7_scopes rows: 0`
- [ ] See "Total indices: 15" (or similar) ✅

**If you see errors → STOP and take screenshot**  
**If no errors → Continue**

---

## Step 4: Verify New Tables Exist

- [ ] Cleared SQL Editor
- [ ] Pasted verification query (see guide Step 5.2)
- [ ] Clicked Run
- [ ] Results show all 3 tables:
  - [ ] `agent_training_snippets` (9 columns)
  - [ ] `context7_scopes` (11 columns)
  - [ ] `master_memories` (9 columns)

**If you see all 3 tables → SUCCESS! 🎉**

---

## Step 5: Test Tables (Optional)

- [ ] Pasted test insert query (see guide Step 6.1)
- [ ] Clicked Run
- [ ] Results show 1 row in each table
- [ ] (Optional) Ran cleanup query to delete test data

---

## ✅ Final Verification

Run this final check:

```sql
-- Copy and paste this
SELECT 'OLD DATA SAFE' as check_type, COUNT(*) as count FROM agent_prompts
UNION ALL
SELECT 'OLD DATA SAFE', COUNT(*) FROM agent_call_logs
UNION ALL
SELECT 'NEW TABLE READY', COUNT(*) FROM agent_training_snippets
UNION ALL
SELECT 'NEW TABLE READY', COUNT(*) FROM master_memories
UNION ALL
SELECT 'NEW TABLE READY', COUNT(*) FROM context7_scopes;
```

**Expected Results:**
- [ ] `OLD DATA SAFE` shows your original row counts (not 0)
- [ ] `NEW TABLE READY` shows 0 or 1 (if you ran tests)

---

## 🎉 Migration Complete!

- [ ] All original data is safe
- [ ] 3 new tables created
- [ ] No errors encountered
- [ ] Verified everything works

**You can now:**
- Close this checklist
- Update your application code
- Deploy to production
- Enable Context7 integration

---

## 🆘 If Something Went Wrong

**Take these steps:**

1. [ ] Take a screenshot of the error
2. [ ] Note which step number you're on
3. [ ] Check if your data is still there:
   ```sql
   SELECT COUNT(*) FROM agent_prompts;
   SELECT COUNT(*) FROM agent_call_logs;
   ```
4. [ ] If counts are correct, your data is safe!
5. [ ] Send screenshot for help

**Rollback (if needed):**
- [ ] Open `002_rollback_migration.sql`
- [ ] Copy all contents
- [ ] Paste into SQL Editor
- [ ] Run it
- [ ] This removes new tables but keeps your data

---

**Time Started:** _______  
**Time Finished:** _______  
**Total Time:** _______  

**Notes:**
```
(Write any issues or observations here)




```

---

**Version:** 1.0  
**Date:** 2025-11-03

