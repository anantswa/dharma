import { Audio, AVPlaybackStatus } from 'expo-av';
import { create } from 'zustand';
import type { MantraLesson, MantraWord } from '../data/vidya/types';
import { getPlayableUri } from './streamCache';

/**
 * VidyaPlayer — the pinned mini-player's engine (§3, "playable inside the
 * learning tool"). One lesson at a time, three tracks (spoken slow / spoken
 * natural / sung), the same streamCache + expo-av path as narration, and the
 * same audio mode Dhyāna sets so playback survives the lock screen.
 *
 * Behaviour rules from §3:
 *   pause-on-sheet — openWord() pauses the main track and plays the word clip;
 *                    closeWord() resumes from the paused position.
 *   word-sync      — wordIndex follows words[].t0/t1 on the slow track only
 *                    (the offsets are into spokenSlow).
 *   ownership      — stop() on Japa hand-off, on Recall, and on leaving.
 */
export type VidyaTrackKind = 'slow' | 'natural' | 'sung';

export type VidyaPlayerState = {
  lessonId: string | null;
  kind: VidyaTrackKind;
  isPlaying: boolean;
  loading: boolean;
  position: number;
  duration: number;
  /** Index into words[] currently sounding (slow track, needs t0/t1); -1 when none. */
  wordIndex: number;
  /** Sung track for the current lesson (master, else the loop), if any. */
  sungUrl?: string;
  setState: (s: Partial<VidyaPlayerState>) => void;
  reset: () => void;
};

const EMPTY = {
  lessonId: null, kind: 'slow' as VidyaTrackKind, isPlaying: false, loading: false,
  position: 0, duration: 0, wordIndex: -1, sungUrl: undefined,
};

export const useVidyaPlayer = create<VidyaPlayerState>((set) => ({
  ...EMPTY,
  setState: (s) => set(s),
  reset: () => set({ ...EMPTY }),
}));

/** Which word sounds at `ms` on the slow track (-1 when no offsets cover it). */
export function wordIndexAt(words: MantraWord[], ms: number): number {
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (typeof w.t0 === 'number' && typeof w.t1 === 'number' && ms >= w.t0 && ms < w.t1) return i;
  }
  return -1;
}

const AUDIO_MODE = {
  playsInSilentModeIOS: true,
  staysActiveInBackground: true,
  shouldDuckAndroid: true,
  interruptionModeIOS: 1,
  interruptionModeAndroid: 1,
};

class VidyaPlayerClass {
  private sound: Audio.Sound | null = null;
  private wordSound: Audio.Sound | null = null;
  private lesson: MantraLesson | null = null;
  private kind: VidyaTrackKind = 'slow';
  private gen = 0;
  /** Main-track state remembered while a word sheet is open. */
  private sheet: { position: number; wasPlaying: boolean } | null = null;
  /** Stop the main track here (word played from t0/t1 offsets). */
  private stopAt: number | null = null;

  private urlFor(kind: VidyaTrackKind): string | undefined {
    const l = this.lesson;
    if (!l) return undefined;
    if (kind === 'slow') return l.audio.spokenSlow;
    if (kind === 'natural') return l.audio.spokenNatural;
    return useVidyaPlayer.getState().sungUrl;
  }

  private onStatus = (gen: number) => (st: AVPlaybackStatus) => {
    if (gen !== this.gen || !st.isLoaded) return;
    const store = useVidyaPlayer.getState();
    const words = this.lesson?.words ?? [];
    const wordIndex = this.kind === 'slow' ? wordIndexAt(words, st.positionMillis) : -1;
    store.setState({
      position: st.positionMillis,
      duration: st.durationMillis ?? store.duration,
      isPlaying: st.isPlaying && !st.didJustFinish,
      wordIndex,
    });
    if (this.stopAt !== null && st.isPlaying && st.positionMillis >= this.stopAt) {
      this.stopAt = null;
      this.sound?.pauseAsync().catch(() => {});
    }
    if (st.didJustFinish) store.setState({ isPlaying: false, position: 0, wordIndex: -1 });
  };

  private async unloadMain() {
    const s = this.sound;
    this.sound = null;
    if (s) {
      try { s.setOnPlaybackStatusUpdate(null); await s.stopAsync(); } catch { /* noop */ }
      await s.unloadAsync().catch(() => {});
    }
  }

  private async unloadWord() {
    const s = this.wordSound;
    this.wordSound = null;
    if (s) { await s.stopAsync().catch(() => {}); await s.unloadAsync().catch(() => {}); }
  }

  private async load(kind: VidyaTrackKind, shouldPlay: boolean, positionMillis = 0) {
    const gen = ++this.gen;
    const url = this.urlFor(kind);
    const store = useVidyaPlayer.getState();
    await this.unloadMain();
    this.kind = kind;
    this.stopAt = null;
    store.setState({ kind, loading: !!url, isPlaying: false, position: 0, wordIndex: -1 });
    if (!url) return;
    try {
      await Audio.setAudioModeAsync(AUDIO_MODE).catch(() => {});
      const uri = await getPlayableUri(url);
      if (gen !== this.gen) return;
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay, positionMillis, progressUpdateIntervalMillis: 120 },
        this.onStatus(gen),
      );
      if (gen !== this.gen) { sound.unloadAsync().catch(() => {}); return; }
      this.sound = sound;
      store.setState({ loading: false, isPlaying: shouldPlay });
    } catch {
      // network / decode failure — the lesson still reads; the bar just shows nothing playing
      if (gen === this.gen) store.setState({ loading: false, isPlaying: false });
    }
  }

  /** Bind a lesson (screen 1). `sungUrl` = master, else the loop from mantras/catalog.json. */
  async attach(lesson: MantraLesson, sungUrl: string | undefined, autoplay: boolean) {
    if (this.lesson?.id === lesson.id && this.sound) return;
    this.lesson = lesson;
    this.sheet = null;
    await this.unloadWord();
    useVidyaPlayer.getState().setState({ lessonId: lesson.id, sungUrl, duration: 0 });
    await this.load('slow', autoplay);
  }

  async selectTrack(kind: VidyaTrackKind) {
    if (!this.lesson || !this.urlFor(kind)) return;
    const wasPlaying = useVidyaPlayer.getState().isPlaying;
    await this.load(kind, wasPlaying || kind !== this.kind);
  }

  async play() {
    if (!this.sound) { if (this.lesson) await this.load(this.kind, true); return; }
    try {
      const st = await this.sound.getStatusAsync();
      if (st.isLoaded) {
        if (st.didJustFinish || (st.durationMillis && st.positionMillis >= st.durationMillis)) {
          await this.sound.replayAsync();
        } else {
          await this.sound.playAsync();
        }
      }
    } catch { /* noop */ }
  }

  async pause() {
    this.stopAt = null;
    try { await this.sound?.pauseAsync(); } catch { /* noop */ }
  }

  async toggle() {
    if (useVidyaPlayer.getState().isPlaying) await this.pause();
    else await this.play();
  }

  async seek(ms: number) {
    this.stopAt = null;
    try { await this.sound?.setPositionAsync(Math.max(0, ms)); } catch { /* noop */ }
  }

  /**
   * Pause-on-sheet: remember where the main track was, pause it, and sound the
   * word — its own clip if it has one, else the t0/t1 slice of the slow track;
   * with neither, stay silent (the sheet still opens).
   */
  async openWord(word: MantraWord) {
    const st = useVidyaPlayer.getState();
    if (!this.sheet) this.sheet = { position: st.position, wasPlaying: st.isPlaying };
    await this.pause();
    await this.playWord(word);
  }

  async playWord(word: MantraWord) {
    await this.unloadWord();
    if (word.audioUrl) {
      try {
        const uri = await getPlayableUri(word.audioUrl);
        const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
        this.wordSound = sound;
        sound.setOnPlaybackStatusUpdate((s) => {
          if (s.isLoaded && s.didJustFinish) { sound.unloadAsync().catch(() => {}); if (this.wordSound === sound) this.wordSound = null; }
        });
      } catch { /* silent */ }
      return;
    }
    if (typeof word.t0 === 'number' && typeof word.t1 === 'number' && word.t1 > word.t0) {
      if (this.kind !== 'slow' || !this.sound) await this.load('slow', false);
      if (!this.sound) return;
      this.stopAt = word.t1;
      try { await this.sound.setPositionAsync(word.t0); await this.sound.playAsync(); } catch { /* noop */ }
    }
    // no clip, no offsets → skip silently
  }

  /** Close the sheet: the main track resumes from where it was paused. */
  async closeWord() {
    await this.unloadWord();
    const s = this.sheet;
    this.sheet = null;
    this.stopAt = null;
    if (!s || !this.sound) return;
    try {
      if (this.kind !== 'slow') { /* track was swapped for a slice — leave it */ }
      await this.sound.setPositionAsync(s.position);
      if (s.wasPlaying) await this.sound.playAsync();
    } catch { /* noop */ }
  }

  /** Hand-off / leave: everything down, store cleared. */
  async stop() {
    this.gen++;
    this.lesson = null;
    this.sheet = null;
    this.stopAt = null;
    // Reset the store synchronously: an attach() for the next card can run in
    // the same tick (pop back to a lesson), and a reset after the native
    // unloads would clobber its lessonId / sungUrl.
    useVidyaPlayer.getState().reset();
    await this.unloadWord();
    await this.unloadMain();
  }
}

export const VidyaPlayer = new VidyaPlayerClass();
