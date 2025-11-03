# Testing Hub Slim Layout Wireframes

## 1. Overview

- Mode: sandbox/Training Hub (`TrainingHub.tsx`)
- Goal: lighten perception of density, clarify intervention states, surface haptics for key actions
- Deliverables: textual wireframes with component notes + proposed haptic patterns

---

## 2. Global Frame

```
┌─────────────────────────────────────────────────────────────┐
│ Master Toolbar                                              │
│ ├─ Agent selector │ Gate status chip │ Quick actions        │
│ └─ Observability summary (tokens, latency, cost)            │
├─────────────────────────────────────────────────────────────┤
│ Content Stack                                               │
│ ├─ Guidance Card (expandable)                               │
│ ├─ Quality Gate Card (expanded when blocked)                │
│ ├─ Observability Timeline (accordion)                       │
│ └─ Confidence Gate Banner (conditional)                     │
└─────────────────────────────────────────────────────────────┘
```

- **Layout**: single column, 960px max width, centered with 24px padding
- **Haptics**: light tap when switching agents, medium tap when gate status flips

---

## 3. Pre-Turn Guidance Card

```
┌ Guidance Card───────────────────────────────────────────────┐
│ HEADER: "Master AI Preview"  (right: confidence pill)       │
│ BODY:                                                       │
│   • Recommended response (collapsible diff view)            │
│   • Reasoning bullets (2 max)                               │
│   • Field to collect / collected tags                       │
│ FOOTER:                                                     │
│   [Use Response] [View Alternatives]                        │
└─────────────────────────────────────────────────────────────┘
```

- **Animation**: quick fade + 8px upward translate, 180ms spring curve
- **Haptics**: light tap on expand/collapse, medium tap when applying response

---

## 4. Quality Gate Card (Blocked State)

```
┌ Quality Gate────────────────────────────────────────────────┐
│ HEADER: Shield icon + status pill ("Blocked") + scores      │
│ INLINE MESSAGE (yellow): identical suggestion notice        │
│ TWO-COLUMN DIFF (stack on mobile):                          │
│   • Agent response w/ strikethrough chips                   │
│   • Suggested fix with highlights                           │
│ ISSUES LIST: pill chips                                     │
│ WARNINGS / BLOCKED REASONS: inline tag rows                 │
│ ACTION ROW: [Apply Fix] [Override]                          │
│ COLLAPSED OBSERVABILITY (disclosure)                        │
└─────────────────────────────────────────────────────────────┘
```

- **Animation**: 220ms scale-in for card, 140ms stagger for diff rows
- **Haptics**: heavy tap on blocked entry, success tap on approve/apply fix

---

## 5. Observability Timeline

```
┌ Observability Timeline (accordion)──────────────────────────┐
│ Summary bar: tokens, latency, cost                          │
│ ├─ Event item (guidance)                                    │
│ │   timestamp · type pill · model tag                       │
│ │   expanded details (JSON preview, rule hits)              │
│ └─ ...                                                      │
└─────────────────────────────────────────────────────────────┘
```

- **Animation**: slide down with opacity on accordion open
- **Haptics**: light tap on event expansion

---

## 6. Confidence Gate Banner

```
┌ Confidence Gate Alert───────────────────────────────────────┐
│ Icon + "Confidence Gate Active"                             │
│ Support copy & CTA "Clear Gate (Sandbox Only)"              │
└─────────────────────────────────────────────────────────────┘
```

- **Animation**: subtle pulse (opacity loop) while active
- **Haptics**: heavy tap when gate activates; no vibration on passive pulse

---

## 7. Responsive Notes

- Breakpoints at 768px (stack action buttons vertical) & 480px (full-width cards)
- Cards use intrinsic height; overflow scroll only in Observability details

---

## 8. Next Steps

1. Build grayscale prototype in Figma to verify spacing
2. Translate global layout to Tailwind utilities
3. Implement `useHaptics` wrapper and wire to action handlers
4. Update animations in `animations.ts` to match timing spec
5. Validate on touch devices, ensure fallback when haptics unsupported

