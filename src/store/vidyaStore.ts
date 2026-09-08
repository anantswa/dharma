import { create } from 'zustand';
import { BUNDLED_LESSONS, fetchMantraLoops, fetchVidyaLessons } from '../data/vidya';
import type { MantraLesson } from '../data/vidya/types';

/**
 * VidyaStore — the loaded Mantra Vidyā catalog. Opens on the bundled copy at
 * once; the CDN copy replaces it when it arrives. "Lesson exists in the loaded
 * catalog" (the Mantra-of-the-Day precondition) always means THIS list.
 */
type VidyaState = {
  lessons: MantraLesson[];
  source: 'bundled' | 'cdn';
  /** Sung-loop manifest (mantras/catalog.json): key → mp3. */
  loops: Record<string, string>;
  loading: boolean;
  fetched: boolean;
  load: () => Promise<void>;
};

export const useVidyaStore = create<VidyaState>((set, get) => ({
  lessons: BUNDLED_LESSONS,
  source: 'bundled',
  loops: {},
  loading: false,
  fetched: false,

  load: async () => {
    if (get().loading || get().fetched) return;
    set({ loading: true });
    const [live, loops] = await Promise.all([fetchVidyaLessons(), fetchMantraLoops()]);
    set({
      ...(live ? { lessons: live, source: 'cdn' } : {}),
      loops: Object.keys(loops).length ? loops : get().loops,
      loading: false,
      fetched: true,
    });
  },
}));

export const lessonById = (id: string | undefined): MantraLesson | undefined =>
  id ? useVidyaStore.getState().lessons.find((l) => l.id === id) : undefined;
