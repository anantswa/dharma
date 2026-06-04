/**
 * Faith identity system.
 *
 * The product is focused on TWO faiths — Hindu and Buddhist — so we can get both
 * genuinely right. The structure stays data-driven, so adding a faith later is a
 * new entry here plus assets, not a rewrite. `primaryTradition` (preferencesStore)
 * drives the whole experience through `getFaithTheme()`.
 */
import type { Deity } from './deityImages';
import { FINAL_DEITIES } from './deityImages';

export type FaithKey = 'Hindu' | 'Buddhist';

/** Faiths the product is built around, in display order. */
export const PRIMARY_FAITHS: FaithKey[] = ['Hindu', 'Buddhist'];

/** Reserved for later expansion — currently none surfaced. */
export const SECONDARY_FAITHS: FaithKey[] = [];

export interface FaithTheme {
  key: FaithKey;
  label: string;
  /** Short sacred greeting shown on the temple / onboarding. */
  greeting: string;
  /** One-line invitation used on the faith-picker card. */
  blurb: string;
  /** Primary accent — replaces the hardcoded gold so each path feels distinct. */
  accent: string;
  /** Softer accent for fills / borders. */
  accentSoft: string;
  /** Deity / sacred-figure ids (from FINAL_DEITIES) shown in the darshan carousel. */
  deityIds: string[];
  /** Tradition strings (as stored on wisdom/festival rows) that belong to this faith. */
  traditions: string[];
}

const THEMES: Record<FaithKey, FaithTheme> = {
  Hindu: {
    key: 'Hindu',
    label: 'Hindu',
    greeting: 'ॐ शान्ति · Om Shanti',
    blurb: 'Darshan of the devas, the Gita, and the sacred Panchang.',
    accent: '#fbbf24',
    accentSoft: 'rgba(251, 191, 36, 0.14)',
    // 16 Hindu: original set (regen pending) + new calibrated-register set (20–28).
    deityIds: ['1', '2', '3', '5', '6', '7', '8', '20', '21', '22', '23', '24', '25', '26', '27', '28'],
    traditions: ['Hindu'],
  },
  Buddhist: {
    key: 'Buddhist',
    label: 'Buddhist',
    greeting: 'May all beings be happy',
    blurb: 'The Buddha, the Dhammapada, and the path of stillness.',
    accent: '#e0853d',
    accentSoft: 'rgba(224, 133, 61, 0.16)',
    // 8 Buddhist: Shakyamuni + Avalokiteśvara (regen pending) + new set (30–35).
    // (Dropped the 3 redundant old Buddha variants 9/11/14 — too weak beside the new art.)
    deityIds: ['12', '13', '30', '31', '32', '33', '34', '35'],
    traditions: ['Buddhist', 'Zen'],
  },
};

/** Brand default when no faith is chosen yet. */
export const DEFAULT_ACCENT = '#fbbf24';

export function getFaithTheme(faith?: string | null): FaithTheme {
  if (!faith) return THEMES.Hindu;
  const key = (Object.keys(THEMES) as FaithKey[]).find(
    (k) => k.toLowerCase() === faith.toLowerCase(),
  );
  return key ? THEMES[key] : THEMES.Hindu;
}

/**
 * The darshan figures to show for a faith. Falls back to the full set only if a
 * faith somehow has no bundled art (shouldn't happen for Hindu/Buddhist).
 */
export function deitiesForFaith(faith?: string | null): Deity[] {
  const theme = getFaithTheme(faith);
  const picked = FINAL_DEITIES.filter((d) => theme.deityIds.includes(d.id));
  return picked.length >= 1 ? picked : FINAL_DEITIES;
}

/**
 * The unified darshan carousel — Hindu figures first, Buddhist at the end.
 * The app assumes a Hindu-primary experience (no faith picker), but keeps the
 * Buddhist deities in, just not front-loaded.
 */
export function darshanDeities(): Deity[] {
  const hindu = deitiesForFaith('Hindu');
  const buddhist = deitiesForFaith('Buddhist');
  const seen = new Set(hindu.map((d) => d.id));
  return [...hindu, ...buddhist.filter((d) => !seen.has(d.id))];
}

// The traditional Hindu weekday (vāra) deity — so "today's darshan" is meaningful,
// not random. Maps weekday → a deity id present in FINAL_DEITIES.
const WEEKDAY_HINDU: { id: string; reason: string }[] = [
  { id: '8', reason: 'Sunday · Lord Rāma' },          // sriram
  { id: '7', reason: "Monday · Lord Shiva's day" },   // shiva
  { id: '3', reason: "Tuesday · Hanuman's day" },     // hanuman
  { id: '5', reason: 'Wednesday · Lord Krishna' },    // krishna
  { id: '2', reason: 'Thursday · Lord Ganesha' },     // ganesha
  { id: '6', reason: 'Friday · Goddess Lakshmi' },    // lakshmi
  { id: '3', reason: "Saturday · Hanuman's day" },    // hanuman
];

/** Today's darshan figure + why. Index is into darshanDeities() (the temple's list). */
export function todaysDarshan(_faith?: string | null): { deity: Deity; index: number; reason: string } {
  const list = darshanDeities();
  const pick = WEEKDAY_HINDU[new Date().getDay()];
  const idx = list.findIndex((d) => d.id === pick.id);
  if (idx >= 0) return { deity: list[idx], index: idx, reason: pick.reason };
  return { deity: list[0], index: 0, reason: "Today's darshan" };
}
