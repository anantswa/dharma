/**
 * Supabase client for the Dharma app.
 *
 * Uses the Supabase REST API directly (no supabase-js dependency needed).
 * All requests are read-only SELECT queries — the app never writes to Supabase.
 *
 * Credentials come from app.json → expo.extra (centralized config, not hardcoded here).
 * PRODUCTION TODO: mint a Supabase *anon/publishable* key + enable read-only RLS, then swap
 * `supabaseKey` in app.json. The current key works but is a service key (bypasses RLS) — fine
 * for internal builds, must be replaced before a public store release.
 */
import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as { supabaseUrl?: string; supabaseKey?: string };

const SUPABASE_URL = extra.supabaseUrl ?? 'https://aiwugigdrvijjeoqtpog.supabase.co';
const SUPABASE_KEY = extra.supabaseKey ?? '';

const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

/**
 * Query the Supabase REST API.
 *
 * @param table - Table name (e.g. 'wisdom', 'festivals')
 * @param params - PostgREST query params (e.g. 'select=*&tradition=eq.Hindu&limit=10')
 * @returns Parsed JSON array of rows
 */
export async function supabaseQuery<T = any>(
  table: string,
  params: string = 'select=*',
): Promise<T[]> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${params}`;

  const response = await fetch(url, { headers: HEADERS });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase query failed: ${response.status} ${text}`);
  }

  return response.json();
}

/**
 * Get the count of rows in a table (without fetching all data).
 */
export async function supabaseCount(table: string, filter: string = ''): Promise<number> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=id&${filter}`;

  const response = await fetch(url, {
    headers: {
      ...HEADERS,
      Prefer: 'count=exact',
      'Range-Unit': 'items',
      Range: '0-0',
    },
  });

  const contentRange = response.headers.get('content-range');
  if (contentRange) {
    const total = contentRange.split('/')[1];
    return parseInt(total, 10) || 0;
  }
  return 0;
}

export { SUPABASE_URL };
