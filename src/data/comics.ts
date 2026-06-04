/**
 * Mobile-native comics. A comic is a sequence of full-bleed pages (art + caption),
 * read vertically. v1 ships the illustrated Hanuman Chalisa (built from the same
 * premium paintings + verse text). `previewPages` is where a future paywall begins.
 */
import { CHALISA_VERSES } from './chalisaAudio';
import { CHALISA_ART } from './chalisaArt';

export type ComicPage = { image: string; heading?: string; verse?: string; caption?: string };
export type Comic = {
  id: string;
  title: string;
  subtitle: string;
  cover: string;
  pages: ComicPage[];
  previewPages: number;
};

const chalisaPages: ComicPage[] = CHALISA_VERSES
  .filter((v) => CHALISA_ART[v.id])
  .map((v) => ({
    image: CHALISA_ART[v.id],
    heading: v.titleHi,
    verse: v.sanskrit,
    caption: v.meaningEn,
  }));

export const COMICS: Comic[] = [
  {
    id: 'hanuman-chalisa-illustrated',
    title: 'Hanuman Chalisa',
    subtitle: 'The Illustrated Edition',
    cover: CHALISA_ART['chalisa_chaupai_12'] || CHALISA_ART['chalisa_doha_1'] || '',
    pages: chalisaPages,
    previewPages: 6,
  },
];

export const getComic = (id?: string): Comic | undefined =>
  COMICS.find((c) => c.id === id) ?? COMICS[0];
