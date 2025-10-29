import { useState, useTransition } from 'react';

/**
 * Optimistic Updates Hook
 * Provides instant UI updates before server confirmation
 */
export function useOptimistic<T>(
  initialValue: T,
  updateFn: (current: T, optimisticValue: T) => T
) {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState({
    data: initialValue,
    optimisticUpdate: initialValue,
  });

  const updateOptimistic = (optimisticValue: T, reducer: (current: T) => T) => {
    startTransition(() => {
      setState(prev => ({
        data: prev.data,
        optimisticUpdate: updateFn(state.data, optimisticValue),
      }));

      // Apply reducer after a delay
      setTimeout(() => {
        setState(prev => ({
          data: reducer(prev.data),
          optimisticUpdate: prev.optimisticUpdate,
        }));
      }, 100);
    });
  };

  const reset = () => {
    setState({
      data: initialValue,
      optimisticUpdate: initialValue,
    });
  };

  return {
    data: state.data,
    optimisticData: state.optimisticUpdate,
    isPending,
    updateOptimistic,
    reset,
  };
}

