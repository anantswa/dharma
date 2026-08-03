import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * What the devotee owns. Persisted locally today; when IAP ships (build 12+)
 * `restore()` becomes the receipt-validation entry point and `grant()` is called
 * from the purchase callback. Screens only ask `owns(id)`, so the UI never
 * changes when the real store is wired.
 */
type OwnershipState = {
  owned: Record<string, boolean>;
  owns: (id: string) => boolean;
  grant: (id: string) => void;
  restoreAll: (ids: string[]) => void;
};

export const useOwnership = create<OwnershipState>()(
  persist(
    (set, get) => ({
      owned: {},
      owns: (id) => !!get().owned[id],
      grant: (id) => set((s) => ({ owned: { ...s.owned, [id]: true } })),
      restoreAll: (ids) =>
        set(() => ({ owned: Object.fromEntries(ids.map((i) => [i, true])) })),
    }),
    { name: '@dharma:ownership', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

/** True when a book can be opened right now. */
export function canRead(access: string, id: string, owned: Record<string, boolean>): boolean {
  if (access === 'free') return true;
  if (access === 'paid') return !!owned[id];
  return false; // 'soon'
}
