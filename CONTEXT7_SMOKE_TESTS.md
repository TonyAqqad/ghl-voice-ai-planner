# Context7 Memory API Smoke Tests

**CRITICAL PRE-REQUISITE**: All tests must verify proper `scopeId` format.

## Scope ID Validation (NON-NEGOTIABLE)

Before any other tests, verify:

```bash
# Test scope ID generation
curl http://localhost:3000/api/test/scope-validation

# Expected format: scope:<locationId>:<agentId>:<promptHash>
# promptHash MUST be SHA-256 of exact system prompt text
```

**Failure Condition**: If any scopeId does NOT match `scope:*:*:*` format with valid SHA-256 hash, **STOP ALL TESTS**.

---

## Pre-Deployment Checks

### ✅ Check 1: Environment Configuration

```bash
# Verify environment variables
curl http://localhost:3000/api/config
```

**Expected**:
```json
{
  "enableContext7Memory": true,
  "context7Available": true,
  "environment": "production"
}
```

**Acceptance Criteria**:
- [ ] `ENABLE_CONTEXT7_MEMORY=true` in Render env
- [ ] `CONTEXT7_API_KEY` configured and not empty
- [ ] `/api/config` returns `context7Available: true`

---

### ✅ Check 2: Memory Health Check

```bash
curl http://localhost:3000/api/memory/health
```

**Expected**:
```json
{
  "available": true,
  "provider": "context7"
}
```

**Acceptance Criteria**:
- [ ] Status 200
- [ ] `available: true`
- [ ] `provider: "context7"`

**Failure Action**: If health check fails, Context7 API key is invalid or service is down. Do not proceed.

---

## Test 1: Snippet Retrieval (Read Path)

```bash
# Fetch snippets for a test scope
curl -X POST http://localhost:3000/api/memory/snippets \
  -H "Content-Type: application/json" \
  -d '{
    "scopeId": "scope:test-loc:test-agent:abc123def456",
    "limit": 5
  }'
```

**Expected Response**:
```json
{
  "snippets": [...],
  "source": "context7" | "cache" | "disabled",
  "count": <number>
}
```

**Acceptance Criteria**:
- [ ] Status 200 (or 503 with graceful fallback)
- [ ] `source` is one of: `context7`, `cache`, `disabled`
- [ ] If `source: "context7"`, Context7 is working
- [ ] If `source: "cache"`, caching is working
- [ ] If `source: "disabled"`, config is correct but feature is off
- [ ] Console logs show `[MEMORY]` entry with operation details

**Test Variations**:
- First call (cache miss) → `source: "context7"`
- Second identical call (cache hit) → `source: "cache"`
- Invalid scopeId format → Status 400

---

## Test 2: Snippet Save (Write Path)

```bash
# Save a snippet
curl -X PUT http://localhost:3000/api/memory/snippets \
  -H "Content-Type: application/json" \
  -d '{
    "scopeId": "scope:test-loc:test-agent:abc123def456",
    "snippet": {
      "id": "test-snippet-1",
      "trigger": "What are your hours?",
      "content": "We are open Mon-Fri 6am-8pm",
      "appliedAt": 1234567890000,
      "source": "voice-agent",
      "charLength": 28,
      "contentHash": "a1b2c3d4"
    }
  }'
```

**Expected Response** (Success):
```json
{
  "success": true,
  "source": "context7" | "hybrid",
  "snippetId": "test-snippet-1"
}
```

**Expected Response** (Graceful Failure):
```json
{
  "success": true,
  "source": "localStorage",
  "warning": "Context7 save failed, localStorage only"
}
```

**Acceptance Criteria**:
- [ ] Status 200 or 202
- [ ] `success: true` (even on Context7 failure)
- [ ] If status 200 and `source: "context7"`, snippet saved successfully
- [ ] If status 202 and `source: "localStorage"`, Context7 failed but fallback succeeded
- [ ] Network tab shows `PUT /api/memory/snippets` with correct payload
- [ ] Console shows cache invalidation: `[CACHE] invalidate snippets:scope:test-loc:test-agent:*`

---

## Test 3: Hybrid Behavior (Fallback Testing)

**Scenario**: Simulate Context7 failure to verify fallback works.

**Setup**: Temporarily set invalid `CONTEXT7_API_KEY` or block network access.

```bash
# With invalid key, save should still succeed (fallback to localStorage)
curl -X PUT http://localhost:3000/api/memory/snippets \
  -H "Content-Type: application/json" \
  -d '{ "scopeId": "scope:...", "snippet": {...} }'
```

**Expected**:
- Status 202 (Accepted)
- `source: "localStorage"`
- `warning: "Context7 save failed, localStorage only"`

**Acceptance Criteria**:
- [ ] No crashes or 500 errors
- [ ] Client receives successful response
- [ ] Console shows fallback warning
- [ ] Metrics show `fallbacksToLocalStorage` incremented

**Recovery**: Restore valid `CONTEXT7_API_KEY`.

---

## Test 4: Attestation UI Integration

**In Training Hub**:

1. Navigate to `/training-hub`
2. Run a test conversation
3. Open Attestation Panel

**Expected Attestation Fields**:
- [ ] **Scope ID**: `scope:<location>:<agent>:<hash>` (validate format!)
- [ ] **Prompt Hash**: 16-char hex string
- [ ] **SPEC Hash**: 16-char hex string
- [ ] **Memory Backend**: Badge showing `localStorage`, `context7`, `hybrid`, or `cache`
- [ ] **Snippets Applied**: Count (e.g., `3 (context7)`)
- [ ] **Token Budget**: `<used> / <max>`

**Visual Check**:
- [ ] Memory Backend badge color: green (`context7`), blue (`hybrid`), gray (`localStorage`)
- [ ] Tooltip on hover shows config status

**Failure Condition**: If **Scope ID** does not match `scope:*:*:*` format, training leakage is possible. STOP.

---

## Test 5: Guard Enforcement

**Test Early Booking Prevention**:

1. In Training Hub simulator, attempt to book without collecting required fields
2. Expected: Guard blocks booking and asks for missing fields

**Acceptance Criteria**:
- [ ] Response does NOT contain booking confirmation
- [ ] Response asks for `first_name`, `last_name`, `email`, `phone`, `class_date__time`
- [ ] Guard logs show block reason

**Test One-Question Cadence**:

1. Ask a question that triggers multiple questions in response
2. Expected: Guard trims response to one question

**Acceptance Criteria**:
- [ ] Only one question mark in final response
- [ ] No "Also, ..." or "Additionally, ..." patterns

---

## Test 6: Metrics & Observability

```bash
# Check memory metrics
curl http://localhost:3000/api/metrics/memory
```

**Expected Response**:
```json
{
  "uptime": 3600000,
  "uptimeFormatted": "1h 0m",
  "context7Requests": 42,
  "context7Errors": 2,
  "fallbacksToLocalStorage": 2,
  "cacheHits": 15,
  "cacheMisses": 27,
  "avgLatency": 145,
  "medianLatency": 120,
  "p95Latency": 350,
  "p99Latency": 500,
  "errorRate": 0.047619047619047616,
  "errorRatePercent": "4.76%",
  "fallbackRate": 0.047619047619047616,
  "fallbackRatePercent": "4.76%",
  "cacheHitRate": 0.35714285714285715,
  "cacheHitRatePercent": "35.71%",
  "requestsByOperation": {
    "retrieve": { "total": 30, "errors": 1 },
    "store": { "total": 12, "errors": 1 }
  },
  "errorsByType": {
    "network": 1,
    "timeout": 1
  },
  "cache": {
    "size": 8,
    "expired": 0,
    "totalHits": 15,
    "ttlMs": 300000
  }
}
```

**Acceptance Criteria**:
- [ ] Error rate < 5%
- [ ] Fallback rate < 10% (lower is better)
- [ ] Cache hit rate > 20% (higher is better)
- [ ] Avg latency < 200ms
- [ ] P95 latency < 500ms

**Alert Conditions** (fail test if exceeded):
- ❌ Error rate > 10%
- ❌ Fallback rate > 20%
- ❌ Avg latency > 1000ms

---

## Post-Call Learning Test

```bash
# Trigger learning from transcript
curl -X POST http://localhost:3000/api/mcp/agent/learn \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "test-agent",
    "locationId": "test-loc",
    "systemPrompt": "You are a helpful fitness assistant...",
    "transcript": [
      {"role": "user", "content": "What are your hours?"},
      {"role": "assistant", "content": "We are open Mon-Fri 6am-8pm"}
    ],
    "llmProvider": "openai"
  }'
```

**Expected**:
- Status 200
- Patterns returned
- Console logs: `💾 Saved N patterns to memory (database, context7)` or `(database)`

**Acceptance Criteria**:
- [ ] Patterns generated
- [ ] Patterns saved (check via scopeId query)
- [ ] Next conversation uses learned patterns (verify via attestation)

---

## Rollback Test

**Scenario**: Verify system works with Context7 disabled.

```bash
# Set environment (or via Render dashboard)
export ENABLE_CONTEXT7_MEMORY=false

# Restart server
# npm run dev

# Test snippet retrieval
curl -X POST http://localhost:3000/api/memory/snippets \
  -d '{"scopeId": "scope:...", "limit": 5}'
```

**Expected**:
```json
{
  "snippets": [],
  "source": "disabled"
}
```

**Acceptance Criteria**:
- [ ] No errors or crashes
- [ ] `source: "disabled"`
- [ ] System falls back to localStorage/database only
- [ ] Training Hub still works (uses localStorage)

---

## Final Verification

### Scope ID Consistency Check (CRITICAL)

Run this query to verify all stored snippets have valid scopeIds:

```bash
# Check database (if applicable)
# SELECT DISTINCT metadata->>'scopeId' FROM agent_response_corrections;

# Check Context7 via API (if possible)
# Verify all scopeIds match format: scope:<location>:<agent>:<hash>
```

**Failure Condition**: ANY scopeId that doesn't match `scope:*:*:*` format means training leakage is possible.

---

## Summary Checklist

Before declaring production-ready:

- [ ] All 6 smoke tests pass
- [ ] Scope ID format validated everywhere
- [ ] Error rate < 5%
- [ ] Fallback rate < 10%
- [ ] Cache hit rate > 20%
- [ ] Rollback test passes (system works with Context7 disabled)
- [ ] Attestation UI shows correct memory source
- [ ] Guard enforces rules (early booking, one-question)
- [ ] Post-call learning saves patterns correctly
- [ ] Metrics endpoint returns valid data

**Sign-off**: _____________ Date: _____________

---

## Troubleshooting

### Issue: scopeId format mismatch

**Symptom**: Training not applied, or applied to wrong agent.

**Fix**: Verify `generatePromptHash` uses SHA-256 of **exact** system prompt. Check:
- No extra whitespace
- No prompt modifications before hashing
- Same hash used for storage and retrieval

### Issue: High fallback rate

**Symptom**: `fallbackRatePercent > 20%`

**Possible Causes**:
1. Context7 API key invalid
2. Network issues
3. Rate limiting
4. Context7 service outage

**Fix**: Check logs for `[MEMORY_ERROR]` entries, verify API key, check Context7 status.

### Issue: Cache not working

**Symptom**: `cacheHitRate: 0%`

**Fix**: Verify `memoryCache` is singleton, TTL is reasonable (5min default), cache invalidation logic correct.

