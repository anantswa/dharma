import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * PreferencesStore - User preferences and onboarding state
 * Persists tradition filters, reminder settings, and onboarding status
 */

export type TraditionKey = 'Hindu' | 'Buddhist';

type PreferencesState = {
  enabledTraditions: Record<TraditionKey, boolean>;
  toggleTradition: (key: TraditionKey) => void;
  resetTraditions: () => void;
  
  hasCompletedOnboarding: boolean;
  primaryTradition?: TraditionKey;
  remindersEnabled: boolean;
  reminderTime: string;
  setOnboarding: (data: {
    primaryTradition: TraditionKey;
    remindersEnabled: boolean;
  }) => void;
  setReminderTime: (time: string) => void;
  toggleReminders: (enabled: boolean) => void;

  // Voice + language preferences
  meaningLang: 'hi' | 'en';
  narrator: 'kuber' | 'shardul';
  setMeaningLang: (l: 'hi' | 'en') => void;
  setNarrator: (n: 'kuber' | 'shardul') => void;
};

const DEFAULT_TRADITIONS: Record<TraditionKey, boolean> = {
  Hindu: true,
  Buddhist: true,
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      enabledTraditions: DEFAULT_TRADITIONS,
      toggleTradition: (key) =>
        set((state) => ({
          enabledTraditions: {
            ...state.enabledTraditions,
            [key]: !state.enabledTraditions[key],
          },
        })),
      resetTraditions: () => set({ enabledTraditions: DEFAULT_TRADITIONS }),
      
      // No faith picker at launch — assume a Hindu-primary experience with
      // Buddhist content included (shown toward the end of the darshan).
      hasCompletedOnboarding: true,
      primaryTradition: 'Hindu',
      remindersEnabled: false,
      reminderTime: '07:00', // Default 7:00 AM
      setOnboarding: (data) =>
        set({
          hasCompletedOnboarding: true,
          primaryTradition: data.primaryTradition,
          remindersEnabled: data.remindersEnabled,
        }),
      setReminderTime: (time) => set({ reminderTime: time }),
      toggleReminders: (enabled) => set({ remindersEnabled: enabled }),

      meaningLang: 'hi',
      narrator: 'kuber',
      setMeaningLang: (l) => set({ meaningLang: l }),
      setNarrator: (n) => set({ narrator: n }),
    }),
    {
      name: 'dharma-preferences',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

// --- Helpers ---

const normalizeTraditionLabel = (tradition?: string): TraditionKey | null => {
  if (!tradition) return null;
  const lower = tradition.toLowerCase();

  if (
    lower.includes('hindu') || lower.includes('vedanta') || lower.includes('gita') ||
    lower.includes('upanishad') || lower.includes('purana') || lower.includes('veda') ||
    lower.includes('yoga') || lower.includes('ramayan')
  ) return 'Hindu';
  if (lower.includes('buddh') || lower.includes('zen') || lower.includes('dhamma')) return 'Buddhist';

  return null;
};

// Content outside the two focus faiths (Christian/Sikh/Jain/Sufi/…) is excluded.
// CRITICAL: This must have 'export'
export const isTraditionEnabled = (
  tradition: string | undefined,
  enabledTraditions: Record<TraditionKey, boolean>
): boolean => {
  const key = normalizeTraditionLabel(tradition);
  if (!key) return false; // not Hindu or Buddhist → not shown
  return enabledTraditions[key] ?? true;
};