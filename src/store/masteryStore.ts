import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

/**
 * MasteryStore — the spaced-repetition engine. This is the differentiator: it turns
 * "I read a verse" into "I am learning this by heart."
 *
 * Each verse lives in a Leitner box (0–5). A self-graded recall moves it up/down and
 * schedules the next review along a widening interval. The daily "Sādhana" queue =
 * everything due today + a small number of new verses.
 */

export type Grade = 'forgot' | 'okay' | 'knew';
export type MasteryLevel = 'new' | 'shishya' | 'upasaka' | 'siddha';

type Record_ = { box: number; due: string; reps: number; lastGrade?: Grade };

type MasteryState = {
  records: Record<string, Record_>;
  loaded: boolean;
  newPerDay: number;
  load: () => Promise<void>;
  recordRecall: (verseId: string, grade: Grade) => Promise<void>;
  /** Set the daily intention (Sankalpa): how many new verses to take on per day. */
  setNewPerDay: (n: number) => Promise<void>;
  reset: () => Promise<void>;
};

const KEY = '@dharma:mastery';
const NEW_PER_DAY_KEY = '@dharma:newPerDay';
// Leitner intervals in days, indexed by box.
const INTERVALS = [0, 1, 2, 4, 9, 21];

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const addDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const useMasteryStore = create<MasteryState>((set, get) => ({
  records: {},
  loaded: false,
  newPerDay: 3,

  load: async () => {
    try {
      const [raw, np] = await Promise.all([
        AsyncStorage.getItem(KEY),
        AsyncStorage.getItem(NEW_PER_DAY_KEY),
      ]);
      const parsedNp = np ? Number(np) : 3;
      set({
        records: raw ? JSON.parse(raw) : {},
        newPerDay: Number.isFinite(parsedNp) && parsedNp > 0 ? parsedNp : 3,
        loaded: true,
      });
    } catch {
      set({ loaded: true });
    }
  },

  recordRecall: async (verseId, grade) => {
    const records = { ...get().records };
    const prev = records[verseId] ?? { box: 0, due: today(), reps: 0 };
    let box = prev.box;
    if (grade === 'forgot') box = 0;
    else if (grade === 'okay') box = Math.max(box - 1, 1); // a shaky recall steps DOWN a box
    else box = Math.min(box + 1, INTERVALS.length - 1); // 'knew'
    const interval = grade === 'forgot' ? 0 : INTERVALS[box];
    records[verseId] = { box, due: addDays(interval), reps: prev.reps + 1, lastGrade: grade };
    set({ records });
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(records));
    } catch {
      /* non-fatal */
    }
  },

  setNewPerDay: async (n) => {
    set({ newPerDay: n });
    try { await AsyncStorage.setItem(NEW_PER_DAY_KEY, String(n)); } catch { /* noop */ }
  },

  reset: async () => {
    set({ records: {} });
    try { await AsyncStorage.removeItem(KEY); } catch { /* noop */ }
  },
}));

// ---------- selectors / helpers (pure) ----------

export const levelForBox = (box: number | undefined): MasteryLevel => {
  if (box === undefined) return 'new';
  if (box >= 4) return 'siddha';
  if (box >= 2) return 'upasaka';
  return 'shishya';
};

export const LEVEL_LABEL: Record<MasteryLevel, string> = {
  new: 'New',
  shishya: 'Learning',     // Shishya
  upasaka: 'Familiar',     // Upāsaka
  siddha: 'By heart',      // Siddha
};

/** Build today's queue: due reviews first, then up to `newPerDay` unseen verses. */
export function buildTodayQueue<T extends { id: string }>(
  verses: T[],
  records: Record<string, { box: number; due: string }>,
  newPerDay: number,
): T[] {
  const t = today();
  const reviews = verses.filter((v) => records[v.id] && records[v.id].due <= t);
  const fresh = verses.filter((v) => !records[v.id]).slice(0, newPerDay);
  return [...reviews, ...fresh];
}

export function masteredCount(
  ids: string[],
  records: Record<string, { box: number }>,
): number {
  return ids.filter((id) => (records[id]?.box ?? 0) >= 4).length;
}
