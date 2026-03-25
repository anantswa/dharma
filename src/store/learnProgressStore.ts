import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

/**
 * LearnProgressStore - Manages learning progress for Hanuman Chalisa lessons
 * Persists completed lessons to AsyncStorage
 */

interface LearnProgressState {
  completedLessons: string[];
  currentLesson: string | null;
  isLoading: boolean;
  
  markLessonComplete: (lessonId: string) => Promise<void>;
  markLessonIncomplete: (lessonId: string) => Promise<void>;
  setCurrentLesson: (lessonId: string | null) => void;
  loadProgress: () => Promise<void>;
  resetProgress: () => Promise<void>;
}

const STORAGE_KEY = '@dharma:learn_progress';

export const useLearnProgressStore = create<LearnProgressState>((set, get) => ({
  completedLessons: [],
  currentLesson: null,
  isLoading: true,

  markLessonComplete: async (lessonId: string) => {
    const { completedLessons } = get();
    
    if (!completedLessons.includes(lessonId)) {
      const updated = [...completedLessons, lessonId];
      set({ completedLessons: updated });
      
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save progress:', error);
      }
    }
  },

  markLessonIncomplete: async (lessonId: string) => {
    const { completedLessons } = get();
    
    if (completedLessons.includes(lessonId)) {
      const updated = completedLessons.filter(id => id !== lessonId);
      set({ completedLessons: updated });
      
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to update progress:', error);
      }
    }
  },

  setCurrentLesson: (lessonId: string | null) => {
    set({ currentLesson: lessonId });
  },

  loadProgress: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const completedLessons = JSON.parse(stored);
        set({ completedLessons, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
      set({ isLoading: false });
    }
  },

  resetProgress: async () => {
    set({ completedLessons: [], currentLesson: null });
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to reset progress:', error);
    }
  },
}));
