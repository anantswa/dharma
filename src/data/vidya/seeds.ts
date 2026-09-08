/**
 * The seed registry the three bīja widgets read from (§3): every seed the
 * loaded catalog knows about, with the deity it calls. Derived, never
 * hand-authored — bīja cards contribute their own syllable, mūla cards
 * contribute their second word (Oṃ + SEED + name + namaḥ), and the app's
 * deity→mantra registry fills any gap so a widget always has four options.
 */
import { FINAL_DEITIES } from '../deityImages';
import { MANTRA_BY_KEY, mantraForDeity } from '../deityMantras';
import type { MantraLesson } from './types';

export type SeedPair = {
  /** Devanagari seed, e.g. ह्रीं */
  seed: string;
  /** IAST for the read-out */
  iast: string;
  deityId: string;
  deityName: string;
  image?: { uri: string } | number;
};

const strip = (s: string) => s.replace(/[।॥,.!?]+$/g, '').trim();

/** Unbiased Fisher–Yates (same as VerseQuiz / JyotishLesson). */
export function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}
const KNOWN_SEEDS = ['ॐ', 'गं', 'ह्रीं', 'श्रीं', 'क्लीं', 'ऐं', 'क्रीं', 'दुं', 'हं', 'सौः', 'हूं', 'हूँ'];
const isSeedToken = (t: string) => /ं$|ँ$|ः$/.test(t) && t.length <= 4 && t !== 'ॐ';

const deityOf = (id: string | undefined) => (id ? FINAL_DEITIES.find((d) => d.id === id) : undefined);

/** Every (seed, deity) pair the catalog can vouch for, this lesson's first. */
export function buildSeedPairs(lesson: MantraLesson, pool: MantraLesson[]): SeedPair[] {
  const out: SeedPair[] = [];
  const seen = new Set<string>();
  const push = (seed: string, iast: string, deityId: string | undefined) => {
    const d = deityOf(deityId);
    if (!d || seen.has(d.id) || seen.has(seed)) return;
    seen.add(d.id); seen.add(seed);
    out.push({ seed, iast, deityId: d.id, deityName: d.name, image: d.image });
  };
  const contribute = (l: MantraLesson) => {
    if (l.class === 'bija' && l.deityId) push(strip(l.sanskrit), l.transliteration, l.deityId);
    else if (l.class === 'mula' && l.deityId && l.words.length >= 3) {
      const w = l.words[1];
      if (w && isSeedToken(strip(w.deva))) push(strip(w.deva), w.iast, l.deityId);
    }
  };
  contribute(lesson);
  pool.filter((l) => l.id !== lesson.id && l.shelf === 'bija').forEach(contribute);
  pool.filter((l) => l.id !== lesson.id && l.shelf !== 'bija').forEach(contribute);
  // registry fill: deities whose mūla mantra carries a seed as its second word
  for (const d of FINAL_DEITIES) {
    if (out.length >= 8) break;
    const m = mantraForDeity(d.name);
    const toks = m.deva.split(/\s+/);
    if (toks.length >= 3 && isSeedToken(toks[1])) push(toks[1], m.trans.split(/\s+/)[1] ?? toks[1], d.id);
  }
  return out;
}

/** The mūla mantra to build for a seed card: Oṃ + seed + name (dative) + namaḥ. */
export function buildMulaTarget(lesson: MantraLesson, pool: MantraLesson[]): { target: string[]; distractors: string[]; deityName: string } | null {
  const deity = deityOf(lesson.deityId);
  if (!deity) return null;
  let target: string[] | null = null;
  const mula = pool.find((l) => l.class === 'mula' && l.deityId === lesson.deityId && l.words.length >= 4);
  if (mula) target = mula.words.map((w) => strip(w.deva)).filter(Boolean);
  if (!target) {
    const m = mantraForDeity(deity.name);
    const toks = m.deva.split(/\s+/).map(strip).filter(Boolean);
    if (toks.length >= 3 && toks.length <= 6 && MANTRA_BY_KEY[m.key]) target = toks;
  }
  if (!target || target.length < 3) return null;

  const seedInTarget = target.find(isSeedToken);
  const wrongSeed = KNOWN_SEEDS.find((s) => s !== 'ॐ' && !target!.includes(s) && s !== seedInTarget) ?? 'क्लीं';
  // the name is the longest chip that is neither oṃ, a seed, nor the closer
  const name = [...target]
    .filter((t) => t !== 'ॐ' && !isSeedToken(t) && !/^नमः$|^स्वाहा$|^फट्$/.test(t))
    .sort((a, b) => b.length - a.length)[0];
  const wrongEnding = name ? wrongCase(name) : undefined;
  const distractors = [wrongSeed, ...(wrongEnding && !target.includes(wrongEnding) ? [wrongEnding] : [])];
  return { target, distractors, deityName: deity.name };
}

/** A wrong case-ending for the name chip — the dative swapped for something else. */
function wrongCase(name: string): string {
  if (name.endsWith('ायै')) return name.slice(0, -3) + 'ायाः';
  if (name.endsWith('ाय')) return name.slice(0, -2) + 'स्य';
  if (name.endsWith('ये')) return name.slice(0, -2) + 'ेः';
  if (name.endsWith('ै')) return name.slice(0, -1) + 'ाः';
  if (name.endsWith('े')) return name.slice(0, -1) + 'स्य';
  return name + 'स्य';
}

/** Deity art + name for an option tile; falls back to the lesson's own name. */
export function seedOptionFor(l: MantraLesson): { key: string; label: string; image?: { uri: string } | number } {
  const d = deityOf(l.deityId);
  return d ? { key: `d:${d.id}`, label: d.name, image: d.image } : { key: `l:${l.id}`, label: l.titleHi };
}
