/**
 * Faith-gated content merchandising — what the temple front door offers each
 * tradition. DESIGN LAW: never show one tradition's deity content as a hero to
 * the other. New drops = edit here (or later, a Supabase catalog), no layout work.
 */
import type { FaithKey } from './faiths';

const ART = 'https://dharmaweave.com/cdn/dharma-art';

export type FeaturedHero = {
  title: string;
  sub: string;
  badge: string;
  image: string;
  route: string;
  params?: Record<string, unknown>;
};

/** The big free-offer card (Today + Mandir hero). */
export const FEATURED_HERO: Record<FaithKey, FeaturedHero> = {
  Hindu: {
    title: 'Varaha Avatar',
    sub: 'A cinematic katha in 52 painted scenes — read it free',
    badge: 'FREE BOOK',
    image: `${ART}/kathas/varaha/p01.jpg`,
    route: 'KathaScroll',
    params: { kathaId: 'varaha' },
  },
  Buddhist: {
    title: 'The Dhammapada',
    sub: "The Buddha's path of truth — learn it verse by verse, free",
    badge: 'FREE TEACHING',
    image: `${ART}/featured/bodhi_hero.jpg`,
    route: 'ChalisaPath',
    params: { courseId: 'dhammapada' },
  },
};

/** Whether the illustrated Hanuman Chalisa comic row shows (Hindu content). */
export function showChalisaComic(faith: FaithKey): boolean {
  return faith === 'Hindu';
}

/** Whether the (currently all-Hindu-deity) iṣṭa paid line shows. */
export function showIstaLine(faith: FaithKey): boolean {
  return faith === 'Hindu';
}
