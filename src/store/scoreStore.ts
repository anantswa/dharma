import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

/**
 * ScoreStore — the game layer, in a sacred register:
 *  - jnana: knowledge points (XP) earned by answering correctly
 *  - diyas: lamps (coins) earned for sessions/streaks; light up the temple later
 * Persisted. Ranks are derived from jnana.
 */
const KEY = '@dharma:score';

type ScoreState = {
  jnana: number;
  diyas: number;
  correct: number;
  attempts: number;
  loaded: boolean;
  load: () => Promise<void>;
  award: (jnana: number, diyas: number, gotCorrect?: boolean) => Promise<void>;
  /** Spend diyas (e.g. to light a lamp / protect a streak). Returns false if not enough. */
  spend: (diyas: number) => Promise<boolean>;
};

const persist = (s: { jnana: number; diyas: number; correct: number; attempts: number }) =>
  AsyncStorage.setItem(KEY, JSON.stringify(s)).catch(() => {});

export const useScoreStore = create<ScoreState>((set, get) => ({
  jnana: 0,
  diyas: 0,
  correct: 0,
  attempts: 0,
  loaded: false,
  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) set({ ...JSON.parse(raw), loaded: true });
      else set({ loaded: true });
    } catch { set({ loaded: true }); }
  },
  award: async (jnana, diyas, gotCorrect) => {
    const s = get();
    const next = {
      jnana: s.jnana + jnana,
      diyas: s.diyas + diyas,
      correct: s.correct + (gotCorrect ? 1 : 0),
      attempts: s.attempts + (gotCorrect === undefined ? 0 : 1),
    };
    set(next);
    await persist(next);
  },
  spend: async (diyas) => {
    const s = get();
    if (s.diyas < diyas) return false;
    const next = { jnana: s.jnana, diyas: s.diyas - diyas, correct: s.correct, attempts: s.attempts };
    set(next);
    await persist(next);
    return true;
  },
}));

export type Rank = { name: string; min: number };
export const RANKS: Rank[] = [
  { name: 'Jijñāsu', min: 0 },      // seeker
  { name: 'Shishya', min: 150 },    // student
  { name: 'Sādhaka', min: 500 },    // practitioner
  { name: 'Upāsaka', min: 1200 },   // devotee
  { name: 'Jñāni', min: 3000 },     // knower
];

export function rankFor(jnana: number): { current: Rank; next?: Rank; pct: number } {
  let current = RANKS[0];
  for (const r of RANKS) if (jnana >= r.min) current = r;
  const next = RANKS[RANKS.indexOf(current) + 1];
  const pct = next ? (jnana - current.min) / (next.min - current.min) : 1;
  return { current, next, pct: Math.max(0, Math.min(1, pct)) };
}
