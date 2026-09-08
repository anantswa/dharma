/**
 * Mantra of the Day (§2.4) — hangs off the same `todaysDarshan()` /
 * `todaysFestival()` the darshan card and the bell use, so the three surfaces
 * never disagree. Deterministic per local day. No randomness.
 *
 * Precondition checked before EVERY step: the candidate lesson exists in the
 * loaded catalog (the card can never point at a lesson the user cannot open).
 *   festival override → iṣṭa's lesson on the iṣṭa's vāra → vāra deity's
 *   lesson → cycle the loaded Start Here set.
 */
import { varaDeityId } from '../data/faiths';
import { lessonsForDeity, startHereSet } from '../data/vidya/shelves';
import type { MantraLesson, MantraWord } from '../data/vidya/types';
import type { TraditionKey } from '../store/preferencesStore';
import { localDateKey, todaysFestival } from './dailyDarshan';

export type MantraOfDay = {
  lesson: MantraLesson;
  /** The one word taught today (a seed card teaches its one sound). */
  word: MantraWord | undefined;
  /** Why this card: 'festival' | 'ista' | 'vara' | 'start'. */
  reason: 'festival' | 'ista' | 'vara' | 'start';
};

/* Festival → lesson, matched on the card's own Devanagari rather than an id,
 * so the mapping survives whatever ids the content batch settles on. */
const FESTIVAL_LESSON: { festival: string; has: string; cls?: MantraLesson['class'] }[] = [
  { festival: 'Mahāśivarātri', has: 'त्र्यम्बकं' },                 // Mahāmṛtyuñjaya
  { festival: 'Navarātri', has: 'चामुण्डायै' },                     // Navārṇa
  { festival: 'Dīpāvalī', has: 'श्रीं', cls: 'bija' },              // Śrīṃ (Lakṣmī)
  { festival: 'Lakṣmī Pūjā', has: 'श्रीं', cls: 'bija' },
  { festival: 'Gītā Jayantī', has: 'तत्सत्' },                      // Oṃ tat sat
  { festival: 'Vesak', has: 'सरणं गच्छामि' },                       // Triple Refuge
];

/** Days since the epoch, local midnight — the cycle index. */
export function localDayOrdinal(d = new Date()): number {
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60_000) / 86_400_000);
}

const weekOrdinal = (d: Date) => Math.floor(localDayOrdinal(d) / 7);

/**
 * A deity owning two vāras shows a different card on each (occurrence index),
 * and the week number rotates a returning user through the rest of the list.
 */
function deityPick(list: MantraLesson[], d: Date, deityOccurrence: number): MantraLesson | undefined {
  if (!list.length) return undefined;
  return list[(deityOccurrence + weekOrdinal(d)) % list.length];
}

/** Which occurrence of today's deity this weekday is (Hanumān: Tue → 0, Sat → 1). */
function occurrenceOfVara(faith: TraditionKey | undefined, d: Date): number {
  const todayId = varaDeityId(faith, d);
  let n = 0;
  for (let i = 0; i < d.getDay(); i++) {
    const probe = new Date(d);
    probe.setDate(d.getDate() - (d.getDay() - i));
    if (varaDeityId(faith, probe) === todayId) n++;
  }
  return n;
}

export function mantraOfDay(
  lessons: MantraLesson[],
  faith: TraditionKey | undefined,
  istaId: string | undefined,
  d = new Date(),
): MantraOfDay | null {
  if (!lessons.length) return null;
  const pickWord = (l: MantraLesson): MantraWord | undefined =>
    l.words.length ? l.words[localDayOrdinal(d) % l.words.length] : undefined;
  const done = (lesson: MantraLesson, reason: MantraOfDay['reason']): MantraOfDay =>
    ({ lesson, word: pickWord(lesson), reason });

  // 1. festival override — only when the lesson is actually loaded
  const fest = todaysFestival(faith, d);
  if (fest) {
    const rule = FESTIVAL_LESSON.find((r) => r.festival === fest.name);
    const hit = rule && lessons.find((l) => l.sanskrit.includes(rule.has) && (!rule.cls || l.class === rule.cls));
    if (hit) return done(hit, 'festival');
  }

  // 2 + 3. the vāra deity (the iṣṭa's own vāra is the same list, labelled so)
  const vara = varaDeityId(faith, d);
  const occurrence = occurrenceOfVara(faith, d);
  const fromVara = deityPick(lessonsForDeity(lessons, vara), d, occurrence);
  if (fromVara) return done(fromVara, istaId === vara ? 'ista' : 'vara');

  // 4. cycle the loaded Start Here set
  const start = startHereSet(lessons, faith);
  if (start.length) return done(start[localDayOrdinal(d) % start.length], 'start');
  return done(lessons[localDayOrdinal(d) % lessons.length], 'start');
}

/** Stable key for "already seen today" style memo — same rule as darshan. */
export const mantraOfDayKey = (d = new Date()) => localDateKey(d);
