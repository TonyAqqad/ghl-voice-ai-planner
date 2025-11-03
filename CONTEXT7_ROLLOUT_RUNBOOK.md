# Context7 Memory API Production Rollout Runbook

## Overview

This runbook guides the production rollout of Context7 Memory API integration for the Master AI system.

**Risk Level**: LOW  
**Rollback Time**: < 5 minutes  
**Zero Downtime**: YES (graceful fallback to localStorage)

---

## Pre-Rollout Checklist

### 1. Prerequisites

- [ ] Context7 API key obtained and validated
- [ ] All Phase 1 & 2 tasks complete
- [ ] Smoke tests pass on staging (see `CONTEXT7_SMOKE_TESTS.md`)
- [ ] Team briefed on rollout procedure
- [ ] Rollback procedure reviewed
- [ ] Monitoring dashboards ready

### 2. Critical Validation

**MUST verify before proceeding**:

```bash
# Test scopeId generation locally
node -e "
const { generateScopeId } = require('./apps/server/lib/scopeUtils');
generateScopeId({
  locationId: 'test',
  agentId: 'agent-1',
  promptText: 'You are a helpful assistant'
}).then(console.log);
"

# Expected output format: scope:test:agent-1:<16-char-hex>
```

- [ ] Output matches `scope:*:*:*` format
- [ ] promptHash is 16-character hex string
- [ ] No placeholders or hardcoded values

---

## Rollout Steps

### Step 1: Enable in Render (Staging First)

**Staging Environment**:

1. Go to Render Dashboard > Staging Service > Environment
2. Add/update variables:
   ```
   CONTEXT7_API_KEY=<your_staging_key>
   CONTEXT7_BASE_URL=https://context7.com/api
   ENABLE_CONTEXT7_MEMORY=true
   ```
3. Click "Save" (triggers redeploy, ~3-5 min)
4. Wait for deployment to complete

**Verify Staging**:

```bash
# Health check
curl https://staging.your-app.com/api/memory/health

# Expected: {"available":true,"provider":"context7"}
```

- [ ] Health check returns `available:true`
- [ ] No errors in Render logs
- [ ] Run full smoke test suite

**Decision Point**: If staging tests fail, DO NOT proceed to production. Debug issues first.

---

### Step 2: Production Deployment

**Only proceed if staging tests pass 100%**.

1. Go to Render Dashboard > **Production** Service > Environment
2. Add same variables as staging:
   ```
   CONTEXT7_API_KEY=<your_production_key>
   CONTEXT7_BASE_URL=https://context7.com/api
   ENABLE_CONTEXT7_MEMORY=true
   ```
3. Click "Save" (triggers production redeploy)
4. **Monitor closely during deployment** (next 15 minutes)

**Monitoring During Rollout**:

```bash
# Watch logs in real-time
# Render Dashboard > Logs > Filter: [MEMORY]

# Check metrics every 2 minutes
curl https://app.com/api/metrics/memory | jq
```

**Watch for**:
- ✅ `✅ Memory API routes enabled (Context7 integration)`
- ✅ `✅ Context7 sync job initialized`
- ❌ Any `[MEMORY_ERROR]` entries (investigate immediately)

---

### Step 3: Verify Health (First Hour)

**Immediate Checks** (within 5 minutes of deployment):

```bash
# 1. Config endpoint
curl https://app.com/api/config
# Expected: {"enableContext7Memory":true,"context7Available":true}

# 2. Health check
curl https://app.com/api/memory/health
# Expected: {"available":true,"provider":"context7"}

# 3. Metrics baseline
curl https://app.com/api/metrics/memory
# Expected: context7Requests=0, no errors yet
```

- [ ] All endpoints return 200
- [ ] Context7 reported as available
- [ ] No startup errors in logs

**15-Minute Check**:

```bash
curl https://app.com/api/metrics/memory | jq '.errorRatePercent, .fallbackRatePercent, .avgLatency'
```

**Alert if**:
- ❌ Error rate > 10%
- ❌ Fallback rate > 20%
- ❌ Avg latency > 1000ms

**30-Minute Check**:

Same as 15-minute, thresholds tighter:
- ❌ Error rate > 5%
- ❌ Fallback rate > 10%

**60-Minute Check**:

```bash
# Full metrics review
curl https://app.com/api/metrics/memory | jq

# Check for:
# - context7Requests > 0 (system is being used)
# - errorRate < 0.05 (< 5%)
# - cacheHitRate > 0.2 (> 20%)
```

- [ ] At least some Context7 requests logged
- [ ] Error rate acceptable
- [ ] Cache working (hit rate > 20%)

---

### Step 4: Run Backfill (Optional)

**Only if you want to hydrate Context7 with existing data**.

```bash
# Trigger manual backfill
curl -X POST https://app.com/api/admin/sync-context7 \
  -H "Content-Type: application/json" \
  -d '{}'

# Response: {"message":"Full sync started (running async)"}
```

**Monitor backfill**:

```bash
# Watch logs for completion
# Expected: [SYNC] Complete: N synced, M errors in Xms
```

- [ ] Backfill completes without fatal errors
- [ ] Sync errors < 5% of total
- [ ] Check metrics for spike in Context7 requests

**Note**: Backfill runs asynchronously and can take 10-30 minutes depending on data volume. Do not wait for completion to proceed.

---

### Step 5: Validate End-to-End

**Test in Production UI**:

1. Open Training Hub at https://app.com/training-hub
2. Run a test conversation
3. Open Attestation Panel
4. Verify:
   - [ ] **Memory Backend** badge shows `context7` or `hybrid` (not `localStorage`)
   - [ ] **Scope ID** format is `scope:<location>:<agent>:<hash>`
   - [ ] **Snippets Applied** count > 0 (if expected)
   - [ ] No errors in browser console

**Test Post-Call Learning**:

1. Complete a conversation in the simulator
2. Trigger learning (if automatic or via UI button)
3. Check logs for: `💾 Saved N patterns to memory (database, context7)`
4. Verify next conversation uses learned patterns (attestation should show snippets)

---

## Rollout Validation Criteria

Mark rollout as **SUCCESSFUL** if all these are true after 1 hour:

- [ ] Health check returns `available:true`
- [ ] Error rate < 5%
- [ ] Fallback rate < 10%
- [ ] Cache hit rate > 20%
- [ ] Attestation UI shows correct memory source
- [ ] Post-call learning saves to Context7
- [ ] No customer-impacting incidents
- [ ] Render logs clean (no repeated errors)

---

## Rollback Procedure

**If issues arise, rollback immediately**:

### Rollback Steps (< 5 minutes)

1. Go to Render Dashboard > Production Service > Environment
2. Set: `ENABLE_CONTEXT7_MEMORY=false`
3. Click "Save" (redeploys in ~3 min)
4. Verify rollback:
   ```bash
   curl https://app.com/api/config
   # Expected: {"enableContext7Memory":false}
   
   curl https://app.com/api/memory/health
   # Expected: {"available":false,"reason":"Context7 disabled in environment"}
   ```

5. Confirm system works:
   ```bash
   # Snippets should return empty/disabled
   curl -X POST https://app.com/api/memory/snippets -d '{"scopeId":"scope:..."}' 
   # Expected: {"snippets":[],"source":"disabled"}
   ```

**Post-Rollback**:
- System reverts to localStorage/database only
- **Zero data loss** (hybrid mode saved everything locally)
- All training functionality still works
- Debug Context7 issues offline

---

## Monitoring Dashboards

### 1. Memory Metrics Dashboard

**URL**: `https://app.com/api/metrics/memory`

**Key Metrics**:
- `errorRatePercent` - Should be < 5%
- `fallbackRatePercent` - Should be < 10%
- `avgLatency` - Should be < 200ms
- `cacheHitRatePercent` - Should be > 20%

### 2. Render Logs

**URL**: Render Dashboard > Logs

**Filter for**:
- `[MEMORY]` - All memory operations
- `[MEMORY_ERROR]` - Errors only
- `[SYNC]` - Backfill operations
- `[CACHE]` - Cache operations

### 3. Observability UI (In-App)

Navigate to `/observability` or wherever memory metrics panel is displayed.

**Check**:
- Memory adapter status
- Recent error count
- Latency trends
- Cache performance

---

## Common Issues & Solutions

### Issue 1: High Error Rate (> 10%)

**Symptoms**:
- Metrics show `errorRatePercent > 10%`
- Logs full of `[MEMORY_ERROR]` entries

**Possible Causes**:
1. Invalid Context7 API key
2. Network connectivity issues
3. Context7 service outage
4. Rate limiting

**Debug Steps**:
```bash
# Test API key manually
curl https://context7.com/api/v1/health \
  -H "Authorization: Bearer $CONTEXT7_API_KEY"

# Check for rate limits in response headers
curl -v https://app.com/api/memory/health 2>&1 | grep -i "rate"
```

**Fix**:
- If API key invalid: Update in Render env and redeploy
- If rate limited: Reduce request frequency or upgrade Context7 plan
- If service outage: Wait or rollback

---

### Issue 2: High Fallback Rate (> 20%)

**Symptoms**:
- Metrics show `fallbackRatePercent > 20%`
- Logs show frequent fallback warnings

**This is not fatal** (system still works), but indicates Context7 reliability issues.

**Investigate**:
```bash
# Check error types
curl https://app.com/api/metrics/memory | jq '.errorsByType'
```

**Common causes**:
- `network`: Intermittent connectivity
- `timeout`: Context7 API slow
- `api_error`: Context7 returning errors

**Fix**:
- If transient: Monitor, may self-resolve
- If persistent: Contact Context7 support
- Consider rollback if > 50%

---

### Issue 3: Cache Not Working

**Symptoms**:
- `cacheHitRate: 0%` or very low
- Logs show no `[CACHE] hit` entries

**Debug**:
```bash
# Check cache stats
curl https://app.com/api/metrics/memory | jq '.cache'
```

**Possible causes**:
1. Cache TTL too short (default 5min)
2. Cache being invalidated too frequently
3. Unique scopeIds on every request (shouldn't happen)

**Fix**:
- Check scopeId consistency (should be stable for same agent+prompt)
- Adjust TTL if needed (in `memoryCache.js`)
- Verify cache singleton is working

---

### Issue 4: scopeId Format Errors

**Symptoms**:
- Errors like: `Invalid scopeId format: ...`
- Training not being applied

**This is CRITICAL** - indicates training leakage risk.

**Debug**:
```bash
# Check logs for invalid scopeIds
# Render Dashboard > Logs > Search: "Invalid scopeId"
```

**Fix**:
- Verify `scopeUtils.js` is being used everywhere
- Check that `generateScopeId` is called with full system prompt
- Ensure no placeholders remain in code
- Run smoke test "Scope ID Validation" section

---

## Post-Rollout Actions

### Day 1
- [ ] Monitor metrics hourly
- [ ] Check for any customer reports of issues
- [ ] Review error logs for patterns
- [ ] Document any unexpected behavior

### Week 1
- [ ] Daily metrics review
- [ ] Weekly sync job verification (check logs Monday 2:05am)
- [ ] Cache hit rate optimization (adjust TTL if needed)
- [ ] Performance baseline establishment

### Month 1
- [ ] Review Context7 costs vs benefits
- [ ] Analyze snippet effectiveness (A/B testing results)
- [ ] Optimize cache TTL based on usage patterns
- [ ] Plan for full Context7 feature adoption

---

## Success Metrics

After 30 days, evaluate success:

**Technical Metrics**:
- Error rate consistently < 3%
- Fallback rate < 5%
- Cache hit rate > 30%
- Avg latency < 150ms
- Zero customer-impacting incidents

**Business Metrics**:
- Training application rate improved
- Agent response quality improved
- Reduced manual corrections needed

---

## Emergency Contacts

**Context7 Support**: [support@context7.ai]  
**Internal Team Lead**: [your-email]  
**Render Status**: [status.render.com]  

**Escalation Path**:
1. Check Render logs and metrics
2. Attempt rollback if critical
3. Contact Context7 if API issue
4. Document incident for postmortem

---

## Sign-Off

**Rollout Completed By**: _______________  
**Date/Time**: _______________  
**Final Error Rate**: _______________  
**Final Fallback Rate**: _______________  
**Issues Encountered**: _______________  
**Rollback Needed**: YES / NO

---

## Appendix: Environment Variables Reference

```bash
# Required for Context7
CONTEXT7_API_KEY=<your_key>         # REQUIRED
CONTEXT7_BASE_URL=https://context7.com/api  # Optional, has default
ENABLE_CONTEXT7_MEMORY=true         # Set to 'false' to disable

# Related settings
NODE_ENV=production
PORT=3000
```

**Security Note**: Never commit `CONTEXT7_API_KEY` to git. Always use Render environment variables.

