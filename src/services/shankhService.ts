import { Audio } from 'expo-av';

const SHANKH_SOURCE = require('../../assets/audio/devotional/Shankh_Om_and_Bells.wav');

/**
 * ShankhService - Singleton service for managing looping Shankh Om and Bells audio
 * Provides play, pause, and stop controls for the sacred sound loop
 */
class ShankhServiceClass {
  private sound: Audio.Sound | null = null;
  private isLoaded = false;
  private isPlaying = false;

  /**
   * Start playing the shankh sound in a loop
   */
  async playLoop() {
    try {
      if (!this.sound) {
        const { sound } = await Audio.Sound.createAsync(SHANKH_SOURCE, {
          shouldPlay: true,
          isLooping: true,
        });
        this.sound = sound;
        this.isLoaded = true;
        this.isPlaying = true;
        return true;
      }

      if (this.isLoaded) {
        await this.sound!.setIsLoopingAsync(true);
        await this.sound!.playAsync();
        this.isPlaying = true;
        return true;
      }
    } catch (error) {
      console.error('Error playing shankh loop:', error);
    }
    return false;
  }

  /**
   * Pause the shankh sound loop
   */
  async pause() {
    if (!this.sound || !this.isLoaded) return false;
    try {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await this.sound.pauseAsync();
        this.isPlaying = false;
      }
      return true;
    } catch (error) {
      console.error('Error pausing shankh loop:', error);
      return false;
    }
  }

  /**
   * Stop and unload the shankh sound
   */
  async stop() {
    if (!this.sound) return;
    try {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await this.sound.stopAsync();
      }
      await this.sound.unloadAsync();
    } catch (error) {
      console.error('Error stopping shankh loop:', error);
    } finally {
      this.sound = null;
      this.isLoaded = false;
      this.isPlaying = false;
    }
  }

  getPlaying() {
    return this.isPlaying;
  }
}

export const ShankhService = new ShankhServiceClass();
