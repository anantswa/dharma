import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

/**
 * DedicationStore — Pariṇāmanā: the dedication of merit.
 *
 * At the close of a practice, the devotee may dedicate its merit — to a person
 * (kept private on-device) or to all beings. Canonical in both traditions
 * (puṇya-dāna / pariṇāmanā). Practice is so often FOR someone; this lets the
 * app honour that.
 */

const KEY = '@dharma:dedications';

type DedicationState = {
  /** Lifetime count of dedications made. */
  count: number;
  /** Most recent dedication targets (display only, capped). */
  recent: string[];
  loaded: boolean;
  load: () => Promise<void>;
  dedicate: (to: string) => Promise<void>;
};

export const useDedicationStore = create<DedicationState>((set, get) => ({
  count: 0,
  recent: [],
  loaded: false,

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) set({ ...JSON.parse(raw), loaded: true });
      else set({ loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  dedicate: async (to) => {
    const name = to.trim();
    if (!name) return;
    const s = get();
    const payload = {
      count: s.count + 1,
      recent: [name, ...s.recent.filter((r) => r !== name)].slice(0, 6),
    };
    set(payload);
    try { await AsyncStorage.setItem(KEY, JSON.stringify(payload)); } catch { /* noop */ }
  },
}));
