import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

/**
 * JapaStore — the mala counter's memory.
 * Lifetime japa rolls up into malas (×108) — the devotional odometer.
 */
const KEY = '@dharma:japa';

type JapaState = {
  /** Completed malas (108 each), lifetime. */
  malas: number;
  /** Total repetitions, lifetime. */
  totalReps: number;
  loaded: boolean;
  load: () => Promise<void>;
  completeMala: () => Promise<void>;
  addReps: (n: number) => Promise<void>;
};

const persist = (s: { malas: number; totalReps: number }) =>
  AsyncStorage.setItem(KEY, JSON.stringify(s)).catch(() => {});

export const useJapaStore = create<JapaState>((set, get) => ({
  malas: 0,
  totalReps: 0,
  loaded: false,
  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) set({ ...JSON.parse(raw), loaded: true });
      else set({ loaded: true });
    } catch { set({ loaded: true }); }
  },
  completeMala: async () => {
    const s = get();
    const next = { malas: s.malas + 1, totalReps: s.totalReps };
    set(next); await persist(next);
  },
  addReps: async (n) => {
    const s = get();
    const next = { malas: s.malas, totalReps: s.totalReps + n };
    set(next); await persist(next);
  },
}));
