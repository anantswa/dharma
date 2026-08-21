import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Noticeboard — announcements streamed from config/noticeboard.json (post by
 * editing the file, no app release). `dismissed` remembers which notice ids the
 * user has waved away on Today.
 */
const BOARD_URL =
  'https://dharmaweave.com/cdn/dharma-art/config/noticeboard.json';

export type Notice = { id: string; date: string; title: string; body: string };

type NoticeboardState = {
  notices: Notice[];
  dismissed: Record<string, boolean>;
  load: () => Promise<void>;
  dismiss: (id: string) => void;
};

let inflight: Promise<void> | null = null;

export const useNoticeboard = create<NoticeboardState>()(
  persist(
    (set, get) => ({
      notices: [],
      dismissed: {},
      load: async () => {
        if (inflight) return inflight;
        inflight = fetch(BOARD_URL)
          .then((r) => r.json())
          .then((d) => {
            if (Array.isArray(d?.notices)) set({ notices: d.notices });
          })
          .catch(() => {})
          .finally(() => { inflight = null; });
        return inflight;
      },
      dismiss: (id) => set((s) => ({ dismissed: { ...s.dismissed, [id]: true } })),
    }),
    {
      name: '@dharma:noticeboard',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ dismissed: s.dismissed }) as any,
    },
  ),
);
