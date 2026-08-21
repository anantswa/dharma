import { create } from 'zustand';
import type { WallpaperRow } from '../data/wallpaperPacks';

/**
 * Single shared wallpaper-catalog fetch — Today, Mandir, and Wallpapers all read
 * from here, so the catalog is fetched once per launch (and re-paints instantly
 * on later screens). No alive-flag races: state lives outside components.
 */
const CATALOG_URL =
  'https://dharmaweave.com/cdn/dharma-art/wallpapers/catalog.json';

type CatalogState = {
  wallpapers: WallpaperRow[];
  loaded: boolean;
  load: () => Promise<void>;
};

let inflight: Promise<void> | null = null;

export const useWallpaperCatalog = create<CatalogState>((set, get) => ({
  wallpapers: [],
  loaded: false,
  load: async () => {
    if (get().loaded || inflight) return inflight ?? Promise.resolve();
    inflight = fetch(CATALOG_URL)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.wallpapers)) set({ wallpapers: d.wallpapers, loaded: true });
      })
      .catch(() => {})
      .finally(() => { inflight = null; });
    return inflight;
  },
}));
