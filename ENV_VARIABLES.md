# Environment Variables

## Master AI Temperature Configuration

### MASTER_AI_TEMPERATURE_GUIDANCE
- **Description:** Temperature for pre-turn guidance generation
- **Default:** `0.3`
- **Range:** `0.1` (very conservative) to `0.7` (very creative)
- **Purpose:** Controls how creative/flexible the Master AI is when suggesting ideal responses

Lower values = more conservative, stricter adherence to rules
Higher values = more creative, explores alternative phrasings

### MASTER_AI_TEMPERATURE_REVIEW
- **Description:** Temperature for quality gate review
- **Default:** `0.2`
- **Range:** `0.1` (very strict) to `0.7` (very lenient)
- **Purpose:** Controls how strict the quality gate is when reviewing agent responses

Lower values = stricter quality gates, more likely to block
Higher values = more lenient quality gates, more likely to approve

---

## Eliminating Temperature-Based Spec Drift

If you're experiencing mismatch warnings where guidance approves but review blocks, set both temperatures to the same value:

```bash
# Example: Set both to 0.25 for balanced behavior
MASTER_AI_TEMPERATURE_GUIDANCE=0.25
MASTER_AI_TEMPERATURE_REVIEW=0.25
```

---

## Recommended Configurations

### Strict Mode (Production)
```bash
MASTER_AI_TEMPERATURE_GUIDANCE=0.2
MASTER_AI_TEMPERATURE_REVIEW=0.2
```
- Minimal creativity, maximum consistency
- Best for production agents with well-defined rules

### Balanced Mode (Default)
```bash
MASTER_AI_TEMPERATURE_GUIDANCE=0.3
MASTER_AI_TEMPERATURE_REVIEW=0.2
```
- Guidance explores creative options, review stays strict
- May cause occasional mismatches (expected behavior)

### Exploratory Mode (Training)
```bash
MASTER_AI_TEMPERATURE_GUIDANCE=0.4
MASTER_AI_TEMPERATURE_REVIEW=0.3
```
- More creative guidance, slightly lenient review
- Good for discovering new phrasings during training

---

## Monitoring Temperature Settings

Server startup logs show active configuration:
```
🌡️ Master AI Temperature Config: {
  guidance: 0.3,
  review: 0.2,
  aligned: false
}
```

Per-request diagnostic logs show which temperature was used:
```
🔍 DIAGNOSTIC: Pre-Turn Guidance Request { temperature: 0.3, ... }
🔍 DIAGNOSTIC: Quality Review Request { temperature: 0.2, ... }
```

---

## Troubleshooting

### Symptom: Too many blocked responses
**Solution:** Increase `MASTER_AI_TEMPERATURE_REVIEW` from `0.2` to `0.3`

### Symptom: Guidance and review always mismatch
**Solution:** Set both to same value (e.g., `0.25`)

### Symptom: Responses too creative/off-brand
**Solution:** Decrease `MASTER_AI_TEMPERATURE_GUIDANCE` from `0.3` to `0.2`

### Symptom: Responses too rigid/robotic
**Solution:** Increase `MASTER_AI_TEMPERATURE_GUIDANCE` from `0.3` to `0.4`

---

## Related Features

- **System Prompt Hash Verification:** Logs show if guidance/review use different prompt versions
- **Semantic Similarity Detection:** 70% threshold for mismatch detection (Levenshtein distance)
- **Spec Drift Banner:** UI alerts user when guidance/review conflict
