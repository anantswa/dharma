/**
 * Mantra Vidyā — the shelves (§2.1 Hindu primary, §2.2 Buddhist primary).
 * Pure functions over the loaded catalog: every shelf is derived, empty shelves
 * are simply not returned (Batch 1 ships no Buddhist card — the wing hides).
 */
import { FINAL_DEITIES } from '../deityImages';
import type { TraditionKey } from '../../store/preferencesStore';
import type { MantraLesson, MantraShelf } from './types';

export type VidyaShelfRow = {
  key: MantraShelf | 'buddhist_practice';
  title: string;
  subtitle: string;
  /** The bīja shelf is the marquee — rendered larger. */
  marquee?: boolean;
  lessons: MantraLesson[];
};

const SHELF_COPY: Record<MantraShelf, { title: string; subtitle: string }> = {
  start: { title: 'Start Here', subtitle: 'said by millions, understood by few' },
  bija: { title: 'Bīja — the seed syllables', subtitle: 'a map of connections: seed → who it calls' },
  deity: { title: 'Your Deity', subtitle: 'the root mantra and the verse said before it' },
  vedic: { title: 'The Vedic Pillars', subtitle: 'a Ṛgvedic verse is not a tantric seed — here is the difference' },
  peace: { title: 'Peace & Closing', subtitle: 'short, gentle, honest about where each one comes from' },
  buddhist: { title: 'The Buddhist wing', subtitle: 'the six syllables, the refuge, the far shore' },
};

const byImportance = (a: MantraLesson, b: MantraLesson) =>
  b.importance - a.importance || b.gap - a.gap || a.id.localeCompare(b.id);

/**
 * Per-deity ordered lesson list (§2.4's general mechanism): the mūla mantra
 * first, then the rest by importance. Deterministic, id-agnostic — a deity
 * that owns two vāras (Hanumān) rotates through this list, no special case.
 */
export function lessonsForDeity(lessons: MantraLesson[], deityId: string | undefined): MantraLesson[] {
  if (!deityId) return [];
  return lessons
    .filter((l) => l.deityId === deityId && l.class !== 'bija')
    .sort((a, b) => (a.class === 'mula' ? 0 : 1) - (b.class === 'mula' ? 0 : 1) || byImportance(a, b));
}

/** "Your Deity": the iṣṭa's pair rises to the top; the rest keep catalog order. */
function istaOrdered(rows: MantraLesson[], istaId: string | undefined): MantraLesson[] {
  if (!istaId) return rows;
  const mine = rows.filter((l) => l.deityId === istaId);
  const rest = rows.filter((l) => l.deityId !== istaId);
  return [...mine, ...rest];
}

export function buildShelves(
  lessons: MantraLesson[],
  primary: TraditionKey | undefined,
  istaId: string | undefined,
  enabled: Record<TraditionKey, boolean>,
): VidyaShelfRow[] {
  const visible = lessons.filter((l) =>
    l.tradition === 'Hindu' ? enabled.Hindu !== false
      : l.tradition === 'Buddhist' ? enabled.Buddhist !== false
        : false, // Sikh / Jain lanes are parked (§1)
  );
  const of = (shelf: MantraShelf) => visible.filter((l) => l.shelf === shelf);
  const row = (key: MantraShelf, rows: MantraLesson[], extra?: Partial<VidyaShelfRow>): VidyaShelfRow => ({
    key, ...SHELF_COPY[key], lessons: rows, ...extra,
  });

  const buddhist = of('buddhist');
  const istaIsBuddhist = !!istaId && FINAL_DEITIES.find((d) => d.id === istaId)?.tradition === 'Buddhist';

  const hindu: VidyaShelfRow[] = [
    row('start', of('start')),
    row('bija', of('bija'), { marquee: true }),
    row('deity', istaOrdered(of('deity'), istaId)),
    row('vedic', of('vedic')),
    row('peace', of('peace')),
  ];

  let ordered: VidyaShelfRow[];
  if (primary === 'Buddhist') {
    // The same data, a different door (§2.2): the wing leads, the shared bīja
    // shelf follows, "Your Practice" is the wing ordered by iṣṭa, then the
    // Hindu shelves below the fold.
    const practice = istaIsBuddhist ? istaOrdered(buddhist, istaId) : buddhist;
    ordered = [
      { ...row('buddhist', buddhist), title: 'Start Here', subtitle: 'the six syllables, the refuge, the far shore' },
      hindu[1],
      { key: 'buddhist_practice', title: 'Your Practice', subtitle: 'by your chosen figure', lessons: practice },
      hindu[4],
      hindu[0], hindu[2], hindu[3],
    ];
  } else {
    ordered = [...hindu, row('buddhist', buddhist)];
  }
  return ordered.filter((s) => s.lessons.length > 0);
}

/** Start Here set for the fallthrough cycle (§2.4), in the user's own wing. */
export function startHereSet(lessons: MantraLesson[], primary: TraditionKey | undefined): MantraLesson[] {
  const wing = primary === 'Buddhist' ? 'buddhist' : 'start';
  const own = lessons.filter((l) => l.shelf === wing);
  return own.length ? own : lessons.filter((l) => l.shelf === 'start' || l.shelf === 'buddhist');
}

/** Card art (v2 rule 3 — an image for everything): the card's own artUrl first, else deity art. */
export function lessonArt(l: MantraLesson): { uri: string } | number | undefined {
  if (l.artUrl) return { uri: l.artUrl };
  const deity = l.deityId ? FINAL_DEITIES.find((d) => d.id === l.deityId) : undefined;
  return deity?.image;
}

export const deityName = (deityId: string | undefined): string | undefined =>
  deityId ? FINAL_DEITIES.find((d) => d.id === deityId)?.name : undefined;

/** "ॐ (Oṃ)" — the Devanagari name with its roman form beside it, so a row reads bilingual at a glance. */
export const bilingualName = (l: MantraLesson) => {
  const roman = l.titleIast ?? (l.class === 'bija' ? l.transliteration : undefined);
  return roman && roman !== l.titleHi ? `${l.titleHi} (${roman})` : l.titleHi;
};
/** Learned = the last "Test yourself" on this card was passed (box ≥ 1 and graded 'knew'). */
export const isLearned = (r: { box: number; lastGrade?: string } | undefined) => !!r && r.box >= 1 && r.lastGrade === 'knew';
