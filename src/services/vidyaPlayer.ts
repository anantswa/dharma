import { Audio, AVPlaybackStatus } from 'expo-av';
import { create } from 'zustand';
import type { MantraLesson, MantraWord } from '../data/vidya/types';
import { getPlayableUri } from './streamCache';

/**
 * VidyaPlayer — the pinned mini-player's engine. v2 (founder's verdict,
 * 2026-09-08): ONE track per card, the sung one (`audio.sung`); no picker,
 * no spoken TTS, no alignment. The same streamCache + expo-av path as
 * narration, and the same audio mode Dhyāna sets so playback survives the
 * lock screen.
 *
 * Behaviour rules:
 *   word clip      — playWord() sounds `words[i].audioUrl` on its own channel,
 *                    pausing the sung track and resuming it after the clip
 *                    (when it was playing). Words without a clip stay silent.
 *   pause-on-sheet — openWord() pauses the main track and plays the word clip;
 *                    closeWord() resumes from the paused position.
 *   ownership      — stop() on Japa hand-off and on leaving the lesson.
 */
export type VidyaPlayerState = {
  lessonId: string | null;
  /** false when the card has no sung track — the bar hides. */
  hasTrack: boolean;
  isPlaying: boolean;
  loading: boolean;
  position: number;
  duration: number;
  setState: (s: Partial<VidyaPlayerState>) => void;
  reset: () => void;
};

const EMPTY = {
  lessonId: null, hasTrack: false, isPlaying: false, loading: false, position: 0, duration: 0,
};

export const useVidyaPlayer = create<VidyaPlayerState>((set) => ({
  ...EMPTY,
  setState: (s) => set(s),
  reset: () => set({ ...EMPTY }),
}));

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
  private gen = 0;
  /** Main-track state remembered while a word sheet is open. */
  private sheet: { position: number; wasPlaying: boolean } | null = null;
  /** Set while a word clip (outside a sheet) interrupted a playing main track. */
  private resumeAfterWord = false;

  private onStatus = (gen: number) => (st: AVPlaybackStatus) => {
    if (gen !== this.gen || !st.isLoaded) return;
    const store = useVidyaPlayer.getState();
    store.setState({
      position: st.positionMillis,
      duration: st.durationMillis ?? store.duration,
      isPlaying: st.isPlaying && !st.didJustFinish,
    });
    if (st.didJustFinish) store.setState({ isPlaying: false, position: 0 });
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

  private async load(shouldPlay: boolean) {
    const gen = ++this.gen;
    const url = this.lesson?.audio.sung ?? null;
    const store = useVidyaPlayer.getState();
    await this.unloadMain();
    store.setState({ hasTrack: !!url, loading: !!url, isPlaying: false, position: 0 });
    if (!url) return;
    try {
      await Audio.setAudioModeAsync(AUDIO_MODE).catch(() => {});
      const uri = await getPlayableUri(url);
      if (gen !== this.gen) return;
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay, progressUpdateIntervalMillis: 120 },
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

  /** Bind a lesson (screen 1) and auto-play its sung track. */
  async attach(lesson: MantraLesson, autoplay: boolean) {
    if (this.lesson?.id === lesson.id && this.sound) return;
    this.lesson = lesson;
    this.sheet = null;
    this.resumeAfterWord = false;
    await this.unloadWord();
    useVidyaPlayer.getState().setState({ lessonId: lesson.id, duration: 0 });
    await this.load(autoplay);
  }

  async play() {
    if (!this.sound) { if (this.lesson) await this.load(true); return; }
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
    this.resumeAfterWord = false;
    try { await this.sound?.pauseAsync(); } catch { /* noop */ }
  }

  async toggle() {
    if (useVidyaPlayer.getState().isPlaying) await this.pause();
    else await this.play();
  }

  async seek(ms: number) {
    try { await this.sound?.setPositionAsync(Math.max(0, ms)); } catch { /* noop */ }
  }

  /** Pause-on-sheet: remember where the main track was, pause it, sound the word. */
  async openWord(word: MantraWord) {
    const st = useVidyaPlayer.getState();
    if (!this.sheet) this.sheet = { position: st.position, wasPlaying: st.isPlaying };
    await this.pause();
    await this.playWord(word);
  }

  /**
   * The word alone, on its own channel — its per-word clip (v2: rendered
   * individually, so it matches the word exactly). Outside a sheet, a playing
   * main track pauses for the clip and resumes when it ends. No clip → silent.
   */
  async playWord(word: MantraWord) {
    await this.unloadWord();
    if (!word.audioUrl) return;
    const wasPlaying = useVidyaPlayer.getState().isPlaying;
    if (wasPlaying) {
      try { await this.sound?.pauseAsync(); } catch { /* noop */ }
    }
    // remember across clips: a second tap mid-clip keeps the promise to resume
    this.resumeAfterWord = !this.sheet && (wasPlaying || this.resumeAfterWord);
    try {
      const uri = await getPlayableUri(word.audioUrl);
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      this.wordSound = sound;
      sound.setOnPlaybackStatusUpdate((s) => {
        if (!s.isLoaded || !s.didJustFinish) return;
        sound.unloadAsync().catch(() => {});
        if (this.wordSound !== sound) return; // superseded by a newer clip
        this.wordSound = null;
        if (this.resumeAfterWord) {
          this.resumeAfterWord = false;
          this.sound?.playAsync().catch(() => {});
        }
      });
    } catch {
      if (this.resumeAfterWord) { this.resumeAfterWord = false; this.sound?.playAsync().catch(() => {}); }
    }
  }

  /** Close the sheet: the main track resumes from where it was paused. */
  async closeWord() {
    await this.unloadWord();
    const s = this.sheet;
    this.sheet = null;
    this.resumeAfterWord = false;
    if (!s || !this.sound) return;
    try {
      await this.sound.setPositionAsync(s.position);
      if (s.wasPlaying) await this.sound.playAsync();
    } catch { /* noop */ }
  }

  /** Hand-off / leave: everything down, store cleared. */
  async stop() {
    this.gen++;
    this.lesson = null;
    this.sheet = null;
    this.resumeAfterWord = false;
    // Reset the store synchronously: an attach() for the next card can run in
    // the same tick (pop back to a lesson), and a reset after the native
    // unloads would clobber its lessonId.
    useVidyaPlayer.getState().reset();
    await this.unloadWord();
    await this.unloadMain();
  }
}

export const VidyaPlayer = new VidyaPlayerClass();
