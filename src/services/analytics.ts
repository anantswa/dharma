import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { AppState, Platform } from 'react-native';

/**
 * Analytics — anonymous, first-party, credential-free.
 *
 * The app ships NO key (see SECURITY-NO-KEY-REWRITE.md). Events are batched and
 * posted to our own endpoint (dharmaweave.com/api/events/app), which writes them
 * server-side. Nothing identifying is ever collected: a random install id, a
 * random session id, event names and small non-PII props.
 *
 * This is exactly what the App Store privacy declaration covers — Device ID +
 * Product Interaction, not linked to identity, not used for tracking. There is
 * no third-party SDK and no ad network.
 *
 * The public API (`track` / `flushAnalytics`) is stable; call sites never change.
 */

const ENDPOINT = 'https://dharmaweave.com/api/events/app';
const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';

const ID_KEY = '@dharma:install_id';
const QUEUE_KEY = '@dharma:analytics_queue';
const FLUSH_AT = 12;            // flush once this many events are queued
const FLUSH_MS = 45_000;        // ...or at most this often
const SESSION_GAP_MS = 30 * 60_000; // 30 min idle starts a new session
const MAX_QUEUE = 300;

type Ev = { event: string; props: Record<string, unknown>; at: string };

let installId: string | null = null;
let sessionId: string | null = null;
let lastEventAt = 0;
let queue: Ev[] = [];
let lastFlush = 0;
let loaded = false;
let timer: ReturnType<typeof setTimeout> | null = null;

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
      queue.push({ event: 'install', props: {}, at: new Date().toISOString() });
    }
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (raw) queue = [...JSON.parse(raw), ...queue].slice(-MAX_QUEUE);
  } catch { /* never fatal */ }
}

/** A session is a burst of use; 30 idle minutes starts a new one. */
function touchSession(): void {
  const now = Date.now();
  if (!sessionId || now - lastEventAt > SESSION_GAP_MS) {
    sessionId = rid();
    queue.push({ event: 'session_start', props: {}, at: new Date().toISOString() });
  }
  lastEventAt = now;
}

async function persistQueue(): Promise<void> {
  try { await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-MAX_QUEUE))); } catch { /* noop */ }
}

async function flush(): Promise<void> {
  if (!queue.length || !installId) return;
  const batch = queue.splice(0, Math.min(queue.length, 100));
  lastFlush = Date.now();
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        install_id: installId,
        session_id: sessionId,
        app_version: APP_VERSION,
        platform: Platform.OS,
        os_version: String(Platform.Version ?? ''),
        events: batch,
      }),
    });
    if (!res.ok) queue = [...batch, ...queue].slice(-MAX_QUEUE); // put back, capped
  } catch {
    queue = [...batch, ...queue].slice(-MAX_QUEUE);              // offline — keep for next launch
  }
  await persistQueue();
}

/** Log an event. Safe to call from anywhere; never throws, never blocks the UI. */
export function track(event: string, props: Record<string, unknown> = {}): void {
  (async () => {
    await ensureLoaded();
    touchSession();
    queue.push({ event, props, at: new Date().toISOString() });
    await persistQueue();
    if (queue.length >= FLUSH_AT) { await flush(); return; }
    if (!timer) {
      timer = setTimeout(() => { timer = null; flushAnalytics(); }, FLUSH_MS);
    }
  })().catch(() => {});
}

/** Force a flush (app background/foreground, or end of a meaningful flow). */
export function flushAnalytics(): void {
  (async () => { await ensureLoaded(); await flush(); })().catch(() => {});
}

// send what we have when the app goes to the background — the most reliable
// moment to catch a session before the OS suspends us
AppState.addEventListener('change', (s) => {
  if (s === 'background' || s === 'inactive') flushAnalytics();
});
