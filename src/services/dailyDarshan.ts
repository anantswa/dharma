/**
 * The heart of "The Daily Visit": one function that knows what today's darshan
 * IS — deity, wisdom line, and (on ~14 mapped days) the festival that
 * re-dresses the temple. Three surfaces share it so they can never disagree:
 * the daily darshan card (Move 1), the ārati bell notifications (Move 2), and
 * the Mandir festival dressing (Move 4).
 *
 * Deterministic per calendar day (local): everyone who opens the app on
 * Ekadashi sees the Ekadashi temple; the same device asking twice gets the
 * same card. No randomness — a temple's day is not a slot machine.
 */
import { todaysDarshan } from '../data/faiths';
import type { Deity } from '../data/deityImages';
import type { TraditionKey } from '../store/preferencesStore';
import calendarData from '../data/calendar/events_2025.json';
import wisdomData from '../data/wisdom_core_50.json';

export type FestivalDress = {
  name: string;
  /** One line for the temple kicker + the card. */
  line: string;
  /** Deity id from FINAL_DEITIES whose art dresses the day (undefined = keep the vāra deity). */
  deityId?: string;
};

export type DailyDarshan = {
  deity: Deity;
  reason: string;
  wisdom: { text: string; original?: string; source?: string };
  festival?: FestivalDress;
};

/** Local calendar date — the temple's day must not flip at UTC midnight. */
export function localDateKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* ── v1 festival mappings: the ~14 that dress the temple ──────────────────
 * Everything else on the 153-event calendar keeps its Calendar-tab card and
 * does NOT re-dress Mandir (bounded scope, per the release plan). Matching is
 * by substring against the bundled event names for the exact local date, so a
 * calendar correction upstream flows through automatically. */
const FESTIVAL_DRESS: { match: string; dress: FestivalDress; faith: 'Hindu' | 'Buddhist' }[] = [
  { match: 'ekadashi', faith: 'Hindu', dress: { name: 'Ekādaśī', line: 'Ekādaśī — a day for lightness and remembrance', deityId: '5' } },
  { match: 'purnima', faith: 'Hindu', dress: { name: 'Pūrṇimā', line: 'Pūrṇimā — the full moon fills the temple' } },
  { match: 'ganesh chaturthi', faith: 'Hindu', dress: { name: 'Ganesh Chaturthi', line: 'Ganesh Chaturthi — welcome the remover of obstacles', deityId: '2' } },
  { match: 'navaratri', faith: 'Hindu', dress: { name: 'Navarātri', line: 'Navarātri — nine nights of the Goddess', deityId: '1' } },
  { match: 'dussehra', faith: 'Hindu', dress: { name: 'Vijayadaśamī', line: 'Vijayadaśamī — the victory of dharma', deityId: '8' } },
  { match: 'vijayadashami', faith: 'Hindu', dress: { name: 'Vijayadaśamī', line: 'Vijayadaśamī — the victory of dharma', deityId: '8' } },
  { match: 'diwali', faith: 'Hindu', dress: { name: 'Dīpāvalī', line: 'Dīpāvalī — row upon row of lamps', deityId: '6' } },
  { match: 'lakshmi puja', faith: 'Hindu', dress: { name: 'Lakṣmī Pūjā', line: 'Lakṣmī Pūjā — the goddess of abundance visits', deityId: '6' } },
  { match: 'gita jayanti', faith: 'Hindu', dress: { name: 'Gītā Jayantī', line: 'Gītā Jayantī — the day the Song was sung', deityId: '5' } },
  { match: 'makar sankranti', faith: 'Hindu', dress: { name: 'Makar Sankrānti', line: 'Makar Sankrānti — the Sun turns north' } },
  { match: 'shivaratri', faith: 'Hindu', dress: { name: 'Mahāśivarātri', line: 'Mahāśivarātri — the great night of Śiva', deityId: '7' } },
  { match: 'holi', faith: 'Hindu', dress: { name: 'Holī', line: 'Holī — colour, forgiveness, spring', deityId: '5' } },
  { match: 'ram navami', faith: 'Hindu', dress: { name: 'Rāma Navamī', line: 'Rāma Navamī — the prince of Ayodhyā is born', deityId: '8' } },
  { match: 'hanuman jayanti', faith: 'Hindu', dress: { name: 'Hanumān Jayantī', line: 'Hanumān Jayantī — strength in service', deityId: '3' } },
  { match: 'janmashtami', faith: 'Hindu', dress: { name: 'Janmāṣṭamī', line: 'Janmāṣṭamī — the midnight birth of Kṛṣṇa', deityId: '5' } },
  { match: 'vesak', faith: 'Buddhist', dress: { name: 'Vesak', line: 'Vesak — birth, awakening, and passing of the Buddha' } },
  { match: 'buddha purnima', faith: 'Buddhist', dress: { name: 'Vesak', line: 'Vesak — birth, awakening, and passing of the Buddha' } },
  { match: 'bodhi day', faith: 'Buddhist', dress: { name: 'Bodhi Day', line: 'Bodhi Day — the morning star and the awakening' } },
];

function eventsFor(dateKey: string): { name: string; faith?: string }[] {
  const all = (calendarData as any).events_2026 ?? [];
  return all.filter((e: any) => e?.date === dateKey);
}

export function todaysFestival(tradition?: TraditionKey | null, date = new Date()): FestivalDress | undefined {
  const todays = eventsFor(localDateKey(date));
  const faith = tradition === 'Buddhist' ? 'Buddhist' : 'Hindu';
  for (const ev of todays) {
    const name = String(ev.name ?? '').toLowerCase();
    const hit = FESTIVAL_DRESS.find((f) => f.faith === faith && name.includes(f.match));
    if (hit) return hit.dress;
  }
  return undefined;
}

/* Deterministic day-hash so the wisdom line rotates daily but never repeats
 * within the same day across surfaces (card, bell, temple all agree). */
function dayHash(dateKey: string): number {
  let h = 0;
  for (const ch of dateKey) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

export function dailyWisdom(tradition?: TraditionKey | null, date = new Date()) {
  const all = (wisdomData as any[]).filter((w) => w?.translation_en || w?.short_form);
  const pool = tradition
    ? all.filter((w) => String(w.tradition ?? '').toLowerCase().includes(tradition.toLowerCase()))
    : all;
  const list = pool.length ? pool : all;
  const w = list[dayHash(localDateKey(date)) % list.length];
  return {
    text: w.translation_en || w.short_form || '',
    original: w.original_transliteration || undefined,
    source: w.source || w.source_text || undefined,
  };
}

import { FINAL_DEITIES } from '../data/deityImages';

export function getDailyDarshan(tradition?: TraditionKey | null, date = new Date()): DailyDarshan {
  const base = todaysDarshan(tradition ?? undefined);
  const festival = todaysFestival(tradition, date);
  let deity = base.deity;
  if (festival?.deityId) {
    const f = FINAL_DEITIES.find((d) => d.id === festival.deityId);
    if (f) deity = f;
  }
  return {
    deity,
    reason: festival ? festival.line : base.reason,
    wisdom: dailyWisdom(tradition, date),
    festival,
  };
}
