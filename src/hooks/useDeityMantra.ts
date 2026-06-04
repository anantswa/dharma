import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

/**
 * Plays the active deity's mantra as a seamless background loop, and CROSS-FADES
 * to a new mantra when you swipe to another deity. A single on/off flag controls
 * everything (no track selection) — per the deity-sound design.
 *
 * Canon (music_canon.md authentic-chant spec): the chant should recede and stay
 * calm, so the steady level sits well below the foreground — TARGET ≈ 0.5 — and
 * transitions are equal-ish-power fades, never hard cuts.
 */
const TARGET = 0.5;   // background level — present but never foreground
const FADE_MS = 900;  // crossfade duration on swipe / start / stop
const STEPS = 14;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function useDeityMantra(url: string | undefined, enabled: boolean): void {
  const sound = useRef<Audio.Sound | null>(null);
  const curUrl = useRef<string | undefined>(undefined);
  const gen = useRef(0); // cancellation token — each run invalidates the previous

  useEffect(() => {
    const myGen = ++gen.current;

    const fadeUnload = async (s: Audio.Sound | null, from: number) => {
      if (!s) return;
      try {
        for (let i = STEPS; i >= 0; i--) {
          await s.setVolumeAsync((i / STEPS) * from).catch(() => {});
          await wait(FADE_MS / STEPS);
        }
      } catch { /* noop */ }
      await s.stopAsync().catch(() => {});
      await s.unloadAsync().catch(() => {});
    };

    const run = async () => {
      // OFF, or nothing to play → fade out whatever is playing.
      if (!enabled || !url) {
        const old = sound.current;
        sound.current = null;
        curUrl.current = undefined;
        await fadeUnload(old, TARGET);
        return;
      }
      // Already playing this exact chant → leave it be.
      if (curUrl.current === url && sound.current) return;

      const old = sound.current;
      try {
        const { sound: next } = await Audio.Sound.createAsync(
          { uri: url },
          { isLooping: true, volume: 0, shouldPlay: true },
        );
        // Superseded mid-load (rapid swipe / toggle) → discard.
        if (gen.current !== myGen) { await next.unloadAsync().catch(() => {}); return; }
        sound.current = next;
        curUrl.current = url;
        // Equal-power-ish crossfade: new rises, old falls.
        for (let i = 0; i <= STEPS; i++) {
          if (gen.current !== myGen) break;
          const v = (i / STEPS) * TARGET;
          await next.setVolumeAsync(v).catch(() => {});
          if (old) await old.setVolumeAsync(TARGET - v).catch(() => {});
          await wait(FADE_MS / STEPS);
        }
        if (old) { await old.stopAsync().catch(() => {}); await old.unloadAsync().catch(() => {}); }
      } catch { /* network / decode failure — stay silent */ }
    };

    run();
  }, [url, enabled]);

  // Hard stop on unmount (leaving the temple).
  useEffect(() => () => {
    gen.current++;
    const s = sound.current;
    sound.current = null;
    curUrl.current = undefined;
    if (s) { s.stopAsync().catch(() => {}); s.unloadAsync().catch(() => {}); }
  }, []);
}
