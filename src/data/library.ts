/**
 * The in-app library — books readable inside the panel-native reader.
 *
 * Streamed from `kathas/catalog.json`, so new titles appear with no app release.
 * Each katha carries an `access` field:
 *   'free'   — open to everyone (the temple gives freely)
 *   'paid'   — requires a one-time purchase; unlocked via the ownership store
 *   'soon'   — visible as a teaser, not yet readable
 *
 * DESIGN LAW (App Store 3.1.1): paid titles are sold through IAP and read
 * in-app. We never link out to buy digital goods on iOS.
 */
export type BookAccess = 'free' | 'paid' | 'soon';

export type LibraryBook = {
  id: string;
  /** Which tradition's shelf this belongs on; absent = shown to everyone. */
  faith?: 'Hindu' | 'Buddhist';
  title: string;
  subtitle?: string;
  blurb?: string;
  cover?: string;
  access: BookAccess;
  /** IAP product id — wired when the paid tier ships (build 12+). */
  productId?: string;
  /** Display price, informational only; the store is the source of truth. */
  price?: string;
  sceneCount: number;
};

const CATALOG_URL =
  'https://dharmaweave.com/cdn/dharma-art/kathas/catalog.json';

/** Shelf filter: a Buddhist reader must not find Hindu books under a Vihāra
 * header (the day-2 churn we measured). Untagged books show to everyone. */
export function booksForFaith(books: LibraryBook[], faith?: string | null): LibraryBook[] {
  if (!faith) return books;
  return books.filter((b) => !b.faith || b.faith === faith);
}

export async function fetchLibrary(): Promise<LibraryBook[]> {
  const res = await fetch(CATALOG_URL);
  const data = await res.json();
  const kathas = Array.isArray(data?.kathas) ? data.kathas : [];
  return kathas
    .filter((k: any) => k?.scroll?.scenes?.length)
    .map((k: any) => ({
      id: k.id,
      title: k.title,
      subtitle: k.subtitle,
      blurb: k.blurb,
      cover: k.cover ?? k.scroll.scenes[0]?.img,
      access: (k.access as BookAccess) ?? 'free',
      faith: k.faith,
      productId: k.productId,
      price: k.price,
      sceneCount: k.scroll.scenes.length,
    }));
}
