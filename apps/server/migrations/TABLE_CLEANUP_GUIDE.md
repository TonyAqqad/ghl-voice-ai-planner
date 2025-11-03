# 🧹 Database Table Cleanup Guide

Based on your screenshot, here's a complete analysis of your tables and what to do with them.

---

## ✅ KEEP - Core Application Tables (11 tables)

These are actively used by your application. **DO NOT DELETE!**

| Table Name | Purpose | Status |
|------------|---------|--------|
| `agent_call_logs` | Call conversation history | ✅ Keep |
| `agent_logs` | Agent activity logs | ✅ Keep |
| `agent_prompt_reviews` | Master Agent reviews | ✅ Keep |
| `agent_prompts` | Agent prompt templates | ✅ Keep |
| `agent_response_corrections` | Manual corrections | ✅ Keep |
| `agents` | Agent configurations | ✅ Keep |
| `locations` | Business locations | ✅ Keep |
| `tokens` | API tokens | ✅ Keep |
| `prompt_kits` | Prompt templates | ✅ Keep |
| `prompt_kits_niche_overlays` | Niche-specific prompts | ✅ Keep |
| `cost_entries` | Usage cost tracking | ✅ Keep |

---

## ✅ KEEP - New Context7 Tables (3 tables)

These were just created by your migration. **DO NOT DELETE!**

| Table Name | Purpose | Status |
|------------|---------|--------|
| `agent_training_snippets` | ⭐ Learning snippets | ✅ Keep (NEW) |
| `master_memories` | ⭐ Master AI knowledge | ✅ Keep (NEW) |
| `context7_scopes` | ⭐ Sync tracking | ✅ Keep (NEW) |

---

## ✅ KEEP - MCP Monitoring Tables (6 tables)

These are used for Model Context Protocol monitoring. **Keep these!**

| Table Name | Purpose | Status |
|------------|---------|--------|
| `mcp_action_retries` | Retry tracking | ✅ Keep |
| `mcp_agent_states` | Agent states | ✅ Keep |
| `mcp_feedback` | User feedback | ✅ Keep |
| `mcp_health_checks` | Health monitoring | ✅ Keep |
| `mcp_incidents` | Incident tracking | ✅ Keep |
| `mcp_traces` | Execution traces | ✅ Keep |

---

## ⚠️ EVALUATE - Potentially Unused Tables (2 tables)

These are marked as "Unrestricted" in your screenshot. Need to check if they're used.

### 1. `agent_training_data` ⚠️

**What it might be:**
- Old training data storage
- Possibly replaced by `agent_training_snippets` (new)

**Check if it's used:**
```sql
-- See if it has data
SELECT COUNT(*) FROM agent_training_data;

-- See what's in it
SELECT * FROM agent_training_data LIMIT 5;

-- Check its structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'agent_training_data';
```

**Decision:**
- ✅ **If empty (0 rows)** → Safe to drop
- ⚠️ **If has data** → Check if `agent_training_snippets` replaces it
- ❌ **If used in code** → Keep it!

---

### 2. `learned_patterns` ⚠️

**What it might be:**
- Pattern learning storage
- Possibly deprecated/unused

**Check if it's used:**
```sql
-- See if it has data
SELECT COUNT(*) FROM learned_patterns;

-- See what's in it
SELECT * FROM learned_patterns LIMIT 5;

-- Check its structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'learned_patterns';
```

**Decision:**
- ✅ **If empty (0 rows)** → Safe to drop
- ⚠️ **If has data** → Export first, then decide
- ❌ **If used in code** → Keep it!

---

## 🎯 Recommendation: Safe Cleanup Process

### Step 1: Analyze (5 minutes)

Run the analysis script to see what's in these tables:

```sql
-- Copy and paste from: 006_cleanup_unused_tables.sql
-- This will show you:
--   - Row counts
--   - Table sizes
--   - Column structures
--   - Foreign key dependencies
--   - Sample data
```

### Step 2: Search Your Codebase (5 minutes)

Search for references to these tables in your code:

**In VS Code/Cursor:**
```
Search for: "agent_training_data"
Search for: "learned_patterns"
```

**Places to check:**
- `apps/server/**/*.js` - Backend code
- `apps/web/**/*.ts` - Frontend code
- `apps/web/**/*.tsx` - React components
- SQL queries, migrations, etc.

### Step 3: Decide

| If you find... | Then... |
|----------------|---------|
| ✅ No code references + Empty tables | Safe to drop! |
| ⚠️ No code references + Has data | Export data first (just in case) |
| ❌ Code references found | Keep the tables! |

### Step 4: Drop Tables (if safe)

**Only run this if Step 1-3 confirm it's safe!**

```sql
-- Option A: Drop both tables
BEGIN;
DROP TABLE IF EXISTS agent_training_data CASCADE;
DROP TABLE IF EXISTS learned_patterns CASCADE;
COMMIT;

-- Option B: Drop one at a time (safer)
DROP TABLE IF EXISTS agent_training_data;
-- Test your app, if all good:
DROP TABLE IF EXISTS learned_patterns;
```

---

## 📊 Quick Decision Matrix

| Table | Empty? | Used in Code? | Has FKs? | Action |
|-------|--------|---------------|----------|--------|
| `agent_training_data` | ❓ | ❓ | ❓ | ⏸️ Check first |
| `learned_patterns` | ❓ | ❓ | ❓ | ⏸️ Check first |

**Fill in the ❓ by running the analysis script!**

---

## 🛡️ Safety First: Export Before Dropping

If you want to be extra safe, export data first:

```sql
-- Export agent_training_data to CSV (in Supabase dashboard)
-- Or use pg_dump:
pg_dump -h your-db-host -U postgres -t agent_training_data -d postgres > agent_training_data_backup.sql

pg_dump -h your-db-host -U postgres -t learned_patterns -d postgres > learned_patterns_backup.sql
```

Then you can always restore later if needed!

---

## ✅ My Recommendation

Based on typical patterns, here's what I recommend:

### 1. Check if `agent_training_data` is duplicate

If you just created `agent_training_snippets`, then `agent_training_data` might be the old version.

**Run this comparison:**
```sql
-- Compare structures
SELECT 'agent_training_data' as table_name, column_name 
FROM information_schema.columns 
WHERE table_name = 'agent_training_data'

UNION ALL

SELECT 'agent_training_snippets', column_name 
FROM information_schema.columns 
WHERE table_name = 'agent_training_snippets'
ORDER BY table_name, column_name;
```

**If they're similar:**
- ✅ Migrate data from old → new
- ✅ Drop the old table

### 2. Check if `learned_patterns` is used

**Search your codebase:**
```bash
# In terminal
cd "C:\Users\eaqqa\OneDrive\Desktop\THE MONEY MAKER\cursor-agent-builder\sandbox-apps\ghl-voice-ai-planner"
grep -r "learned_patterns" apps/
```

**If no results:**
- ✅ Probably safe to drop

---

## 🚀 Quick Start

**Run this analysis now (2 minutes):**

1. **Open Supabase SQL Editor**
2. **Copy/paste from:** `006_cleanup_unused_tables.sql`
3. **Run it**
4. **Review the output**
5. **Post results here** and I'll tell you exactly what to drop

---

## 💡 Expected Outcome

After cleanup, you should have **exactly these tables:**

**Core (11 tables):**
- agent_call_logs
- agent_logs
- agent_prompt_reviews
- agent_prompts
- agent_response_corrections
- agents
- locations
- tokens
- prompt_kits
- prompt_kits_niche_overlays
- cost_entries

**Context7 (3 tables):**
- agent_training_snippets ⭐
- master_memories ⭐
- context7_scopes ⭐

**MCP (6 tables):**
- mcp_action_retries
- mcp_agent_states
- mcp_feedback
- mcp_health_checks
- mcp_incidents
- mcp_traces

**Total: 20 tables** (clean and organized!)

---

## ❓ FAQ

**Q: What if I drop a table by mistake?**  
A: Supabase has daily backups. Go to Settings → Database → Backups to restore.

**Q: Will dropping tables break my app?**  
A: Not if they're unused! That's why we check first.

**Q: Should I drop tables now or later?**  
A: Run the analysis first. If they're empty and unused, drop them now for a cleaner database.

**Q: What does "Unrestricted" mean in Supabase?**  
A: It means Row Level Security (RLS) is not enabled. This is fine for internal tables.

---

## 🎯 Next Action

**Run the analysis script now:**

1. Open `006_cleanup_unused_tables.sql`
2. Copy all contents
3. Paste into Supabase SQL Editor
4. Click Run
5. Review the output
6. Post results here for guidance

**Time:** 5 minutes  
**Risk:** Zero (analysis only, no drops)

---

**Version:** 1.0  
**Last Updated:** 2025-11-03  
**Status:** Ready to analyze

