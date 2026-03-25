import { Audio, AVPlaybackStatus } from 'expo-av';
import { DevotionalTrack } from '../data/devotionalTracks';
import { useMusicStore } from '../store/musicStore';

/**
 * AudioService - Singleton service for managing devotional music playback
 * Handles audio loading, playback control, and state management
 */
class AudioServiceClass {
  private sound: Audio.Sound | null = null;
  private isLoaded = false;
  private currentTrackId: string | null = null;
  private wasPlayingBeforeBackground = false;

  /**
   * Initialize audio configuration for iOS and Android
   */
  async initialize() {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        interruptionModeIOS: 1,
        interruptionModeAndroid: 1,
      });
    } catch (error) {
      console.error('Error setting audio mode:', error);
    }
  }

  /**
   * Cleanup and unload current sound
   */
  private async cleanup() {
    if (this.sound) {
      const soundToCleanup = this.sound;
      this.sound = null;
      this.isLoaded = false;
      this.currentTrackId = null;

      try {
        soundToCleanup.setOnPlaybackStatusUpdate(null);
        const status = await soundToCleanup.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await soundToCleanup.stopAsync();
        }
        await soundToCleanup.unloadAsync();
      } catch (e) {
        console.error('Error during cleanup:', e);
      }
    }
  }

  /**
   * Load and play a track
   */
  async loadAndPlay(track: DevotionalTrack) {
    try {
      await this.cleanup();

      const store = useMusicStore.getState();
      store.setCurrentTrack(track.id);
      store.setIsPlaying(false);
      store.setCurrentPosition(0);
      store.setDuration(0);

      const { sound } = await Audio.Sound.createAsync(
        track.audioUrl,
        { shouldPlay: true },
        this.onPlaybackStatusUpdate
      );

      this.sound = sound;
      this.isLoaded = true;
      this.currentTrackId = track.id;
    } catch (error) {
      console.error('Error loading track:', error);
      useMusicStore.getState().setIsPlaying(false);
      useMusicStore.getState().setCurrentTrack(null);
    }
  }

  /**
   * Play current track
   */
  async play() {
    if (!this.sound || !this.isLoaded) return;
    
    try {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded && !status.isPlaying) {
        await this.sound.playAsync();
      }
    } catch (error) {
      console.error('Error playing:', error);
    }
  }

  /**
   * Pause current track
   */
  async pause() {
    if (!this.sound || !this.isLoaded) return;
    
    try {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await this.sound.pauseAsync();
      }
    } catch (error) {
      console.error('Error pausing:', error);
    }
  }

  // Resume
  async resume() {
    await this.play();
  }

  // Seek to position (in milliseconds)
  async seek(position: number) {
    if (this.sound && this.isLoaded) {
      try {
        await this.sound.setPositionAsync(position);
      } catch (error) {
        console.error('Error seeking:', error);
      }
    }
  }

  /**
   * Stop and unload current track
   */
  async stop() {
    await this.cleanup();
    useMusicStore.getState().reset();
  }

  /**
   * Playback status update callback
   */
  private onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    const store = useMusicStore.getState();

    if (this.currentTrackId === store.currentTrackId) {
      store.setCurrentPosition(status.positionMillis);
      if (status.durationMillis) {
        store.setDuration(status.durationMillis);
      }

      store.setIsPlaying(status.isPlaying);

      if (status.didJustFinish && !status.isLooping) {
        store.setIsPlaying(false);
        store.setCurrentPosition(0);
      }
    }
  };

  // Get current status
  async getStatus() {
    if (this.sound && this.isLoaded) {
      return await this.sound.getStatusAsync();
    }
    return null;
  }

  /**
   * Pause audio when app goes to background
   */
  async pauseForBackground() {
    try {
      if (this.sound && this.isLoaded) {
        const status = await this.sound.getStatusAsync();
        if (status.isLoaded) {
          this.wasPlayingBeforeBackground = status.isPlaying;
          if (status.isPlaying) {
            await this.sound.pauseAsync();
          }
        }
      }
    } catch (error) {
      console.error('Error pausing for background:', error);
    }
  }

  /**
   * Restore audio when app comes to foreground
   */
  async restoreFromBackground() {
    try {
      await this.initialize();
      
      if (this.wasPlayingBeforeBackground && this.sound && this.isLoaded) {
        const status = await this.sound.getStatusAsync();
        if (status.isLoaded && !status.isPlaying) {
          await this.sound.playAsync();
        }
      }
      this.wasPlayingBeforeBackground = false;
    } catch (error) {
      console.error('Error restoring from background:', error);
    }
  }
}

// Export singleton instance
export const AudioService = new AudioServiceClass();
