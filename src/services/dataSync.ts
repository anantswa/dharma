/**
 * Data sync service — fetches wisdom + festivals from Supabase,
 * caches to AsyncStorage, supports delta sync and offline fallback.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FestivalEntry, WisdomEntry } from '../types/supabase';
import { supabaseQuery } from './supabase';

const WISDOM_CACHE_KEY = '@dharma:wisdom_cache';
const FESTIVALS_CACHE_KEY = '@dharma:festivals_cache';
const LAST_SYNC_KEY = '@dharma:last_sync';

// How often to re-sync (24 hours)
const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;

/**
 * Fetch all wisdom entries from Supabase.
 * Selects only the fields the app needs (reduces bandwidth).
 */
async function fetchWisdom(): Promise<WisdomEntry[]> {
  const fields = [
    'id', 'tradition', 'source_text', 'source_location', 'speaker', 'listener',
    'context', 'original_script', 'transliteration', 'translation_en', 'translation_hi',
    'elaboration', 'themes', 'mood', 'era', 'short_form', 'importance',
    'emotion_cluster', 'calendar_tags', 'series_id', 'series_order',
    'audio_url', 'created_at',
  ].join(',');

  return supabaseQuery<WisdomEntry>('wisdom', `select=${fields}&order=importance.desc`);
}

/**
 * Fetch all festivals from Supabase.
 */
async function fetchFestivals(): Promise<FestivalEntry[]> {
  const fields = [
    'id', 'date', 'name', 'faith', 'category', 'description',
    'significance', 'story', 'customs', 'regions', 'importance',
    'tradition', 'alternate_names', 'lunar_date', 'duration_days',
    'content_themes', 'suggested_mood', 'year',
  ].join(',');

  return supabaseQuery<FestivalEntry>('festivals', `select=${fields}&order=date.asc`);
}

/**
 * Load cached data from AsyncStorage.
 */
export async function loadCachedData(): Promise<{
  wisdom: WisdomEntry[];
  festivals: FestivalEntry[];
  lastSyncAt: string | null;
}> {
  try {
    const [wisdomJson, festivalsJson, lastSync] = await Promise.all([
      AsyncStorage.getItem(WISDOM_CACHE_KEY),
      AsyncStorage.getItem(FESTIVALS_CACHE_KEY),
      AsyncStorage.getItem(LAST_SYNC_KEY),
    ]);

    return {
      wisdom: wisdomJson ? JSON.parse(wisdomJson) : [],
      festivals: festivalsJson ? JSON.parse(festivalsJson) : [],
      lastSyncAt: lastSync,
    };
  } catch (error) {
    console.error('Failed to load cached data:', error);
    return { wisdom: [], festivals: [], lastSyncAt: null };
  }
}

/**
 * Save data to AsyncStorage cache.
 */
async function saveToCache(
  wisdom: WisdomEntry[],
  festivals: FestivalEntry[],
): Promise<void> {
  const now = new Date().toISOString();
  await Promise.all([
    AsyncStorage.setItem(WISDOM_CACHE_KEY, JSON.stringify(wisdom)),
    AsyncStorage.setItem(FESTIVALS_CACHE_KEY, JSON.stringify(festivals)),
    AsyncStorage.setItem(LAST_SYNC_KEY, now),
  ]);
}

/**
 * Check if a sync is needed (last sync was >24h ago or never synced).
 */
export function isSyncNeeded(lastSyncAt: string | null): boolean {
  if (!lastSyncAt) return true;
  const lastSync = new Date(lastSyncAt).getTime();
  return Date.now() - lastSync > SYNC_INTERVAL_MS;
}

/**
 * Perform a full sync: fetch all data from Supabase and cache locally.
 *
 * Returns the fresh data. If the network request fails, returns null
 * (caller should fall back to cached data).
 */
export async function syncFromSupabase(): Promise<{
  wisdom: WisdomEntry[];
  festivals: FestivalEntry[];
} | null> {
  try {
    console.log('[DataSync] Syncing from Supabase...');
    const [wisdom, festivals] = await Promise.all([
      fetchWisdom(),
      fetchFestivals(),
    ]);

    console.log(`[DataSync] Fetched ${wisdom.length} wisdom, ${festivals.length} festivals`);

    await saveToCache(wisdom, festivals);
    console.log('[DataSync] Cache updated');

    return { wisdom, festivals };
  } catch (error) {
    console.error('[DataSync] Sync failed:', error);
    return null;
  }
}
