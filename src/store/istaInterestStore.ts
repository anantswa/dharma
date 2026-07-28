import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Iṣṭa-pack interest — persisted per pack, so "🙏 Noted" survives relaunch and
 * the pre-IAP demand signal is honest. Analytics carries the durable event;
 * this store carries the user-facing state.
 */
type IstaInterestState = {
  noted: Record<string, boolean>;
  note: (pack: string) => void;
};

export const useIstaInterest = create<IstaInterestState>()(
  persist(
    (set) => ({
      noted: {},
      note: (pack) => set((s) => ({ noted: { ...s.noted, [pack]: true } })),
    }),
    { name: '@dharma:ista-interest', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
