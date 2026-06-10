import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Analytics — a deliberately tiny, privacy-light event log.
 *
 * No PII, no third-party SDK: an anonymous random install id + event name + small
 * props, batched into Supabase `app_events` via PostgREST. Fire-and-forget — it must
 * NEVER block or break the experience (every path swallows errors). This exists so
 * product waves can be measured (D1/D7 retention, feature usage) — the Wen loop
 * needs ground truth.
 */

const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl as string;
const SUPABASE_KEY = Constants.expoConfig?.extra?.supabaseKey as string;
const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';

const ID_KEY = '@dharma:install_id';
const QUEUE_KEY = '@dharma:analytics_queue';
const FLUSH_AT = 8;          // flush when this many events are queued
const FLUSH_MS = 30_000;     // …or at most this often

type Ev = { install_id: string; event: string; props: Record<string, unknown>; app_version: string; platform: string };

let installId: string | null = null;
let queue: Ev[] = [];
let lastFlush = 0;
let loaded = false;

const rid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`;

async function ensureLoaded(): Promise<void> {
  if (loaded) return;
  loaded = true;
  try {
    installId = await AsyncStorage.getItem(ID_KEY);
    if (!installId) {
      installId = rid();
      await AsyncStorage.setItem(ID_KEY, installId);
    }
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (raw) queue = [...JSON.parse(raw), ...queue];
  } catch { /* never fatal */ }
}

async function persistQueue(): Promise<void> {
  try { await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-100))); } catch { /* noop */ }
}

async function flush(): Promise<void> {
  if (!queue.length || !SUPABASE_URL || !SUPABASE_KEY) return;
  const batch = queue.splice(0, queue.length);
  lastFlush = Date.now();
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/app_events`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(batch),
    });
    if (!res.ok) queue = [...batch, ...queue].slice(-100); // put back, capped
  } catch {
    queue = [...batch, ...queue].slice(-100);
  }
  await persistQueue();
}

/** Log an event. Safe to call from anywhere; never throws, never blocks. */
export function track(event: string, props: Record<string, unknown> = {}): void {
  (async () => {
    await ensureLoaded();
    queue.push({
      install_id: installId ?? 'unknown',
      event,
      props,
      app_version: APP_VERSION,
      platform: Platform.OS,
    });
    await persistQueue();
    if (queue.length >= FLUSH_AT || Date.now() - lastFlush > FLUSH_MS) await flush();
  })().catch(() => {});
}

/** Force a flush (e.g. on app foreground). */
export function flushAnalytics(): void {
  (async () => { await ensureLoaded(); await flush(); })().catch(() => {});
}
