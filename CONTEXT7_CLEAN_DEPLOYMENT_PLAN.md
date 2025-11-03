# 🎯 Context7 Clean Deployment Plan (KISS Edition)

**Philosophy:** Keep It Simple, Stupid - No unnecessary complexity, fix what's broken, deploy what works.

**Date:** November 3, 2025  
**Status:** Ready to Execute

---

## ⚠️ STOP: Fix These Blockers First

### 1. 🔥 Vite Build Broken (CRITICAL)

**Problem:** `npm run build` fails with `vite: Permission denied`

**Fix (Unix/Mac/Git Bash):**
```bash
cd apps/web
chmod +x node_modules/.bin/vite
# OR if that doesn't work:
rm -rf node_modules package-lock.json
npm install
```

**Fix (Windows PowerShell):**
```powershell
cd apps\web
# Permissions are handled automatically on Windows
# If build still fails, reinstall dependencies:
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

**Verify:**
```bash
npm run build
# Should complete without permission errors
```

---

### 2. 🎨 Keep Tailwind (DO NOT REMOVE)

**Decision:** Tailwind is REQUIRED for UI. Do NOT prune:
- `tailwindcss`
- `postcss`
- `autoprefixer`

These are in `apps/web/package.json` and `tailwind.config.cjs`.

**Action:** Update any cleanup scripts to SKIP these packages.

---

### 3. 📝 No `deadcode` Script Exists

**Problem:** References to `npm run deadcode` but script doesn't exist.

**Fix (Choose One):**

**Option A: Add the script (if you want it)**
```json
// apps/web/package.json
{
  "scripts": {
    "deadcode": "npx knip --json --reporter json > knip-report.json"
  }
}
```

**Option B: Remove references (KISS approach - RECOMMENDED)**
Just delete mentions of `npm run deadcode` from docs. Not needed for Context7.

**Recommendation:** Option B - Keep it simple, we don't need this for Context7 deployment.

---

### 4. 🔌 MCP SDK Dependency

**Problem:** `apps/server/mcp/setup.js` uses `@modelcontextprotocol/sdk`

**Fix:** Keep this dependency - it's used for Context7 MCP integration.

**Action:** None needed. Do NOT remove this package.

---

## ✅ Pre-Flight Checklist

Run these checks **before** any deployment:

**Unix/Mac/Git Bash:**
```bash
# 1. Check git status
git status
# Should be clean or only show expected changes

# 2. Verify environment variables exist
echo $OPENAI_API_KEY
echo $CONTEXT7_API_KEY
echo $CONTEXT7_BASE_URL
echo $ENABLE_CONTEXT7_MEMORY

# 3. Fix vite permissions
cd apps/web && chmod +x node_modules/.bin/vite

# 4. Test build
npm run build
# Should succeed

# 5. Verify no TypeScript errors
npm run typecheck
# Should pass
```

**Windows PowerShell:**
```powershell
# 1. Check git status
git status
# Should be clean or only show expected changes

# 2. Verify environment variables exist (in apps/server/.env)
Get-Content apps\server\.env | Select-String -Pattern "OPENAI_API_KEY|CONTEXT7_API_KEY|CONTEXT7_BASE_URL|ENABLE_CONTEXT7_MEMORY"

# 3. No permission fix needed on Windows

# 4. Test build
npm run build
# Should succeed

# 5. Verify no TypeScript errors
npm run typecheck
# Should pass
```

---

## 🧪 Context7 Integration Test Plan (KISS)

### Test 1: Environment Check (2 minutes)

```bash
# Start server
cd apps/server
npm run dev

# In another terminal, check health
curl http://localhost:10000/api/memory/health

# Expected (if Context7 enabled):
# {"available": true, "provider": "context7"}

# Expected (if Context7 disabled - default):
# {"available": false, "reason": "Context7 memory not enabled"}
```

**Pass Criteria:** Health endpoint returns valid JSON with no errors.

---

### Test 2: Training Hub Smoke Test (5 minutes)

```bash
# Start both server and web
# Terminal 1:
cd apps/server && npm run dev

# Terminal 2:
cd apps/web && npm run dev

# Terminal 3: Open browser
open http://localhost:3001/training-hub
```

**Manual Steps:**
1. Select an agent
2. Start a test conversation
3. Send 3-5 messages
4. Click "End Call"
5. Check browser console for:
   - ✅ No "Master Agent Review skipped" warnings
   - ✅ No JSON parse errors
   - ✅ Memory source shows `localStorage` (default) or `context7` (if enabled)

**Pass Criteria:** No console errors, evaluation completes successfully.

---

### Test 3: Context7 Memory Flow (If Enabled - 5 minutes)

**Only run if `ENABLE_CONTEXT7_MEMORY=true`**

```bash
# 1. Make a correction in Training Hub
# 2. Check it was saved to Context7
curl -X POST http://localhost:10000/api/memory/snippets \
  -H "Content-Type: application/json" \
  -d '{
    "scopeId": "scope:default-location:1:abc123",
    "limit": 5
  }'

# 3. Start a new conversation
# 4. Verify correction is applied
# 5. Check attestation panel shows "Memory source: context7"
```

**Pass Criteria:** 
- Corrections save without errors
- Snippets retrieved successfully
- Memory source tracked in attestation

---

## 🚀 Deployment Plan (KISS)

### Phase 1: Deploy with Context7 DISABLED (Safe Default)

**Environment Variables:**
```bash
# In Render Dashboard OR .env file:
CONTEXT7_API_KEY=your_key_here
CONTEXT7_BASE_URL=https://context7.com/api
ENABLE_CONTEXT7_MEMORY=false  # ← DISABLED by default
```

**Deploy:**
```bash
git add .
git commit -m "feat: Context7 integration ready (disabled by default)"
git push origin main
```

**Verify:**
```bash
# After Render deploys
curl https://your-app.onrender.com/api/memory/health
# Expected: {"available": false, "reason": "Context7 memory not enabled"}
```

**Expected Behavior:** Works exactly like before, uses localStorage only.

---

### Phase 2: Enable Context7 (When Ready)

**In Render Dashboard:**
1. Go to Environment tab
2. Change: `ENABLE_CONTEXT7_MEMORY=true`
3. Save (triggers redeploy)

**Verify:**
```bash
curl https://your-app.onrender.com/api/memory/health
# Expected: {"available": true, "provider": "context7"}
```

**Monitor for 1 hour:**
- Check Render logs for errors
- Test Training Hub flows
- Verify attestations show Context7 usage

---

## 📊 Success Criteria

### Deployment is SUCCESSFUL if:

- [x] ✅ All fixes applied (vite permissions, Tailwind kept, etc.)
- [x] ✅ `npm run build` succeeds
- [x] ✅ `npm run typecheck` passes
- [x] ✅ Health endpoint responds correctly
- [x] ✅ Training Hub works (with or without Context7)
- [x] ✅ No console errors in browser
- [x] ✅ Render deployment succeeds
- [x] ✅ App loads and functions normally

### Context7 Integration is SUCCESSFUL if (Phase 2):

- [x] ✅ Memory health shows `available: true`
- [x] ✅ Snippets save to Context7
- [x] ✅ Snippets retrieved from Context7
- [x] ✅ Attestations show `memorySource: context7`
- [x] ✅ Fallback to localStorage works if Context7 fails
- [x] ✅ No user-facing errors

---

## 🔄 Rollback Plan (Simple)

### If Phase 1 Fails:
```bash
git revert HEAD
git push origin main
```

### If Phase 2 Fails (Context7 Issues):
In Render Dashboard:
```bash
ENABLE_CONTEXT7_MEMORY=false
```
Save. System reverts to localStorage.

---

## 🎯 What NOT To Do (Anti-Patterns)

❌ **Don't** remove Tailwind dependencies  
❌ **Don't** move test scripts around unnecessarily  
❌ **Don't** add complex dead code detection (not needed)  
❌ **Don't** remove `@modelcontextprotocol/sdk` (needed for MCP)  
❌ **Don't** prune dependencies without testing builds  
❌ **Don't** enable Context7 in production without Phase 1 success

---

## 📝 Execution Checklist

### Before You Start:
- [ ] Read this entire document
- [ ] Verify you have access to:
  - Render Dashboard
  - GitHub repo (push access)
  - Context7 account (API key)
  - Local dev environment

### Execution Order:
1. [ ] **Fix blockers** (vite permissions, verify Tailwind stays)
2. [ ] **Run pre-flight checklist** (all checks pass)
3. [ ] **Test locally** (Training Hub works)
4. [ ] **Deploy Phase 1** (Context7 disabled)
5. [ ] **Verify Phase 1** (app works normally)
6. [ ] **Wait 24 hours** (monitor for issues)
7. [ ] **Deploy Phase 2** (enable Context7)
8. [ ] **Verify Phase 2** (Context7 works)
9. [ ] **Monitor for 1 hour** (check logs/metrics)
10. [ ] **Done!** 🎉

---

## 🛠️ Quick Commands Reference

**Unix/Mac/Git Bash:**
```bash
# Fix vite permissions
cd apps/web && chmod +x node_modules/.bin/vite

# Test build
npm run build

# Start dev servers
cd apps/server && npm run dev  # Terminal 1
cd apps/web && npm run dev     # Terminal 2

# Check health
curl http://localhost:10000/api/memory/health

# Deploy (Git Bash recommended for cross-platform)
git add . && git commit -m "feat: Context7 ready" && git push origin main
```

**Windows PowerShell:**
```powershell
# No permission fix needed on Windows

# Test build
npm run build

# Start dev servers (separate terminals)
# Terminal 1:
cd apps\server; npm run dev
# Terminal 2:
cd apps\web; npm run dev

# Check health
curl http://localhost:10000/api/memory/health
# OR
Invoke-WebRequest -Uri http://localhost:10000/api/memory/health

# Deploy (use Git Bash for cross-platform compatibility)
git add .
git commit -m "feat: Context7 ready"
git push origin main
```

**Render Environment Variables:**
```
# Enable Context7 (Render Dashboard)
ENABLE_CONTEXT7_MEMORY=true

# Disable Context7 (Render Dashboard)
ENABLE_CONTEXT7_MEMORY=false
```

---

## ✅ Final Pre-Deployment Checklist

Before pushing to production:

- [ ] ✅ Vite permissions fixed (`chmod +x node_modules/.bin/vite`)
- [ ] ✅ Build succeeds (`npm run build`)
- [ ] ✅ TypeCheck passes (`npm run typecheck`)
- [ ] ✅ Tailwind dependencies NOT removed
- [ ] ✅ `@modelcontextprotocol/sdk` NOT removed
- [ ] ✅ Training Hub tested locally (works)
- [ ] ✅ Health endpoint responds (200 OK)
- [ ] ✅ No console errors in browser
- [ ] ✅ Git status clean or expected changes only
- [ ] ✅ `ENABLE_CONTEXT7_MEMORY=false` set (Phase 1)

**Once all checked:** You're ready to deploy! 🚀

---

## 🎯 TLDR (Too Long; Didn't Read)

**The KISS Version:**

1. **Fix vite:** `chmod +x apps/web/node_modules/.bin/vite`
2. **Keep Tailwind:** Don't remove it
3. **Test locally:** Training Hub should work
4. **Deploy Phase 1:** Context7 disabled (safe)
5. **Deploy Phase 2:** Enable Context7 later
6. **If issues:** Set `ENABLE_CONTEXT7_MEMORY=false`

That's it. Simple.

---

**Questions?** Check the main docs:
- `FIXES_APPLIED.md` - What we fixed
- `QUICK_START_CONTEXT7.md` - 2-minute setup
- This file - Deployment plan

