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
 *  - §3 says "CourseVerse.audio stays = spokenSlow (engine default)" while also
 *    making `audio` the object below — one field cannot be both. Simplest
 *    reading: the card carries the OBJECT; `toCourseVerse()` (index.ts) derives
 *    the engine-default `audio = spokenSlow` string whenever a lesson is handed
 *    to a CourseVerse consumer (VerseQuiz, ClozeRecall).
 */
import type { CourseVerse } from '../courses';

export type MantraWord = {
  deva: string; iast: string;
  glossEn: string; glossHi: string;
  root?: string;            // "√dhī / dhyai — to think, meditate"
  grammar?: string;         // plain words: "to Śiva (dative) — hence -āya"
  audioUrl?: string;        // streamed, word alone, spoken slow
  t0?: number; t1?: number; // ms offsets into audio.spokenSlow (forced-alignment)
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

/** Not defined in §3 (referenced only). Simplest reading: one 4-option question. */
export type QuizItem = {
  prompt: string;
  options: string[];
  /** Index into `options`. */
  correct: number;
};

export type MantraLesson = Omit<CourseVerse, 'audio'> & {
  class: MantraClass;
  tradition: MantraTradition;
  deityId?: string;                   // FINAL_DEITIES id → art + iṣṭa ordering
  importance: 1 | 2 | 3 | 4 | 5;
  gap: 1 | 2 | 3 | 4 | 5;             // understanding gap (founder's axis)
  shelf: MantraShelf;
  sayItLike: string;                  // beginner roman line, no diacritics
  words: MantraWord[];
  audio: {                            // CourseVerse.audio stays = spokenSlow (engine default)
    spokenSlow: string; spokenNatural: string;
    loopKey?: string;                 // key into mantras/catalog.json
    master?: string;                  // e.g. the Gāyatrī F2 master
    voice: 'kuber' | 'devi_female';
  };
  source: {
    text: string; ref: string;
    confidence: SourceConfidence;
    note?: string;
  };
  significance: { textSays: string; traditionSays: string; weDoNotClaim: string };
  practice: { count: number | 'once'; timeOfDay?: string; mode: PracticeMode[]; dikshaNote?: string };
  quiz?: QuizItem[];                  // optional hand-written overrides; else generated from words[]
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
