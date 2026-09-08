/**
 * Mantra Vidyā — the lesson-card schema, coded straight from
 * Agentic-dharmaweave/docs/MANTRA_VIDYA_SCOPE.md §3 ("Schema — extension over
 * CourseVerse"). The content agent writes Batch-1 cards as JSON against THIS
 * shape; keep the two in lock-step. Every CourseVerse field keeps its meaning.
 *
 * Reading notes where §3 is silent (simplest reading, no invented fields):
 *  - §8's "one-line connection" (the BANG that opens every card) has no field of
 *    its own in §3, so `titleEn` IS the bang line — the card's English title is
 *    the plain-words connection ("Śrīṃ is Lakṣmī"). `titleHi` stays the short
 *    Devanagari name used on shelf rows.
 *  - `QuizItem` is referenced by §3 but never defined; the minimal 4-option
 *    shape below is the simplest reading. Batch 1 does not require it (recall
 *    is generated from `words[]`), and the app tolerates its absence.
 *  - v2 (founder's TestFlight verdict, 2026-09-08): ONE audio track per card,
 *    the sung one (`audio.sung`); the spoken TTS tracks are gone. Word audio
 *    is a per-word clip (`words[i].audioUrl`), never an alignment slice. The
 *    `practice` block is REMOVED — no prescriptive who/when/how/count language
 *    anywhere in the app; the field stays optional in the type for old JSON
 *    and is never rendered. Quiz items may carry an image (`imageUrl`).
 *    `toCourseVerse()` (index.ts) hands `audio = sung` to CourseVerse consumers.
 */
import type { CourseVerse } from '../courses';

export type MantraWord = {
  deva: string; iast: string;
  glossEn: string; glossHi: string;
  root?: string;            // "√dhī / dhyai — to think, meditate"
  grammar?: string;         // plain words: "to Śiva (dative) — hence -āya"
  audioUrl?: string;        // streamed, this word alone — rendered individually (v2)
  /** @deprecated v1 forced-alignment offsets — tolerated on old JSON, never read. */
  t0?: number; t1?: number;
  alsoIn?: string[];        // other lesson ids carrying this word
};

export type MantraClass = 'bija' | 'mula' | 'vedic' | 'opener' | 'buddhist' | 'nama';
export type MantraTradition = 'Hindu' | 'Buddhist' | 'Sikh' | 'Jain';
export type MantraShelf = 'start' | 'bija' | 'deity' | 'vedic' | 'peace' | 'buddhist';
export type SourceConfidence =
  | 'located'
  | 'located (tantric text, dated)'
  | 'traditional'
  | 'traditional (modern commentary)'
  | 'contested';
export type PracticeMode = 'aloud' | 'whispered' | 'mental';

/** One 4-option question; v2 makes it visual — `imageUrl` sits above the prompt. */
export type QuizItem = {
  prompt: string;
  /** Streamed image shown above the prompt (image multiple-choice). */
  imageUrl?: string;
  options: string[];
  /** Index into `options` (as authored; the widget shuffles at render). */
  correct: number;
};

export type MantraLesson = Omit<CourseVerse, 'audio'> & {
  class: MantraClass;
  tradition: MantraTradition;
  deityId?: string;                   // FINAL_DEITIES id → art + iṣṭa ordering
  importance: 1 | 2 | 3 | 4 | 5;
  gap: 1 | 2 | 3 | 4 | 5;             // understanding gap (founder's axis)
  shelf: MantraShelf;
  /** Roman name shown beside titleHi on shelf rows and the lesson top bar — "ॐ (Oṃ)", "गायत्री मन्त्र (Gāyatrī Mantra)". */
  titleIast?: string;
  sayItLike: string;                  // beginner roman line, no diacritics
  words: MantraWord[];
  /** Card art (CDN, set by the pipeline); else deity art via deityId. */
  artUrl?: string;
  /** The prompt the art was generated from — content-side only, the app ignores it. */
  artPrompt?: string;
  audio: {
    /** THE one track — sung / chanted. null → the player is hidden on this card. */
    sung: string | null;
    voice?: string;
    loopKey?: string;                 // key into mantras/catalog.json (Japa hand-off)
    /** @deprecated v1 spoken TTS tracks — tolerated on old JSON, never played. */
    spokenSlow?: string; spokenNatural?: string;
    /** @deprecated v1 — `sung` is the master now. */
    master?: string;
  };
  source: {
    text: string; ref: string;
    confidence: SourceConfidence;
    note?: string;
  };
  significance: { textSays: string; traditionSays: string; weDoNotClaim: string };
  /** @deprecated REMOVED in v2 (hard stop: no prescriptive practice language). Never rendered. */
  practice?: { count: number | 'once'; timeOfDay?: string; mode: PracticeMode[]; dikshaNote?: string };
  /** Several visual questions per card; recall renders them first. */
  quiz?: QuizItem[];
};

/**
 * The CDN index (`vidya/catalog.json`). §3 does not specify its shape, so the
 * loader accepts the simplest one: an object with a `lessons` array whose
 * entries carry at least an `id` (the full card is always fetched from
 * `lessons/<id>.json`; nothing else on the index is load-bearing).
 * A bare array of entries is tolerated too.
 */
export type VidyaCatalogEntry = { id: string } & Partial<Pick<
  MantraLesson, 'titleHi' | 'titleEn' | 'class' | 'tradition' | 'shelf' | 'deityId' | 'importance' | 'gap'
>>;
export type VidyaCatalog = { lessons: VidyaCatalogEntry[] };

/** Course id under which lesson grades live in masteryStore (verse id = card id). */
export const VIDYA_COURSE_ID = 'vidya';
