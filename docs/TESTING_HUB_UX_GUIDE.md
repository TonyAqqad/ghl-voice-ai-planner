# Testing Hub UX Refresh – Interaction Notes

## Slim Layout Highlights
- Status strip consolidates agent selection, niche context, and live metrics (tokens, latency, cost). Confidence gate state chips live here, replacing the previous sidebar card.
- Primary authoring card now fills the full column with softened borders and more breathing room for the spec guard rails (chips + lint panel).
- Q&A editor, prompt preview, and downstream orchestration controls follow as a single card stack – no more mixed three-column grid.

## Haptic + Animation Hooks
- Haptics fire on high-signal events only (`agent-switch`, `gate-flip`, `guidance-apply`, `confidence-cleared`). When vibration is unavailable or reduced motion is preferred, the hook silently no-ops.
- Animation easings reuse Apple-inspired curves (`0.4,0.0,0.2,1` enter, `0.2,0.8,0.4,1` exit) and shorter micro-timings (160–220 ms) for the card stack.

## QA Checklist
1. Desktop (Chrome/Edge):
   - Toggle Master AI features (guidance, quality gates, observability) and confirm the card stack expands with subtle fade/scale transitions.
   - Trigger a blocked response to surface the Quality Gate card — check that the diff chips and blocked reasons render inside the slim container.
2. Touch/Hybrid (Chrome DevTools sensors):
   - Emulate a mobile viewport; verify the status strip wraps agent + metrics cleanly and that action buttons stack.
   - Use the Sensors panel to simulate vibration support; haptic patterns should fire on agent switch and gate clear, then log to the console if blocked.
3. Reduced motion:
   - `prefers-reduced-motion: reduce` should suppress haptics and keep animations minimal (cards still fade without translate).

Log findings or regression notes in `LOCAL_APP_STATUS.md` before shipping.
