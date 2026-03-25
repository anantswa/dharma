// src/store/premiumStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const PREMIUM_KEY = '@dharma:isPremium';

type PremiumStore = {
  isPremium: boolean;
  isLoading: boolean;
  setPremium: (value: boolean) => Promise<void>;
  loadPremiumCache: () => Promise<void>;
};

export const usePremiumStore = create<PremiumStore>((set) => ({
  isPremium: false,
  isLoading: true,

  setPremium: async (value: boolean) => {
    try {
      await AsyncStorage.setItem(PREMIUM_KEY, value ? 'true' : 'false');
      set({ isPremium: value });
      console.log('💎 Premium status saved:', value);
    } catch (error) {
      console.error('❌ Failed to save premium status:', error);
    }
  },

  loadPremiumCache: async () => {
    try {
      const cached = await AsyncStorage.getItem(PREMIUM_KEY);
      const isPremium = cached === 'true';
      set({ isPremium, isLoading: false });
      console.log('💎 Premium cache loaded:', isPremium);
    } catch (error) {
      console.error('❌ Failed to load premium cache:', error);
      set({ isLoading: false });
    }
  },
}));
