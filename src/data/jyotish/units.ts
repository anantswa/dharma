/**
 * The nine gates of the Path of the Sky. Units 1-2 are the playable pilot;
 * 3-9 appear on the map as locked gates so the learner sees the whole road
 * (deliberate: a visible journey outmotivates a mystery meat menu).
 */
import type { Unit } from './types';
import { UNIT1 } from './unit1';
import { UNIT2 } from './unit2';

const locked = (n: number, id: string, title: string, titleHi: string, tagline: string, glyph: string): Unit => ({
  id, n, title, titleHi, tagline, glyph, locked: true, cards: [],
  trial: { intro: '', items: [], passCount: 0, seconds: 0 },
});

export const JYOTISH_UNITS: Unit[] = [
  UNIT1,
  UNIT2,
  locked(3, 'twelve-bhavas', 'The Twelve Bhavas', 'द्वादश भाव', 'The houses where life happens', '⌂'),
  locked(4, 'lordship', 'Lordship', 'स्वामित्व', 'The chart becomes a web', '🗝'),
  locked(5, 'nakshatras', 'The 27 Moons', 'नक्षत्र', 'The Moon\'s 27-fold wheel', '✨'),
  locked(6, 'dashas', 'Daśās', 'दशा', 'The timetable of a life', '⏳'),
  locked(7, 'gochara', 'Gochara', 'गोचर', 'Slow planets as weather', '🌊'),
  locked(8, 'yogas', 'Yogas', 'योग', 'Patterns in the web', '🕸'),
  locked(9, 'read-a-chart', 'Read a Chart', 'कुंडली पढ़ना', 'The capstone: a full reading', '📜'),
];

export const getUnit = (id: string): Unit | undefined => JYOTISH_UNITS.find((u) => u.id === id);
