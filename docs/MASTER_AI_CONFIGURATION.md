# Master AI Configuration Guide

## What Was Fixed

### 1. **Secret Prompt Problem** ✅ FIXED
**Issue:** Master AI was using hardcoded rules that overrode your agent's system prompt.

**Solution:** Master AI now **strictly follows** your agent's system prompt. It will NOT invent rules or enforce guidelines that aren't explicitly in your prompt.

### 2. **Aggressive Quality Gate** ✅ FIXED
**Issue:** Quality gate was blocking responses with 0 scores, making conversations too slow for voice.

**Solution:**
- **Training Mode:** Quality gate is now lenient - warns but doesn't block unless there's a CRITICAL violation
- **Critical Violations Only:** Only blocks for AI self-reference ("I'm an AI") or backend mentions (GHL, CRM)
- **Low Scores:** If score is low but no critical violation, response is approved with a warning

### 3. **Error Handling** ✅ IMPROVED
Better logging for 500 errors with stack traces to help debug issues.

---

## How to Use Master AI

### Toggle Master AI Features

In Training Hub, you'll see these options:

```
☐ Enable Master AI (overall toggle)
  ☐ Pre-Turn Guidance (shows recommended responses)
  ☐ Quality Gates (checks responses for violations)
  ☐ Show Observability (audit logs, tokens, costs)
```

### Recommended Settings

**For Voice Training (Fast Iteration):**
- ✅ Enable Master AI
- ✅ Pre-Turn Guidance (helpful suggestions)
- ⚠️ Quality Gates OFF (too slow for voice)
- ✅ Show Observability (see what's happening)

**For Production Testing:**
- ✅ Enable Master AI
- ⚠️ Pre-Turn Guidance OFF (let agent be natural)
- ✅ Quality Gates ON (catch critical errors)
- ✅ Show Observability (monitor performance)

---

## Master AI Now Follows YOUR Rules

The Master AI will:
1. **Read your agent's system prompt**
2. **Follow ONLY the rules you wrote**
3. **Not add its own opinions**
4. **Only block critical violations** (AI self-reference, backend mentions)

### Example

**Your System Prompt:**
```
You are a receptionist for Acme Gym.
Ask 2-3 questions per turn.
Be friendly and casual.
```

**Master AI Will:**
- ✅ Allow 2-3 questions (because YOU said so)
- ✅ Allow casual tone (because YOU said so)
- ❌ NOT enforce "one question only" (not in your prompt)

**Master AI Will Still Block:**
- ❌ "I'm an AI assistant" (universal rule)
- ❌ "Let me check our GHL CRM" (universal rule)

---

## Troubleshooting

### Pre-Turn Guidance Returns 500 Error

**Check:**
1. Is `OPENAI_API_KEY` set in Render environment?
2. Check Render logs for detailed error message
3. Look for network/timeout issues

**Quick Fix:** Disable Pre-Turn Guidance temporarily

### Quality Gate Still Blocking Everything

**Check:** Is "Enable Master AI" toggled ON? If not, gates won't work.

**Quick Fix:** 
- Disable Quality Gates in Training Hub
- OR refresh page (gates are lenient after this fix)

### Master AI Ignoring My Corrections

**Before Fix:** Master AI had hardcoded rules
**After Fix:** Master AI reads YOUR system prompt

**To Verify:**
1. Edit your agent's system prompt
2. Run a test conversation
3. Master AI should follow your NEW rules

---

## Next: Clean Up Training Hub UI

The Training Hub currently shows:
- Master AI toggles
- Pre-turn guidance panel
- Quality gate warnings
- Confidence gate card  
- Golden dataset panel
- Conversation simulator

**Options for cleaner UI:**
1. **Tabbed Layout:** Training | Golden Dataset | Observability
2. **Collapsible Sections:** Show/hide panels as needed
3. **Two-Column Layout:** Left = controls, Right = conversation

Which would you prefer?

