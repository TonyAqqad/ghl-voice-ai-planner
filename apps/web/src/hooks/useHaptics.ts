import { useCallback, useMemo } from 'react';

type HapticEvent =
  | 'agent-switch'
  | 'gate-flip'
  | 'guidance-expand'
  | 'guidance-apply'
  | 'quality-blocked'
  | 'quality-approved'
  | 'observability-expand'
  | 'confidence-armed'
  | 'confidence-cleared';

type HapticPattern = number | number[];

const BASE_PATTERNS: Record<HapticEvent, HapticPattern> = {
  'agent-switch': 12,
  'gate-flip': [16, 40, 16],
  'guidance-expand': 10,
  'guidance-apply': [14, 30, 14],
  'quality-blocked': [30, 80, 28, 60, 22],
  'quality-approved': [18, 36, 18],
  'observability-expand': 10,
  'confidence-armed': [28, 120, 18, 80, 18],
  'confidence-cleared': [20, 45, 20],
};

export interface UseHapticsOptions {
  enabled?: boolean;
  reduceMotionOverrides?: boolean;
}

export interface UseHapticsResult {
  isSupported: boolean;
  trigger: (event: HapticEvent) => void;
  patterns: Record<HapticEvent, HapticPattern>;
}

function canUseVibration(): boolean {
  if (typeof navigator === 'undefined') return false;
  return typeof navigator.vibrate === 'function';
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  const query = window.matchMedia('(prefers-reduced-motion: reduce)');
  return query.matches;
}

export function useHaptics(options: UseHapticsOptions = {}): UseHapticsResult {
  const { enabled = true, reduceMotionOverrides = false } = options;

  const isSupported = useMemo(() => canUseVibration(), []);
  const shouldRespectReduced = useMemo(() => !reduceMotionOverrides && prefersReducedMotion(), [reduceMotionOverrides]);

  const trigger = useCallback(
    (event: HapticEvent) => {
      if (!enabled || !isSupported || shouldRespectReduced) return;
      const pattern = BASE_PATTERNS[event];
      try {
        navigator.vibrate(pattern);
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn('[useHaptics] vibrate failed', err);
        }
      }
    },
    [enabled, isSupported, shouldRespectReduced]
  );

  return {
    isSupported: enabled && isSupported && !shouldRespectReduced,
    trigger,
    patterns: BASE_PATTERNS,
  };
}

export type { HapticEvent, HapticPattern };
