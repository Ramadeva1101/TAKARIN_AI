import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';

// Memuat data dari API dengan status loading / error / data.
export function useApi(path) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const muat = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      setState({ data: await api(path), loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error });
    }
  }, [path]);
  useEffect(() => {
    muat();
  }, [muat]);
  return { ...state, muat };
}
