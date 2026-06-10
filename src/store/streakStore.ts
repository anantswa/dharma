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

/** Max streak-freezes ("diya guards") a devotee can hold at once. */
export const FREEZE_CAP = 3;
/** Diyas it costs to light a guarding lamp (one streak-freeze). */
export const FREEZE_COST = 50;

type StreakState = {
  currentStreak: number;
  longestStreak: number;
  lastVisit: string | null; // YYYY-MM-DD (local)
  totalDarshans: number;
  /** Streak-freezes held — each one keeps the flame lit through one missed day. */
  freezes: number;
  /** True for one render after a freeze auto-saved the streak (so the UI can say so). */
  savedByFreeze: boolean;
  /** Distinct deity ids the devotee has received darshan of (the Breadth collection). */
  seenDeities: string[];
  loaded: boolean;
  load: () => Promise<void>;
  /** Call on Home mount / app foreground. Returns the (possibly updated) streak. */
  recordVisit: () => Promise<number>;
  /** Add streak-freezes (capped). Used after a Diya purchase. */
  addFreeze: (n?: number) => Promise<void>;
  /** Record a darshan of a deity (unique). Feeds the Breadth Siddhis. */
  recordDeity: (id: string) => Promise<void>;
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

/** Persist the durable fields (everything except transient UI flags). */
const persist = (s: {
  currentStreak: number; longestStreak: number; lastVisit: string | null;
  totalDarshans: number; freezes: number; seenDeities: string[];
}) => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s)).catch(() => {});

/** Read the current durable fields off state for a persist() call. */
const durable = (s: StreakState) => ({
  currentStreak: s.currentStreak,
  longestStreak: s.longestStreak,
  lastVisit: s.lastVisit,
  totalDarshans: s.totalDarshans,
  freezes: s.freezes,
  seenDeities: s.seenDeities,
});

export const useStreakStore = create<StreakState>((set, get) => ({
  currentStreak: 0,
  longestStreak: 0,
  lastVisit: null,
  totalDarshans: 0,
  freezes: 1, // a welcome guard, so the feature is discovered before the first miss
  savedByFreeze: false,
  seenDeities: [],
  loaded: false,

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) set({ ...JSON.parse(raw), savedByFreeze: false, loaded: true });
      else set({ loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  recordVisit: async () => {
    const { lastVisit, currentStreak, longestStreak, totalDarshans, freezes } = get();
    const today = localDay(new Date());

    if (lastVisit === today) return currentStreak; // already counted today

    let next = 1;
    let heldFreezes = freezes;
    let saved = false;

    if (lastVisit) {
      const gap = daysBetween(lastVisit, today); // ≥ 1
      if (gap === 1) {
        next = currentStreak + 1; // perfect continuation
      } else if (gap > 1) {
        const missed = gap - 1; // fully-skipped days between visits
        if (heldFreezes >= missed) {
          heldFreezes -= missed; // freezes bridge the gap — the lamp stayed lit
          next = currentStreak + 1;
          saved = true;
        } else {
          next = 1; // not enough guards → the streak resets
        }
      }
    }

    // Reward devotion: every 7 days of streak earns a guarding lamp (capped).
    if (next > currentStreak && next % 7 === 0 && heldFreezes < FREEZE_CAP) {
      heldFreezes += 1;
    }

    const longest = Math.max(longestStreak, next);
    const payload = {
      currentStreak: next,
      longestStreak: longest,
      lastVisit: today,
      totalDarshans: totalDarshans + 1,
      freezes: heldFreezes,
      seenDeities: get().seenDeities,
    };
    set({ ...payload, savedByFreeze: saved });
    await persist(payload);
    return next;
  },

  addFreeze: async (n = 1) => {
    const s = get();
    const freezes = Math.min(FREEZE_CAP, s.freezes + n);
    set({ freezes });
    await persist({ ...durable(get()), freezes });
  },

  recordDeity: async (id) => {
    if (!id) return;
    const s = get();
    if (s.seenDeities.includes(id)) return;
    const seenDeities = [...s.seenDeities, id];
    set({ seenDeities });
    await persist({ ...durable(get()), seenDeities });
  },
}));
