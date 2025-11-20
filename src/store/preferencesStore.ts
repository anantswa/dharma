// src/store/preferencesStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TraditionKey = 'Hindu' | 'Sikh' | 'Buddhist' | 'Jain' | 'Zen';

type PreferencesState = {
  enabledTraditions: Record<TraditionKey, boolean>;
  toggleTradition: (key: TraditionKey) => void;
  resetTraditions: () => void;
};

const DEFAULT_TRADITIONS: Record<TraditionKey, boolean> = {
  Hindu: true,
  Sikh: true,
  Buddhist: true,
  Jain: true,
  Zen: true,
};

// CRITICAL: This must have 'export'
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
  
  return null;
};

// CRITICAL: This must have 'export'
export const isTraditionEnabled = (tradition?: string): boolean => {
  const key = normalizeTraditionLabel(tradition);
  if (!key) return true;
  const { enabledTraditions } = usePreferencesStore.getState();
  return enabledTraditions[key] ?? true;
};