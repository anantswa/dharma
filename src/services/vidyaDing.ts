import { Audio } from 'expo-av';

/**
 * The learned moment — one short bell when a card's "Test yourself" is passed.
 * Bundled asset (assets/audio/vidya_ding.mp3, ~1.6 s), fire-and-forget; every
 * failure is swallowed so the grade never waits on audio.
 */
const DING = require('../../assets/audio/vidya_ding.mp3');

export function playLearnedDing(): void {
  Audio.Sound.createAsync(DING, { shouldPlay: true, volume: 0.8 })
    .then(({ sound }) => {
      sound.setOnPlaybackStatusUpdate((st) => {
        if (st.isLoaded && st.didJustFinish) sound.unloadAsync().catch(() => undefined);
      });
    })
    .catch(() => undefined);
}
