/**
 * Course layer — normalizes any text (Chalisa, Gita, …) into one shape so the
 * mastery engine, Sādhana loop, and path screen are course-agnostic. Adding a new
 * course later = one entry here, no new screens.
 */
import { CHALISA_VERSES } from './chalisaAudio';
import { CHALISA_ART } from './chalisaArt';
import { GITA_SHLOKAS } from './gitaShlokas';
import { DHAMMAPADA_VERSES } from './dhammapadaAudio';
import { GITA2_VERSES } from './gita2Audio';
import { GITACORE_VERSES } from './gitacoreAudio';
import { ZEN_VERSES } from './zenAudio';
import { UPANISHADS_VERSES } from './upanishadsAudio';
import { YOGASUTRAS_VERSES } from './yogasutrasAudio';
import { RAMAYANA_VERSES } from './ramayanaAudio';

export type CourseVerse = {
  id: string;
  titleHi: string;
  titleEn: string;
  sanskrit: string;
  transliteration: string;
  meaningHi: string;
  meaningEn: string;
  /** Streamed URL (string) or a bundled require() module id. */
  audio: string | number;
  /** Optional streamed illustration. */
  artUrl?: string;
};

export type Course = {
  id: string;
  title: string;
  subtitle: string;
  verses: CourseVerse[];
};

const CHALISA: Course = {
  id: 'chalisa',
  title: 'Hanuman Chalisa',
  subtitle: 'recited & explained',
  verses: CHALISA_VERSES.map((v) => ({
    id: v.id,
    titleHi: v.titleHi,
    titleEn: v.titleEn,
    sanskrit: v.sanskrit,
    transliteration: v.transliteration,
    meaningHi: v.meaningHi,
    meaningEn: v.meaningEn,
    audio: v.audioUrl,
    artUrl: CHALISA_ART[v.id],
  })),
};

const GITA: Course = {
  id: 'gita',
  title: 'Bhagavad Gita — Essentials',
  subtitle: 'narrated verse by verse',
  verses: GITA_SHLOKAS.map((s) => ({
    id: s.id,
    titleHi: s.titleHi,
    titleEn: s.titleEn,
    sanskrit: s.sanskrit,
    transliteration: s.transliteration,
    meaningHi: s.meaningHi,
    meaningEn: s.meaningEn,
    audio: s.audio, // bundled require()
  })),
};

// Streamed manifests (gen_course_audio.py) already match CourseVerse except `audio` key.
type Streamed = {
  id: string; titleHi: string; titleEn: string; sanskrit: string;
  transliteration: string; meaningHi: string; meaningEn: string; audioUrl: string;
};
const fromStreamed = (rows: Streamed[]): CourseVerse[] =>
  rows.map((v) => ({
    id: v.id, titleHi: v.titleHi, titleEn: v.titleEn, sanskrit: v.sanskrit,
    transliteration: v.transliteration, meaningHi: v.meaningHi, meaningEn: v.meaningEn,
    audio: v.audioUrl,
  }));

const DHAMMAPADA: Course = {
  id: 'dhammapada', title: 'Dhammapada', subtitle: "the Buddha's path of truth",
  verses: fromStreamed(DHAMMAPADA_VERSES as Streamed[]),
};
const GITA2: Course = {
  id: 'gita2', title: 'Bhagavad Gita — Chapter 2', subtitle: 'Sānkhya Yoga',
  verses: fromStreamed(GITA2_VERSES as Streamed[]),
};
const GITACORE: Course = {
  id: 'gitacore', title: 'Bhagavad Gita — Core', subtitle: 'the essential shlokas',
  verses: fromStreamed(GITACORE_VERSES as Streamed[]),
};
const ZEN: Course = {
  id: 'zen', title: 'Zen — Koans & Mind', subtitle: 'the gateless gate',
  verses: fromStreamed(ZEN_VERSES as Streamed[]),
};
const UPANISHADS: Course = {
  id: 'upanishads', title: 'Upanishads — Mahāvākyas', subtitle: 'the great sayings',
  verses: fromStreamed(UPANISHADS_VERSES as Streamed[]),
};
const YOGASUTRAS: Course = {
  id: 'yogasutras', title: 'Yoga Sutras of Patañjali', subtitle: 'the science of the mind',
  verses: fromStreamed(YOGASUTRAS_VERSES as Streamed[]),
};
const RAMAYANA: Course = {
  id: 'ramayana', title: 'Ramayana — Key Verses', subtitle: 'the epic of Rama',
  verses: fromStreamed(RAMAYANA_VERSES as Streamed[]),
};

const HINDU_IDS = new Set(['chalisa', 'gita', 'gita2', 'gitacore', 'upanishads', 'yogasutras', 'ramayana']);

const COURSES: Record<string, Course> = {
  chalisa: CHALISA, gita: GITA, dhammapada: DHAMMAPADA, gita2: GITA2, gitacore: GITACORE, zen: ZEN,
  upanishads: UPANISHADS, yogasutras: YOGASUTRAS, ramayana: RAMAYANA,
};

/** Courses to surface in the Learn catalog, in order. */
export const COURSE_LIST: { id: string; title: string; subtitle: string; faith: string; count: number }[] =
  [CHALISA, GITACORE, GITA2, GITA, UPANISHADS, YOGASUTRAS, RAMAYANA, DHAMMAPADA, ZEN].map((c) => ({
    id: c.id, title: c.title, subtitle: c.subtitle,
    faith: HINDU_IDS.has(c.id) ? 'Hindu' : 'Buddhist',
    count: c.verses.length,
  }));

export function getCourse(id?: string): Course {
  return COURSES[id ?? 'chalisa'] ?? CHALISA;
}
