/**
 * useSearchHistory — Persisted search history via AsyncStorage
 * Max 5 recent terms, newest first.
 */
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@search_history';
const MAX_ITEMS = 5;

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try { setHistory(JSON.parse(raw)); } catch {}
      }
    });
  }, []);

  const persist = useCallback(async (items: string[]) => {
    setHistory(items);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, []);

  const addTerm = useCallback(async (term: string) => {
    const t = term.trim();
    if (!t) return;
    const next = [t, ...history.filter(h => h !== t)].slice(0, MAX_ITEMS);
    await persist(next);
  }, [history, persist]);

  const removeTerm = useCallback(async (term: string) => {
    await persist(history.filter(h => h !== term));
  }, [history, persist]);

  const clearAll = useCallback(async () => {
    await persist([]);
  }, [persist]);

  return { history, addTerm, removeTerm, clearAll };
}
