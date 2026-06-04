/**
 * Display names for the two narrator voices.
 * Internal keys stay 'kuber'/'shardul' (= ElevenLabs voice ids); only labels change here.
 *   kuber   → the deep elder voice  → "Agastya" (Vedic rishi)
 *   shardul → the young voice        → "Nachiketa" (young seeker of the Katha Upanishad)
 */
export const NARRATORS: Record<'kuber' | 'shardul', string> = {
  kuber: 'Agastya',
  shardul: 'Nachiketa',
};
