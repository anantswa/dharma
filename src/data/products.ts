/**
 * Monetization catalog — the layered SKUs from agent-framework/PRODUCT_SPEC.md.
 *
 * `storeId` is the platform product id (Google Play / App Store) to wire into
 * react-native-iap / RevenueCat. The paywall is presentational; the purchase call
 * lives in the IAP layer. Prices here are display strings (the store is the source
 * of truth for real localized pricing).
 */
export type BillingPeriod = 'month' | 'year' | 'lifetime' | 'one-time';

export interface DharmaProduct {
  id: string;
  storeId: string;
  title: string;
  price: string;
  period: BillingPeriod;
  tagline: string;
  /** Visually featured tier on the paywall. */
  featured?: boolean;
  /** Small ribbon, e.g. "Best value". */
  badge?: string;
}

/** Dharma+ subscription — the primary recurring tier. */
export const DHARMA_PLUS: DharmaProduct[] = [
  {
    id: 'plus_yearly',
    storeId: 'dharma_plus_yearly',
    title: 'Dharma+ Yearly',
    price: '$39.99 / yr',
    period: 'year',
    tagline: 'Everything, all year. ~$3.33/mo.',
    featured: true,
    badge: 'Best value',
  },
  {
    id: 'plus_monthly',
    storeId: 'dharma_plus_monthly',
    title: 'Dharma+ Monthly',
    price: '$4.99 / mo',
    period: 'month',
    tagline: 'Full access, cancel anytime.',
  },
  {
    id: 'lifetime',
    storeId: 'dharma_premium_lifetime',
    title: 'Temple Maintenance',
    price: '$49 once',
    period: 'lifetime',
    tagline: 'Pay once. Support the temple forever.',
  },
];

/** What Dharma+ unlocks — shown as the value list on the paywall. */
export const PLUS_BENEFITS: string[] = [
  'Sacred narration of every teaching (ElevenLabs voices)',
  'Background audio — mantras while your phone is locked',
  'The full graphic-novel & film library, read natively',
  'All traditions, all darshan art, offline',
  'No interruptions — just devotion',
];

/** Virtual offerings (consumables) — impulse devotional micro-purchases. */
export interface Offering {
  id: string;
  storeId: string;
  emoji: string;
  title: string;
  price: string;
}
export const OFFERINGS: Offering[] = [
  { id: 'lamp', storeId: 'offering_lamp', emoji: '🪔', title: 'Light a lamp', price: '$0.99' },
  { id: 'flowers', storeId: 'offering_flowers', emoji: '🌸', title: 'Offer flowers', price: '$1.99' },
  { id: 'shankh', storeId: 'offering_shankh', emoji: '🐚', title: 'Sponsor a shankh', price: '$4.99' },
];
