import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * PreferencesStore - User preferences and onboarding state
 * Persists tradition filters, reminder settings, and onboarding status
 */

export type TraditionKey = 'Hindu' | 'Sikh' | 'Buddhist' | 'Jain' | 'Zen' | 'Christian' | 'Sufi';

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
};

const DEFAULT_TRADITIONS: Record<TraditionKey, boolean> = {
  Hindu: true,
  Sikh: true,
  Buddhist: true,
  Jain: true,
  Zen: true,
  Christian: true,
  Sufi: true,
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
      
      hasCompletedOnboarding: false,
      primaryTradition: undefined,
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
  
  if (lower.includes('hindu') || lower.includes('vedanta') || lower.includes('gita')) return 'Hindu';
  if (lower.includes('sikh') || lower.includes('gurbani')) return 'Sikh';
  if (lower.includes('buddh')) return 'Buddhist';
  if (lower.includes('jain')) return 'Jain';
  if (lower.includes('zen')) return 'Zen';
  if (lower.includes('christian') || lower.includes('bible') || lower.includes('catholic') || lower.includes('orthodox') || lower.includes('protestant')) return 'Christian';
  if (lower.includes('sufi') || lower.includes('rumi') || lower.includes('hafiz') || lower.includes('islamic')) return 'Sufi';

  return null;
};

// CRITICAL: This must have 'export'
export const isTraditionEnabled = (
  tradition: string | undefined,
  enabledTraditions: Record<TraditionKey, boolean>
): boolean => {
  const key = normalizeTraditionLabel(tradition);
  if (!key) return true;
  return enabledTraditions[key] ?? true;
};