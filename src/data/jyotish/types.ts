/**
 * Jyotish module content schema.
 *
 * A unit is a DECK: story cards and game beats interleaved, ending in a Gate
 * Trial. The three truth badges are load-bearing (brief rule): every factual
 * card declares whether it is computed fact, classical craft, or
 * interpretation — the module should leave a learner MORE curious and LESS
 * superstitious.
 */
export type Truth = 'computed' | 'classical' | 'interpretation';

export type StoryCard = {
  kind: 'story';
  title?: string;
  text: string;
  truth?: Truth;
  art?: string;          // /cdn/ image URL, optional
  bigGlyph?: string;     // large decorative glyph (♈ ☉ …) when no art
};

export type QuizCard = {
  kind: 'quiz';
  prompt: string;
  choices: string[];
  answer: number;        // index into choices
  why: string;           // one-line explanation shown after answering
};

/** Tap the right rāśi segment on the 12-spoke wheel. */
export type WheelCard = {
  kind: 'wheel';
  prompt: string;
  answerSign: number;    // 0-11 (0 = Aries/Mesha)
  why: string;
};

/** Personalized beat — renders live from the learner's chart when set. */
export type PersonalCard = {
  kind: 'personal';
  template: 'moon-sign' | 'moon-nakshatra' | 'lagna' | 'first-dasha' | 'graha-spread';
  fallback: string;      // shown when no birth data (still teaches something)
};

/** Match pairs: tap a left item then its right partner; pairs lock in. */
export type MatchCard = {
  kind: 'match';
  prompt: string;
  pairs: [string, string][];   // [left, right]
  why: string;
};

export type Card = StoryCard | QuizCard | WheelCard | PersonalCard | MatchCard;

export type FlashItem = { prompt: string; choices: string[]; answer: number };

export type Unit = {
  id: string;
  n: number;             // 1-9
  title: string;
  titleHi: string;
  tagline: string;       // one line on the map
  glyph: string;
  locked?: boolean;      // future units
  cards: Card[];
  /** Gate Trial: timed flash round. Pass unlocks the next gate. */
  trial: { intro: string; items: FlashItem[]; passCount: number; seconds: number };
};
