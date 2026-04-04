/**
 * Supabase client for the Dharma app.
 *
 * Uses the Supabase REST API directly (no supabase-js dependency needed).
 * The service key is used for now; replace with anon key before production.
 *
 * All requests are read-only SELECT queries — the app never writes to Supabase.
 */

const SUPABASE_URL = 'https://aiwugigdrvijjeoqtpog.supabase.co';

// TODO: Replace with anon key from Supabase dashboard before shipping to public.
// The anon key is safe to embed in the app (read-only via RLS policies).
// Get it from: Supabase Dashboard → Settings → API → anon/public key
const SUPABASE_KEY = 'sb_secret_NSb4vFficZ00dlalq8vHlw_wQbVgUV';

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
