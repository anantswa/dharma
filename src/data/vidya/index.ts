/**
 * Mantra Vidyā — lesson loading. Same posture as Dhyāna: the CDN JSON is the
 * mutable pointer, the copy shipped with the binary is the offline/failure
 * fallback, so the shelf always opens.
 *
 *   index   https://dharmaweave.com/cdn/dharma-audio/vidya/catalog.json
 *   card    https://dharmaweave.com/cdn/dharma-audio/vidya/lessons/<id>.json
 *
 * Swapping the fixture for streamed content: nothing to do at runtime — the
 * loader already prefers the CDN. For the BUNDLED fallback, drop the graded
 * cards into src/data/vidya/lessons/ and list them in BUNDLED_LESSONS below in
 * place of the two fixture requires (fixtures/ is then deleted).
 */
import type { CourseVerse } from '../courses';
import type { MantraLesson, VidyaCatalogEntry } from './types';

export const VIDYA_BASE = 'https://dharmaweave.com/cdn/dharma-audio/vidya';
export const VIDYA_CATALOG_URL = `${VIDYA_BASE}/catalog.json`;
export const vidyaLessonUrl = (id: string) => `${VIDYA_BASE}/lessons/${encodeURIComponent(id)}.json`;

/** Sung loops — the japa layer's live manifest (key → mp3), unchanged by this module. */
export const MANTRA_LOOPS_URL = 'https://dharmaweave.com/cdn/dharma-audio/mantras/catalog.json';

// ── FIXTURE ─────────────────────────────────────────────────────────────────
// Two hand-made development cards (one verse, one seed). NOT graded content.
// Replace with the content agent's lessons/*.json when Batch 1 lands.
const FIXTURE_LESSONS: unknown[] = [
  require('./fixtures/mv_gayatri.json'),
  require('./fixtures/mv_hrim.json'),
];
// ────────────────────────────────────────────────────────────────────────────

const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0;

/**
 * Minimal shape check — the fields every screen dereferences. Optional fields
 * are tolerated when missing; anything else fails the card (never the shelf).
 */
export function isMantraLesson(v: unknown): v is MantraLesson {
  if (!v || typeof v !== 'object') return false;
  const l = v as Record<string, unknown>;
  const audio = l.audio as Record<string, unknown> | undefined;
  return (
    isStr(l.id) && isStr(l.titleHi) && isStr(l.titleEn) && isStr(l.sanskrit) &&
    isStr(l.transliteration) && typeof l.meaningHi === 'string' && typeof l.meaningEn === 'string' &&
    isStr(l.class) && isStr(l.tradition) && isStr(l.shelf) && typeof l.sayItLike === 'string' &&
    Array.isArray(l.words) &&
    !!audio && typeof audio === 'object' && isStr(audio.spokenSlow) && isStr(audio.spokenNatural) &&
    !!l.source && typeof l.source === 'object' &&
    !!l.significance && typeof l.significance === 'object' &&
    !!l.practice && typeof l.practice === 'object'
  );
}

export const BUNDLED_LESSONS: MantraLesson[] = FIXTURE_LESSONS.filter(isMantraLesson);

/** Engine default (§3): a lesson seen as a CourseVerse carries `audio = spokenSlow`. */
export function toCourseVerse(l: MantraLesson): CourseVerse {
  return {
    id: l.id, titleHi: l.titleHi, titleEn: l.titleEn, sanskrit: l.sanskrit,
    transliteration: l.transliteration, meaningHi: l.meaningHi, meaningEn: l.meaningEn,
    audio: l.audio.spokenSlow, ...(l.artUrl ? { artUrl: l.artUrl } : {}),
  };
}

function catalogEntries(data: unknown): VidyaCatalogEntry[] {
  const rows = Array.isArray(data) ? data : (data as { lessons?: unknown })?.lessons;
  if (!Array.isArray(rows)) return [];
  return rows.filter((r) => r && typeof r === 'object' && isStr((r as { id?: unknown }).id)) as VidyaCatalogEntry[];
}

async function fetchJson(url: string, timeoutMs = 8000): Promise<unknown> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

/**
 * Live catalog → every listed card, in catalog order. Cards that fail to load
 * or fail the shape check are dropped (the index can never point at a lesson
 * the user cannot open — §2.4). Returns null when the CDN gives nothing usable
 * so the caller keeps the bundled copy.
 */
export async function fetchVidyaLessons(): Promise<MantraLesson[] | null> {
  try {
    const entries = catalogEntries(await fetchJson(VIDYA_CATALOG_URL));
    if (!entries.length) return null;
    const cards = await Promise.all(
      entries.map((e) => fetchJson(vidyaLessonUrl(e.id)).catch(() => null)),
    );
    const lessons = cards.filter(isMantraLesson);
    return lessons.length ? lessons : null;
  } catch {
    return null; // offline or CDN hiccup — the bundled shelf
  }
}

export async function fetchMantraLoops(): Promise<Record<string, string>> {
  try {
    const d = await fetchJson(MANTRA_LOOPS_URL);
    if (d && typeof d === 'object' && !Array.isArray(d)) {
      return Object.fromEntries(Object.entries(d as Record<string, unknown>).filter(([, v]) => isStr(v))) as Record<string, string>;
    }
  } catch { /* japa layer stays silent */ }
  return {};
}
