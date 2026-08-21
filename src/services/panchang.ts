import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Daily panchang strip — tithi + masa for today, from the PRE-COMPUTED config
 * (`dharma-art/config/tithi.json`), generated server-side by the verified drik
 * engine (New Delhi reference — same engine as the festival calendar). No client
 * astronomy: accuracy stays canonical, the app only looks up today's row.
 */

const URL =
  'https://dharmaweave.com/cdn/dharma-art/config/tithi.json';
const CACHE_KEY = '@dharma:tithi_config';
const CACHE_AT_KEY = '@dharma:tithi_config_at';
const WEEK_MS = 7 * 24 * 3600 * 1000;

/** date (YYYY-MM-DD) → [tithiName, masaName] */
type TithiTable = Record<string, [string, string]>;

let table: TithiTable | null = null;

const localDay = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

async function load(): Promise<TithiTable | null> {
  if (table) return table;
  // cache first (instant), refresh weekly in background
  try {
    const [raw, at] = await Promise.all([
      AsyncStorage.getItem(CACHE_KEY),
      AsyncStorage.getItem(CACHE_AT_KEY),
    ]);
    if (raw) {
      table = JSON.parse(raw);
      const fresh = at && Date.now() - Number(at) < WEEK_MS;
      if (!fresh) refresh().catch(() => {});
      return table;
    }
  } catch { /* fall through to network */ }
  await refresh().catch(() => {});
  return table;
}

async function refresh(): Promise<void> {
  const res = await fetch(URL);
  if (!res.ok) return;
  const data = (await res.json()) as TithiTable;
  if (data && typeof data === 'object') {
    table = data;
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data)).catch(() => {});
    AsyncStorage.setItem(CACHE_AT_KEY, String(Date.now())).catch(() => {});
  }
}

export type TodayPanchang = { tithi: string; masa: string };

/** Today's tithi + masa, or null if unavailable (UI should simply hide the line). */
export async function todaysPanchang(): Promise<TodayPanchang | null> {
  const t = await load();
  const row = t?.[localDay()];
  if (!row) return null;
  return { tithi: row[0], masa: row[1] };
}
