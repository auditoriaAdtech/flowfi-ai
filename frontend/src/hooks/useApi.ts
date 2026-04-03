'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

interface FetchResult<T> extends FetchState<T> {
  refetch: () => Promise<void>;
}

export function useFetch<T>(
  fetchFn: () => Promise<T>,
  deps: unknown[] = []
): FetchResult<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    isLoading: true,
    error: null,
  });

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await fetchFn();
      if (isMounted.current) {
        setState({ data, isLoading: false, error: null });
      }
    } catch (err) {
      if (isMounted.current) {
        setState({ data: null, isLoading: false, error: err as Error });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return { ...state, refetch: execute };
}

interface MutationState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  isSuccess: boolean;
}

interface MutationResult<TData, TArgs extends unknown[]> extends MutationState<TData> {
  mutate: (...args: TArgs) => Promise<TData>;
  reset: () => void;
}

export function useMutation<TData, TArgs extends unknown[] = unknown[]>(
  mutationFn: (...args: TArgs) => Promise<TData>
): MutationResult<TData, TArgs> {
  const [state, setState] = useState<MutationState<TData>>({
    data: null,
    isLoading: false,
    error: null,
    isSuccess: false,
  });

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const mutate = useCallback(
    async (...args: TArgs): Promise<TData> => {
      setState({ data: null, isLoading: true, error: null, isSuccess: false });
      try {
        const data = await mutationFn(...args);
        if (isMounted.current) {
          setState({ data, isLoading: false, error: null, isSuccess: true });
        }
        return data;
      } catch (err) {
        if (isMounted.current) {
          setState({ data: null, isLoading: false, error: err as Error, isSuccess: false });
        }
        throw err;
      }
    },
    [mutationFn]
  );

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null, isSuccess: false });
  }, []);

  return { ...state, mutate, reset };
}
