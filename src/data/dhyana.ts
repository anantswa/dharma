import bundledCatalog from './dhyanaCatalog.json';

/**
 * Dhyāna — the meditation room's catalog. The CDN JSON is the mutable pointer
 * (5-min cache); the MP3 URLs inside it are versioned and immutable. The
 * catalog shipped with the binary is the offline/failure fallback, same
 * posture as the wisdom core: the room always opens, even in airplane mode.
 */

export type DhyanaTrack = {
  id: string;
  order: number;
  title: string;
  sanskrit: string;
  collection: string;
  minutes: number;
  voice: string;
  line: string;
  url: string;
  sleep?: boolean;
};

export const DHYANA_CATALOG_URL =
  'https://dharmaweave.com/cdn/dharma-audio/dhyana/catalog.json';

const byOrder = (tracks: DhyanaTrack[]) =>
  [...tracks].sort((a, b) => a.order - b.order);

export const BUNDLED_DHYANA_TRACKS: DhyanaTrack[] = byOrder(
  (bundledCatalog.tracks ?? []) as DhyanaTrack[],
);

/** Live catalog, falling back to the bundled copy on any failure. */
export async function fetchDhyanaTracks(): Promise<DhyanaTrack[]> {
  try {
    const res = await fetch(DHYANA_CATALOG_URL);
    const data = await res.json();
    if (Array.isArray(data?.tracks) && data.tracks.length > 0) {
      return byOrder(data.tracks as DhyanaTrack[]);
    }
  } catch { /* offline or CDN hiccup — the bundled room below */ }
  return BUNDLED_DHYANA_TRACKS;
}
