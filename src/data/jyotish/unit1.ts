/**
 * Unit 1 — The Sky Wheel.
 * The zodiac as a 360° circle: 12 rāśis, elements, qualities, and one honest
 * screen on sidereal vs tropical. Tone: wonder + honesty (astrology-thread
 * register). Every element×quality pair is unique — that's the aha.
 */
import type { Unit } from './types';

export const UNIT1: Unit = {
  id: 'sky-wheel',
  n: 1,
  title: 'The Sky Wheel',
  titleHi: 'राशि चक्र',
  tagline: 'The 360° road the planets walk',
  glyph: '☸',
  cards: [
    {
      kind: 'story',
      art: 'https://dharmaweave.com/cdn/dharma-art/jyotish/story_watchers.jpg',
      title: 'Stand under the night sky',
      text: 'Watch the sky for a year and you notice something strange: the Sun, the Moon, and the five visible planets never wander freely. They all walk the SAME narrow road across the stars — the same belt of sky, again and again.',
      bigGlyph: '✦',
    },
    {
      kind: 'story',
      title: 'The road has a name',
      text: 'That road is the ecliptic — the plane our solar system lies in, seen edge-on from Earth. Sky-watchers everywhere found it. Babylon cut it into 12 equal arcs of 30°; India received that wheel through ancient exchange and married it to something older and its own — the 27 nakshatras of the Moon. Jyotish runs on both wheels at once.',
      truth: 'classical',
      bigGlyph: '☸',
    },
    {
      kind: 'story',
      art: 'https://dharmaweave.com/cdn/dharma-art/jyotish/story_ecliptic.jpg',
      title: '12 × 30 = 360',
      text: 'Each 30° arc is a rāśi — a sign. Mesha (Aries) begins the wheel, Meena (Pisces) closes it. A planet is always in exactly one rāśi, at some degree between 0° and 30°. That single sentence is half of chart-reading.',
      truth: 'classical',
      bigGlyph: '♈',
    },
    {
      kind: 'quiz',
      prompt: 'A planet sits at 95° on the wheel. Which rāśi is it in?',
      choices: ['Mithuna (Gemini), the 3rd', 'Karka (Cancer), the 4th', 'Simha (Leo), the 5th'],
      answer: 1,
      why: '90°–120° is the 4th arc: Karka. Divide by 30, take the next whole sign — you just did real jyotish math.',
    },
    {
      kind: 'story',
      title: 'Four elements, three rounds',
      text: 'The 12 signs cycle through four elements, three times around: Fire, Earth, Air, Water — then again, then again. Fire signs blaze (Mesha, Simha, Dhanu). Earth signs build (Vrishabha, Kanya, Makara). Air signs connect (Mithuna, Tula, Kumbha). Water signs feel (Karka, Vrishchika, Meena).',
      truth: 'classical',
      bigGlyph: '🜂',
    },
    {
      kind: 'match',
      prompt: 'Match each sign to its element.',
      pairs: [
        ['Simha (Leo)', 'Fire — blazes'],
        ['Makara (Capricorn)', 'Earth — builds'],
        ['Tula (Libra)', 'Air — connects'],
        ['Meena (Pisces)', 'Water — feels'],
      ],
      why: 'One from each triad. Fire every 4th sign from Mesha; count and the pattern never lies.',
    },
    {
      kind: 'wheel',
      prompt: 'Tap the FIRE sign that comes after Simha (Leo) on the wheel.',
      answerSign: 8,
      why: 'Fire returns every 4th sign: Mesha → Simha → Dhanu (Sagittarius). Count 4 forward and fire comes back.',
    },
    {
      kind: 'story',
      title: 'Three qualities, four rounds',
      text: 'A second rhythm runs underneath: chara (moving — starts things), sthira (fixed — sustains things), dvisvabhāva (dual — adapts things). It repeats every 3 signs. Mesha starts, Vrishabha holds, Mithuna adapts… all the way around.',
      truth: 'classical',
      bigGlyph: '△',
    },
    {
      kind: 'story',
      title: 'The beautiful trick',
      text: 'Element repeats every 4. Quality repeats every 3. So no two signs share BOTH — each of the 12 is a unique pair. Simha is fixed fire: a flame that holds steady. Karka is moving water: the tide that initiates. The wheel isn\'t 12 random symbols — it\'s a 4×3 grid wearing a circle\'s clothes.',
      truth: 'classical',
      bigGlyph: '✳',
    },
    {
      kind: 'quiz',
      prompt: 'Vrishchika (Scorpio) is water, and it SUSTAINS rather than starts or adapts. Its unique pair is…',
      choices: ['Moving water', 'Fixed water', 'Dual water'],
      answer: 1,
      why: 'Fixed water — deep, still, holding. Only Vrishchika has this pair; that uniqueness is the whole design.',
    },
    {
      kind: 'quiz',
      prompt: 'Which of these is the DUAL air sign — the connector that adapts?',
      choices: ['Tula (Libra)', 'Kumbha (Aquarius)', 'Mithuna (Gemini)'],
      answer: 2,
      why: 'Air order is Mithuna–Tula–Kumbha = dual–moving–fixed… careful! Count from Mesha: Mithuna is 3rd → dual. Tula 7th → moving. Kumbha 11th → fixed.',
    },
    {
      kind: 'story',
      art: 'https://dharmaweave.com/cdn/dharma-art/jyotish/story_sidereal.jpg',
      title: 'One honest screen',
      text: 'Western astrology starts its wheel where the Sun crosses the equator in March (tropical). Jyotish pins the wheel to the stars themselves (sidereal). Earth wobbles once every ~26,000 years, so the two starting lines drift apart — today they differ by about 24°. Neither is a lie; they measure different things. This app uses sidereal, Lahiri line — the standard of Indian astronomy.',
      truth: 'computed',
      bigGlyph: '🜨',
    },
    {
      kind: 'story',
      title: 'Why it matters to you',
      text: 'That 24° gap is why "your sign" from a magazine often shifts one sign back in jyotish. Nothing about you changed — the ruler being used did. From here on, when this module says Mesha, it means the stars of Mesha.',
      truth: 'computed',
      bigGlyph: '♒',
    },
    {
      kind: 'personal',
      template: 'moon-sign',
      fallback: 'In jyotish, "your sign" usually means your MOON\'s rāśi — the sky\'s mirror of the mind. Add your birth details from the module home and every lesson from here on speaks about YOUR sky.',
    },
    {
      kind: 'wheel',
      prompt: 'Last one: tap the sign exactly OPPOSITE Mesha on the wheel (6 signs away).',
      answerSign: 6,
      why: 'Tula (Libra). Opposite pairs — Mesha/Tula, Vrishabha/Vrishchika… — will matter enormously when we reach houses and aspects.',
    },
    {
      kind: 'story',
      title: 'Gate One stands open',
      text: 'You now hold the wheel: 12 arcs of 30°, a 4×3 weave of element and quality, pinned to the real stars. Everything else in jyotish — houses, lords, daśās — stands on this circle. Trial awaits.',
      bigGlyph: '🪔',
    },
  ],
  trial: {
    intro: 'The Gate Trial: quick answers, no notes. The wheel should be in your hands now, not on the page.',
    seconds: 60,
    passCount: 6,
    items: [
      { prompt: 'How many degrees in one rāśi?', choices: ['15°', '30°', '45°'], answer: 1 },
      { prompt: 'Fire, Earth, Air, Water — the elements repeat every…', choices: ['3 signs', '4 signs', '6 signs'], answer: 1 },
      { prompt: 'Simha (Leo) is…', choices: ['Fixed fire', 'Moving fire', 'Dual fire'], answer: 0 },
      { prompt: 'A planet at 200° is in which sign?', choices: ['Kanya (6th)', 'Tula (7th)', 'Vrishchika (8th)'], answer: 1 },
      { prompt: 'Jyotish measures the zodiac against…', choices: ['The seasons', 'The fixed stars', 'The horizon'], answer: 1 },
      { prompt: 'The sidereal–tropical gap today is about…', choices: ['2°', '24°', '90°'], answer: 1 },
      { prompt: 'Which is the MOVING water sign?', choices: ['Karka (Cancer)', 'Vrishchika (Scorpio)', 'Meena (Pisces)'], answer: 0 },
      { prompt: 'Opposite Mithuna (3rd) lies…', choices: ['Dhanu (9th)', 'Makara (10th)', 'Kumbha (11th)'], answer: 0 },
    ],
  },
};
