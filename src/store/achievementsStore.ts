import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { COURSE_LIST, getCourse } from '../data/courses';
import { masteredCount, useMasteryStore } from './masteryStore';
import { useScoreStore } from './scoreStore';
import { useStreakStore } from './streakStore';

/**
 * AchievementsStore — "Siddhis": milestone honors, not a grind treadmill.
 *
 * Each Siddhi is a one-time recognition of a meaningful step on the path
 * (a verse learned by heart, a week of practice, a rank reached). Achievements
 * are derived purely from the other stores — we never double-count progress;
 * we just notice when a threshold is crossed and mark it, once.
 */

const KEY = '@dharma:achievements';

/** Snapshot of the devotee's progress, assembled fresh each evaluation. */
type Ctx = {
  versesStarted: number;
  totalByHeart: number;
  completedCourses: string[];
  jnana: number;
  diyas: number;
  correct: number;
  currentStreak: number;
  longestStreak: number;
  totalDarshans: number;
};

export type Achievement = {
  id: string;
  title: string;
  desc: string;
  icon: string; // emoji glyph
  check: (c: Ctx) => boolean;
};

/** The catalog. Ordered roughly by the journey: first steps → mastery → devotion → ranks. */
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_verse', title: 'First Step', desc: 'Begin learning your very first verse.', icon: '🌱',
    check: (c) => c.versesStarted >= 1 },
  { id: 'first_byheart', title: 'By Heart', desc: 'Learn your first verse by heart.', icon: '✨',
    check: (c) => c.totalByHeart >= 1 },
  { id: 'byheart_10', title: 'Ten by Heart', desc: 'Hold ten verses by heart.', icon: '📿',
    check: (c) => c.totalByHeart >= 10 },
  { id: 'byheart_25', title: 'Twenty-Five by Heart', desc: 'Hold twenty-five verses by heart.', icon: '🏵️',
    check: (c) => c.totalByHeart >= 25 },
  { id: 'byheart_50', title: 'Fifty by Heart', desc: 'Hold fifty verses by heart.', icon: '🌟',
    check: (c) => c.totalByHeart >= 50 },
  { id: 'chalisa_complete', title: 'Chalisa by Heart', desc: 'Learn the entire Hanuman Chalisa by heart.', icon: '🚩',
    check: (c) => c.completedCourses.includes('chalisa') },
  { id: 'course_complete', title: 'Path Completed', desc: 'Learn an entire course by heart.', icon: '🏆',
    check: (c) => c.completedCourses.length >= 1 },
  { id: 'streak_3', title: 'Three Days', desc: 'Practise three days in a row.', icon: '🔥',
    check: (c) => c.longestStreak >= 3 },
  { id: 'streak_7', title: 'One Week', desc: 'Keep the flame lit for a full week.', icon: '🔥',
    check: (c) => c.longestStreak >= 7 },
  { id: 'streak_30', title: 'One Month', desc: 'Thirty days of unbroken sādhana.', icon: '🔥',
    check: (c) => c.longestStreak >= 30 },
  { id: 'streak_108', title: 'Sacred 108', desc: 'A streak of one hundred and eight days.', icon: '🪔',
    check: (c) => c.longestStreak >= 108 },
  { id: 'darshan_30', title: 'Faithful', desc: 'Thirty days of darshan in all.', icon: '🛕',
    check: (c) => c.totalDarshans >= 30 },
  { id: 'recall_108', title: '108 Recollections', desc: 'Answer one hundred and eight reviews correctly.', icon: '📖',
    check: (c) => c.correct >= 108 },
  { id: 'rank_shishya', title: 'Shishya', desc: 'Reach the rank of Shishya (student).', icon: '🎓',
    check: (c) => c.jnana >= 150 },
  { id: 'rank_sadhaka', title: 'Sādhaka', desc: 'Reach the rank of Sādhaka (practitioner).', icon: '🎓',
    check: (c) => c.jnana >= 500 },
  { id: 'rank_upasaka', title: 'Upāsaka', desc: 'Reach the rank of Upāsaka (devotee).', icon: '🎓',
    check: (c) => c.jnana >= 1200 },
  { id: 'rank_jnani', title: 'Jñāni', desc: 'Reach the highest rank — the knower.', icon: '👑',
    check: (c) => c.jnana >= 3000 },
];

export const getAchievement = (id: string): Achievement | undefined =>
  ACHIEVEMENTS.find((a) => a.id === id);

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

type AchState = {
  /** id → ISO date unlocked */
  unlocked: Record<string, string>;
  loaded: boolean;
  load: () => Promise<void>;
  /** Re-derive context from the other stores; unlock & persist any newly-earned Siddhis. Returns the new ids. */
  evaluate: () => string[];
};

const buildContext = (): Ctx => {
  const records = useMasteryStore.getState().records as Record<string, { box: number }>;
  const { jnana, diyas, correct } = useScoreStore.getState();
  const { currentStreak, longestStreak, totalDarshans } = useStreakStore.getState();

  let totalByHeart = 0;
  const completedCourses: string[] = [];
  for (const c of COURSE_LIST) {
    const ids = getCourse(c.id).verses.map((v) => v.id);
    const m = masteredCount(ids, records);
    totalByHeart += m;
    if (ids.length > 0 && m === ids.length) completedCourses.push(c.id);
  }

  return {
    versesStarted: Object.keys(records).length,
    totalByHeart,
    completedCourses,
    jnana,
    diyas,
    correct,
    currentStreak,
    longestStreak,
    totalDarshans,
  };
};

export const useAchievementsStore = create<AchState>((set, get) => ({
  unlocked: {},
  loaded: false,

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      set({ unlocked: raw ? JSON.parse(raw) : {}, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  evaluate: () => {
    const ctx = buildContext();
    const cur = get().unlocked;
    const next = { ...cur };
    const newly: string[] = [];
    const date = todayStr();
    for (const a of ACHIEVEMENTS) {
      if (!cur[a.id] && a.check(ctx)) {
        next[a.id] = date;
        newly.push(a.id);
      }
    }
    if (newly.length) {
      set({ unlocked: next });
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
    }
    return newly;
  },
}));
