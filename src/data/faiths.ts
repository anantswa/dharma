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
 * DESIGN LAW (2026-07-28): darshan surfaces are single-tradition, always.
 * A devotee never meets another tradition's deities mid-darshan — cross-tradition
 * discovery is an explicit opt-in elsewhere, never interleaved here.
 * The temple carousel for a user = deitiesForFaith(primaryTradition).
 */
/** Index of the iṣṭa within the faith's darshan list, or the day's default. */
export function templeEntryIndex(faith?: string | null, istaId?: string): number {
  const list = darshanDeities(faith);
  if (istaId) {
    const i = list.findIndex((d) => d.id === istaId);
    if (i >= 0) return i;
  }
  return todaysDarshan(faith).index;
}

export function darshanDeities(faith?: string | null): Deity[] {
  return deitiesForFaith(faith ?? 'Hindu');
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

// Buddhist practice has no vāra deities — rotate the figures daily so each day
// still brings a distinct darshan, with a dhamma-flavored reason line.
const BUDDHIST_REASONS = ["Today's darshan", 'Sit with the Buddha', 'The path of stillness'];

/**
 * The vāra deity id for a given date — the same weekday table / daily rotation
 * `todaysDarshan()` uses, but pure (no wall clock), so Mantra of the Day can
 * ask about other weekdays without the two ever disagreeing.
 */
export function varaDeityId(faith: string | null | undefined, date: Date): string {
  const list = darshanDeities(faith);
  if (getFaithTheme(faith).key === 'Buddhist') {
    const day = Math.floor((date.getTime() - date.getTimezoneOffset() * 60000) / 86400000);
    return list[day % list.length].id;
  }
  const pick = WEEKDAY_HINDU[date.getDay()];
  return list.some((d) => d.id === pick.id) ? pick.id : list[0].id;
}

/** Today's darshan figure + why. Index is into darshanDeities(faith) (the temple's list). */
export function todaysDarshan(faith?: string | null): { deity: Deity; index: number; reason: string } {
  const list = darshanDeities(faith);
  const theme = getFaithTheme(faith);
  if (theme.key === 'Buddhist') {
    // local-midnight day boundary (matching the Hindu weekday behavior), not UTC
    const now = new Date();
    const day = Math.floor((now.getTime() - now.getTimezoneOffset() * 60000) / 86400000);
    const idx = day % list.length;
    return { deity: list[idx], index: idx, reason: BUDDHIST_REASONS[day % BUDDHIST_REASONS.length] };
  }
  const pick = WEEKDAY_HINDU[new Date().getDay()];
  const idx = list.findIndex((d) => d.id === pick.id);
  if (idx >= 0) return { deity: list[idx], index: idx, reason: pick.reason };
  return { deity: list[0], index: 0, reason: "Today's darshan" };
}
