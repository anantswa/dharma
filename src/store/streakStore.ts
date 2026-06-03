import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

/**
 * StreakStore — the daily-darshan habit engine.
 *
 * Records one "visit" per local calendar day. Consecutive days grow the streak;
 * a missed day resets it to 1 on the next visit. This is the variable-reward hook
 * the product spec calls "Prasad" — surfaced on the temple Home screen.
 */
const STORAGE_KEY = '@dharma:streak';

type StreakState = {
  currentStreak: number;
  longestStreak: number;
  lastVisit: string | null; // YYYY-MM-DD (local)
  totalDarshans: number;
  loaded: boolean;
  load: () => Promise<void>;
  /** Call on Home mount / app foreground. Returns the (possibly updated) streak. */
  recordVisit: () => Promise<number>;
};

const localDay = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const daysBetween = (a: string, b: string) => {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const ams = Date.UTC(ay, am - 1, ad);
  const bms = Date.UTC(by, bm - 1, bd);
  return Math.round((bms - ams) / 86400000);
};

export const useStreakStore = create<StreakState>((set, get) => ({
  currentStreak: 0,
  longestStreak: 0,
  lastVisit: null,
  totalDarshans: 0,
  loaded: false,

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) set({ ...JSON.parse(raw), loaded: true });
      else set({ loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  recordVisit: async () => {
    const { lastVisit, currentStreak, longestStreak, totalDarshans } = get();
    const today = localDay(new Date());

    if (lastVisit === today) return currentStreak; // already counted today

    let next = 1;
    if (lastVisit && daysBetween(lastVisit, today) === 1) next = currentStreak + 1;

    const longest = Math.max(longestStreak, next);
    const payload = {
      currentStreak: next,
      longestStreak: longest,
      lastVisit: today,
      totalDarshans: totalDarshans + 1,
    };
    set(payload);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* non-fatal */
    }
    return next;
  },
}));
