import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Analytics — LOCAL-ONLY event log (privacy-first, zero credentials).
 *
 * SECURITY (2026-07-28, see SECURITY-NO-KEY-REWRITE.md): the app ships NO key of
 * any kind, so nothing is sent over the network. Events are kept in a small
 * rolling AsyncStorage buffer purely for on-device debugging. If server-side
 * analytics are ever wanted back, the sanctioned designs are the publishable
 * (anon) key + the insert-only RLS policies already on `app_events`, or a thin
 * proxy endpoint — never a secret in the bundle.
 *
 * The public API (`track` / `flushAnalytics`) is unchanged so the 12 call sites
 * need no edits.
 */

const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';

const ID_KEY = '@dharma:install_id';
const QUEUE_KEY = '@dharma:analytics_queue';

type Ev = { install_id: string; event: string; props: Record<string, unknown>; app_version: string; platform: string; at: string };

let installId: string | null = null;
let queue: Ev[] = [];
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

/** Log an event locally. Safe to call from anywhere; never throws, never blocks. */
export function track(event: string, props: Record<string, unknown> = {}): void {
  (async () => {
    await ensureLoaded();
    queue.push({
      install_id: installId ?? 'unknown',
      event,
      props,
      app_version: APP_VERSION,
      platform: Platform.OS,
      at: new Date().toISOString(),
    });
    await persistQueue();
  })().catch(() => {});
}

/** Kept for API compatibility — network flush no longer exists. */
export function flushAnalytics(): void {
  /* local-only by design */
}
