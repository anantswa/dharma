/**
 * DataStore — Zustand store for Supabase-synced wisdom + festivals.
 *
 * Replaces the static JSON imports. Data flows:
 * 1. On app start: load from AsyncStorage cache (instant)
 * 2. If cache is stale (>24h) or empty: sync from Supabase in background
 * 3. If Supabase is unreachable AND no cache: fall back to bundled JSON
 */

import { create } from 'zustand';
import type { FestivalEntry, WisdomEntry } from '../types/supabase';
import { isSyncNeeded, loadCachedData, syncFromSupabase } from '../services/dataSync';

// Bundled fallback data (used only when no cache AND no network)
import bundledWisdomRaw from '../data/wisdom_core_50.json';
import bundledEventsRaw from '../data/calendar/events_2025.json';
let bundledEvents2027Raw: any = {};
try { bundledEvents2027Raw = require('../data/calendar/events_2027.json'); } catch (e) {}

type DataState = {
  wisdom: WisdomEntry[];
  festivals: FestivalEntry[];
  lastSyncAt: string | null;
  isSyncing: boolean;
  isLoaded: boolean;
  syncError: string | null;
  dataSource: 'supabase' | 'cache' | 'bundled';

  /** Initialize: load cache, then sync if needed */
  initialize: () => Promise<void>;

  /** Force a fresh sync from Supabase */
  forceSync: () => Promise<void>;
};

/**
 * Convert bundled wisdom JSON (different field names) to WisdomEntry shape.
 */
function convertBundledWisdom(raw: any[]): WisdomEntry[] {
  return raw.map((w: any) => ({
    id: w.id,
    tradition: w.tradition || '',
    source_text: w.lineage || w.source || null,
    source_location: w.source || null,
    speaker: null,
    listener: null,
    context: null,
    original_script: null,
    transliteration: w.original_transliteration || null,
    translation_en: w.translation_en || null,
    translation_hi: null,
    elaboration: null,
    themes: w.theme ? [w.theme] : null,
    mood: null,
    era: null,
    short_form: null,
    importance: w.is_core ? 4 : 3,
    emotion_cluster: null,
    calendar_tags: null,
    series_id: null,
    series_order: null,
    audio_url: null,
    created_at: '',
  }));
}

/**
 * Convert bundled event JSON to FestivalEntry shape.
 */
function convertBundledFestivals(): FestivalEntry[] {
  const all = [
    ...((bundledEventsRaw as any).events_2025 || []),
    ...((bundledEventsRaw as any).events_2026 || []),
    ...((bundledEvents2027Raw as any).events_2027 || []),
  ];
  return all.map((e: any, i: number) => ({
    id: `bundled-${i}`,
    date: e.date,
    name: e.name,
    faith: e.faith || '',
    category: e.category || 'Festival',
    description: e.description || null,
    significance: null,
    story: null,
    customs: null,
    regions: null,
    importance: null,
    tradition: null,
    alternate_names: null,
    lunar_date: null,
    duration_days: 1,
    content_themes: null,
    suggested_mood: null,
    year: e.date ? parseInt(e.date.substring(0, 4), 10) : null,
  }));
}

export const useDataStore = create<DataState>((set, get) => ({
  wisdom: [],
  festivals: [],
  lastSyncAt: null,
  isSyncing: false,
  isLoaded: false,
  syncError: null,
  dataSource: 'bundled',

  initialize: async () => {
    // Step 1: Load from cache (fast, offline)
    const cached = await loadCachedData();

    if (cached.wisdom.length > 0) {
      set({
        wisdom: cached.wisdom,
        festivals: cached.festivals,
        lastSyncAt: cached.lastSyncAt,
        isLoaded: true,
        dataSource: 'cache',
      });
    } else {
      // No cache — use bundled data immediately
      set({
        wisdom: convertBundledWisdom(bundledWisdomRaw as any[]),
        festivals: convertBundledFestivals(),
        isLoaded: true,
        dataSource: 'bundled',
      });
    }

    // Step 2: Sync from Supabase if needed (background)
    if (isSyncNeeded(cached.lastSyncAt)) {
      get().forceSync();
    }
  },

  forceSync: async () => {
    set({ isSyncing: true, syncError: null });

    const result = await syncFromSupabase();

    if (result) {
      set({
        wisdom: result.wisdom,
        festivals: result.festivals,
        lastSyncAt: new Date().toISOString(),
        isSyncing: false,
        dataSource: 'supabase',
      });
    } else {
      set({
        isSyncing: false,
        syncError: 'Could not reach server. Using cached data.',
      });
    }
  },
}));
