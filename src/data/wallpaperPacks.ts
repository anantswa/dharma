/**
 * Wallpaper pack registry — single source of truth for pack ids, display, and
 * faith-led ordering. Catalog rows carry `tradition` = pack id (case-insensitive,
 * legacy values aliased).
 */
export type WallpaperRow = { id: string; title: string; tradition?: string; url: string; thumb: string };

export const WALLPAPER_PACKS: { id: string; name: string; blurb: string }[] = [
  { id: 'devas', name: 'Deity Darshan', blurb: 'Your beloved deities — Hanuman, Shiva, Devi, Krishna' },
  { id: 'sanctum', name: 'Sanctum', blurb: 'God through place — temples under vast night skies' },
  { id: 'garden', name: 'Sacred Garden', blurb: 'Signs of the divine — lotus, moon, flame, river' },
  { id: 'stillness', name: 'Stillness', blurb: 'The Buddha at rest' },
];

const ALIASES: Record<string, string> = { zen: 'stillness', buddhist: 'stillness' };

/** Normalize a catalog `tradition` value to a canonical pack id. */
export function packIdOf(row: { tradition?: string }): string {
  const t = (row.tradition ?? '').toLowerCase();
  return ALIASES[t] ?? t;
}

/**
 * Pack display order for a faith — your own tradition's imagery leads.
 * Packs absent from a faith's list are hidden for that faith (tradition purity:
 * the Hindu deity pack never renders for a Buddhist user).
 */
export function packOrderForFaith(faithKey?: string): string[] {
  return faithKey === 'Buddhist'
    ? ['stillness', 'garden', 'sanctum']
    : ['devas', 'sanctum', 'garden', 'stillness'];
}

/** Sort catalog rows into faith-led pack order (unknown packs last, stable). */
export function sortWallpapersForFaith(rows: WallpaperRow[], faithKey?: string, istaName?: string): WallpaperRow[] {
  const order = packOrderForFaith(faithKey);
  const rank = (r: WallpaperRow) => {
    const i = order.indexOf(packIdOf(r));
    return i === -1 ? order.length : i;
  };
  // The iṣṭa's own images lead the rail — "my temple" before the gallery.
  const ista = (istaName ?? '').toLowerCase().split(' ').pop() ?? '';
  const istaRank = (r: WallpaperRow) =>
    ista && (r.id.toLowerCase().includes(ista) || r.title.toLowerCase().includes(ista)) ? 0 : 1;
  return [...rows].sort((a, b) => (istaRank(a) - istaRank(b)) || (rank(a) - rank(b)));
}
