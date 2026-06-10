import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { COURSE_LIST, getCourse } from '../data/courses';
import { darshanDeities } from '../data/faiths';
import { masteredCount, useMasteryStore } from './masteryStore';
import { useScoreStore } from './scoreStore';
import { useStreakStore } from './streakStore';
import { useDedicationStore } from './dedicationStore';

/**
 * AchievementsStore — "Siddhis": milestone honors, not a grind treadmill.
 *
 * Siddhis are grouped into the FAMILIES — the dimensions a devotee grows in, drawn
 * from the paths the tradition itself names (Jñāna / Bhakti / Tapas / Vistāra / Sevā).
 * A whole practice has a *shape* across these; the goal is balance, not a single number.
 *
 * Achievements are derived purely from the other stores — we never double-count; we just
 * notice when a meaningful threshold is crossed and mark it, once.
 */

const KEY = '@dharma:achievements';

export type Family = 'study' | 'devotion' | 'discipline' | 'breadth' | 'living';

/** The growth dimensions, in display order. */
export const FAMILIES: { key: Family; label: string; sanskrit: string; icon: string; blurb: string }[] = [
  { key: 'study',      label: 'Study',     sanskrit: 'Jñāna',   icon: '📖', blurb: 'Scripture known and held' },
  { key: 'devotion',   label: 'Devotion',  sanskrit: 'Bhakti',  icon: '🪔', blurb: 'Time given before the divine' },
  { key: 'discipline', label: 'Discipline', sanskrit: 'Tapas',  icon: '🔥', blurb: 'Showing up, day after day' },
  { key: 'breadth',    label: 'Breadth',   sanskrit: 'Vistāra', icon: '🧭', blurb: 'The reach of your journey' },
  { key: 'living',     label: 'Living it', sanskrit: 'Sevā',    icon: '🤲', blurb: 'Carrying it into the world' },
];

/** Snapshot of the devotee's progress, assembled fresh each evaluation. */
type Ctx = {
  versesStarted: number;
  totalByHeart: number;
  completedCourses: string[];
  coursesStarted: number;
  hinduStarted: boolean;
  buddhistStarted: boolean;
  jnana: number;
  correct: number;
  totalDarshans: number;
  longestStreak: number;
  deitiesSeen: number;
  totalDeities: number;
  shares: number;
  dedications: number;
};

export type Achievement = {
  id: string;
  family: Family;
  title: string;
  desc: string;
  icon: string; // emoji glyph
  check: (c: Ctx) => boolean;
};

/** The catalog — grouped by family. Names span the dimensions, not just "by heart". */
export const ACHIEVEMENTS: Achievement[] = [
  // ── Jñāna · Study ───────────────────────────────────────────────
  { id: 'first_verse', family: 'study', title: 'First Step', desc: 'Begin learning your very first verse.', icon: '🌱',
    check: (c) => c.versesStarted >= 1 },
  { id: 'first_byheart', family: 'study', title: 'Held by Heart', desc: 'Learn your first verse by heart.', icon: '✨',
    check: (c) => c.totalByHeart >= 1 },
  { id: 'byheart_10', family: 'study', title: 'Ten Verses Deep', desc: 'Hold ten verses by heart.', icon: '📿',
    check: (c) => c.totalByHeart >= 10 },
  { id: 'byheart_25', family: 'study', title: 'A Garland of Knowing', desc: 'Hold twenty-five verses by heart.', icon: '🏵️',
    check: (c) => c.totalByHeart >= 25 },
  { id: 'byheart_50', family: 'study', title: 'Fifty by Heart', desc: 'Hold fifty verses by heart.', icon: '🌟',
    check: (c) => c.totalByHeart >= 50 },
  { id: 'recall_108', family: 'study', title: '108 Recollections', desc: 'Answer one hundred and eight reviews correctly.', icon: '📖',
    check: (c) => c.correct >= 108 },
  { id: 'course_complete', family: 'study', title: 'A Path Completed', desc: 'Learn an entire text by heart.', icon: '🏆',
    check: (c) => c.completedCourses.length >= 1 },
  { id: 'chalisa_complete', family: 'study', title: 'The Whole Chalisa', desc: 'Hold the entire Hanuman Chalisa by heart.', icon: '🚩',
    check: (c) => c.completedCourses.includes('chalisa') },

  // ── Bhakti · Devotion ───────────────────────────────────────────
  { id: 'darshan_first', family: 'devotion', title: 'First Darshan', desc: 'Stand before the divine for the first time.', icon: '🙏',
    check: (c) => c.totalDarshans >= 1 },
  { id: 'darshan_30', family: 'devotion', title: 'Faithful Return', desc: 'Thirty days of darshan in all.', icon: '🛕',
    check: (c) => c.totalDarshans >= 30 },
  { id: 'darshan_108', family: 'devotion', title: 'A Hundred and Eight', desc: 'One hundred and eight darshans.', icon: '🕉️',
    check: (c) => c.totalDarshans >= 108 },

  // ── Tapas · Discipline ──────────────────────────────────────────
  { id: 'streak_3', family: 'discipline', title: 'Three Days', desc: 'Practise three days in a row.', icon: '🔥',
    check: (c) => c.longestStreak >= 3 },
  { id: 'streak_7', family: 'discipline', title: 'A Week of Fire', desc: 'Keep the flame lit a full week.', icon: '🔥',
    check: (c) => c.longestStreak >= 7 },
  { id: 'streak_30', family: 'discipline', title: 'A Month Unbroken', desc: 'Thirty days of unbroken sādhana.', icon: '🔥',
    check: (c) => c.longestStreak >= 30 },
  { id: 'streak_108', family: 'discipline', title: 'Sacred 108', desc: 'A streak of one hundred and eight days.', icon: '🪔',
    check: (c) => c.longestStreak >= 108 },

  // ── Vistāra · Breadth ───────────────────────────────────────────
  { id: 'deity_5', family: 'breadth', title: 'Five Faces of the Divine', desc: 'Receive the darshan of five deities.', icon: '🧭',
    check: (c) => c.deitiesSeen >= 5 },
  { id: 'deity_all', family: 'breadth', title: 'The Whole Pantheon', desc: 'Receive the darshan of every deity.', icon: '🌌',
    check: (c) => c.totalDeities > 0 && c.deitiesSeen >= c.totalDeities },
  { id: 'courses_3', family: 'breadth', title: 'Three Texts Opened', desc: 'Begin three different scriptures.', icon: '📚',
    check: (c) => c.coursesStarted >= 3 },
  { id: 'both_traditions', family: 'breadth', title: 'Two Rivers', desc: 'Taste both Hindu and Buddhist teaching.', icon: '☸️',
    check: (c) => c.hinduStarted && c.buddhistStarted },

  // ── Sevā · Living it ────────────────────────────────────────────
  { id: 'first_share', family: 'living', title: 'First Offering Shared', desc: 'Share a verse or milestone with someone.', icon: '🤲',
    check: (c) => c.shares >= 1 },
  { id: 'share_5', family: 'living', title: 'A Messenger', desc: 'Share the teaching five times.', icon: '💌',
    check: (c) => c.shares >= 5 },
  { id: 'first_dedication', family: 'living', title: 'Merit Offered', desc: 'Dedicate the merit of a practice to another.', icon: '🪷',
    check: (c) => c.dedications >= 1 },
  { id: 'dedication_21', family: 'living', title: 'A River of Merit', desc: 'Dedicate twenty-one practices.', icon: '🌸',
    check: (c) => c.dedications >= 21 },
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
  const { jnana, correct, shares } = useScoreStore.getState();
  const { totalDarshans, longestStreak, seenDeities } = useStreakStore.getState();
  const dedications = useDedicationStore.getState().count;

  let totalByHeart = 0;
  let coursesStarted = 0;
  let hinduStarted = false;
  let buddhistStarted = false;
  const completedCourses: string[] = [];
  for (const c of COURSE_LIST) {
    const ids = getCourse(c.id).verses.map((v) => v.id);
    const m = masteredCount(ids, records);
    totalByHeart += m;
    const started = ids.some((id) => records[id]);
    if (started) {
      coursesStarted += 1;
      if (c.faith === 'Hindu') hinduStarted = true;
      else buddhistStarted = true;
    }
    if (ids.length > 0 && m === ids.length) completedCourses.push(c.id);
  }

  let totalDeities = 0;
  try { totalDeities = darshanDeities().length; } catch { totalDeities = 0; }

  return {
    versesStarted: Object.keys(records).length,
    totalByHeart,
    completedCourses,
    coursesStarted,
    hinduStarted,
    buddhistStarted,
    jnana,
    correct,
    totalDarshans,
    longestStreak,
    deitiesSeen: seenDeities?.length ?? 0,
    totalDeities,
    shares: shares ?? 0,
    dedications: dedications ?? 0,
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
