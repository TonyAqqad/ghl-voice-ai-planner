import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { useHaptics } from '../useHaptics';

const originalNavigator = global.navigator;

describe('useHaptics', () => {
  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: false,
    });
  });

  it('gracefully disables when vibration support is missing', () => {
    Object.defineProperty(global, 'navigator', {
      value: {},
      configurable: true,
      writable: false,
    });

    const { result } = renderHook(() => useHaptics());
    expect(result.current.isSupported).toBe(false);

    expect(() => {
      act(() => {
        result.current.trigger('agent-switch');
      });
    }).not.toThrow();
  });

  it('invokes navigator.vibrate with configured patterns', () => {
    const vibrate = vi.fn();
    Object.defineProperty(global, 'navigator', {
      value: { vibrate },
      configurable: true,
      writable: false,
    });

    const { result } = renderHook(() => useHaptics({ enabled: true, reduceMotionOverrides: true }));

    act(() => {
      result.current.trigger('gate-flip');
    });

    expect(vibrate).toHaveBeenCalledWith([16, 40, 16]);
  });
});
