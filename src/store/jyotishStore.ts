/**
 * Jyotish module state: progress per unit + the learner's birth data.
 *
 * DESIGN LAW (privacy, from the brief and the app's standing stance):
 * birth data lives ONLY in this on-device store. It must never be sent to
 * analytics, never appear in event props, never leave the phone. Analytics
 * about this module may record that a lesson was completed — never whose
 * sky it was.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { castChart, type Chart } from '../services/jyotishEngine';

export type BirthData = {
  /** Local birth date/time components (no Date object — timezone-proof). */
  year: number; month: number; day: number;   // month 1-12
  hour: number; minute: number;               // local time at birthplace
  utcOffsetMinutes: number;                   // birthplace offset, e.g. IST = 330
  lat: number; lon: number;
  placeLabel: string;
};

type UnitProgress = {
  cardIndex: number;          // resume point
  completed: boolean;         // deck finished
  trialBest: number;          // best trial score
  trialPassed: boolean;
  correct: number;            // lifetime correct answers in this unit
  attempts: number;
};

type JyotishState = {
  birth: BirthData | null;
  progress: Record<string, UnitProgress>;
  /** Daily Sky Review — the return loop. */
  lastReviewDay: string | null;
  reviewStreak: number;
  /** prompt → consecutive-miss count; drives spaced-repetition weighting. */
  missed: Record<string, number>;
  recordReview: () => void;
  recordItem: (prompt: string, correct: boolean) => void;
  setBirth: (b: BirthData | null) => void;
  getChart: () => Chart | null;
  progressFor: (unitId: string) => UnitProgress;
  saveCardIndex: (unitId: string, i: number) => void;
  recordAnswer: (unitId: string, correct: boolean) => void;
  completeDeck: (unitId: string) => void;
  recordTrial: (unitId: string, score: number, passed: boolean) => void;
};

/** Local calendar date — a Singapore review day must not flip at 8am. */
export const localDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const EMPTY: UnitProgress = { cardIndex: 0, completed: false, trialBest: 0, trialPassed: false, correct: 0, attempts: 0 };

/** Chart is derived, cheap (<5ms), and never persisted — recompute on demand. */
let chartCache: { key: string; chart: Chart } | null = null;

export const useJyotishStore = create<JyotishState>()(
  persist(
    (set, get) => ({
      birth: null,
      progress: {},
      lastReviewDay: null,
      reviewStreak: 0,
      missed: {},
      recordReview: () => set((s) => {
        const today = localDay(new Date());
        if (s.lastReviewDay === today) return {};
        const yesterday = localDay(new Date(Date.now() - 86400e3));
        return { lastReviewDay: today, reviewStreak: s.lastReviewDay === yesterday ? s.reviewStreak + 1 : 1 };
      }),
      recordItem: (prompt, correct) => set((s) => {
        const missed = { ...s.missed };
        if (correct) { if (missed[prompt]) delete missed[prompt]; }
        else missed[prompt] = (missed[prompt] ?? 0) + 1;
        return { missed };
      }),
      setBirth: (b) => { chartCache = null; set({ birth: b }); },
      getChart: () => {
        const b = get().birth;
        if (!b) return null;
        const key = JSON.stringify(b);
        if (chartCache?.key === key) return chartCache.chart;
        const utc = new Date(Date.UTC(b.year, b.month - 1, b.day, b.hour, b.minute) - b.utcOffsetMinutes * 60e3);
        const chart = castChart(utc, b.lat, b.lon);
        chartCache = { key, chart };
        return chart;
      },
      progressFor: (unitId) => get().progress[unitId] ?? EMPTY,
      saveCardIndex: (unitId, i) => set((s) => ({
        progress: { ...s.progress, [unitId]: { ...(s.progress[unitId] ?? EMPTY), cardIndex: i } },
      })),
      recordAnswer: (unitId, correct) => set((s) => {
        const p = s.progress[unitId] ?? EMPTY;
        return { progress: { ...s.progress, [unitId]: { ...p, correct: p.correct + (correct ? 1 : 0), attempts: p.attempts + 1 } } };
      }),
      completeDeck: (unitId) => set((s) => ({
        progress: { ...s.progress, [unitId]: { ...(s.progress[unitId] ?? EMPTY), completed: true, cardIndex: 0 } },
      })),
      recordTrial: (unitId, score, passed) => set((s) => {
        const p = s.progress[unitId] ?? EMPTY;
        return {
          progress: {
            ...s.progress,
            [unitId]: { ...p, trialBest: Math.max(p.trialBest, score), trialPassed: p.trialPassed || passed },
          },
        };
      }),
    }),
    { name: '@dharma:jyotish', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

/** A unit is unlocked when the previous unit's trial is passed (unit 1 always open). */
export function isUnitUnlocked(unitN: number, progress: Record<string, UnitProgress>, unitIds: string[]): boolean {
  if (unitN <= 1) return true;
  const prevId = unitIds[unitN - 2];
  return !!progress[prevId]?.trialPassed;
}
