/**
 * Data sync service — fetches wisdom + festivals from Supabase,
 * caches to AsyncStorage, supports delta sync and offline fallback.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FestivalEntry, WisdomEntry } from '../types/supabase';
// SECURITY (2026-07-28): the app holds no backend credential. Content tables are
// published as static JSON in the PUBLIC storage bucket and fetched keylessly.
const PUBLIC_CONFIG =
  'https://aiwugigdrvijjeoqtpog.supabase.co/storage/v1/object/public/dharma-art/config';

async function publicJson<T>(name: string): Promise<T[]> {
  const res = await fetch(`${PUBLIC_CONFIG}/${name}`);
  if (!res.ok) throw new Error(`${name}: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

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
  return publicJson<WisdomEntry>('wisdom.json');
}

/**
 * Fetch all festivals from Supabase.
 */
async function fetchFestivals(): Promise<FestivalEntry[]> {
  return publicJson<FestivalEntry>('festivals.json');
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
