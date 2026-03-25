import { create } from 'zustand';

/**
 * MusicStore - Global state management for music player
 * Manages playback state, track info, and UI state
 */

export type MusicState = {
  // Playback state
  isPlaying: boolean;
  currentTrackId: string | null;
  currentPosition: number;
  duration: number;
  
  // UI state
  isBottomSheetOpen: boolean;
  
  // Actions
  setIsPlaying: (playing: boolean) => void;
  setCurrentTrack: (trackId: string | null) => void;
  setCurrentPosition: (position: number) => void;
  setDuration: (duration: number) => void;
  setBottomSheetOpen: (open: boolean) => void;
  reset: () => void;
};

export const useMusicStore = create<MusicState>((set) => ({
  // Initial state
  isPlaying: false,
  currentTrackId: null,
  currentPosition: 0,
  duration: 0,
  isBottomSheetOpen: false,
  
  // Actions
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTrack: (trackId) => set({ currentTrackId: trackId }),
  setCurrentPosition: (position) => set({ currentPosition: position }),
  setDuration: (duration) => set({ duration: duration }),
  setBottomSheetOpen: (open) => set({ isBottomSheetOpen: open }),
  reset: () => set({ 
    isPlaying: false, 
    currentTrackId: null, 
    currentPosition: 0,
    duration: 0,
  }),
}));
