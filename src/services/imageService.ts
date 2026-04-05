/**
 * Image service — matches wisdom entries to images from the image_library.
 *
 * Images are stored in GCS/Supabase Storage. The app fetches URLs from
 * the image_library table and loads them on-demand via expo-image's
 * built-in disk cache. No images are bundled in the app binary.
 */

import type { ImageEntry } from '../types/supabase';
import { supabaseQuery } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const IMAGES_CACHE_KEY = '@dharma:images_cache';
const SUPABASE_STORAGE_BASE = 'https://aiwugigdrvijjeoqtpog.supabase.co/storage/v1/object/public/dharma-images';

let cachedImages: ImageEntry[] = [];

/**
 * Load image index from Supabase (or cache).
 * Only fetches the metadata (URLs + tags), not the actual image bytes.
 * Images are served from Supabase Storage (dharma-images bucket).
 */
export async function loadImageIndex(): Promise<void> {
  // Try cache first
  try {
    const cached = await AsyncStorage.getItem(IMAGES_CACHE_KEY);
    if (cached) {
      cachedImages = JSON.parse(cached);
      if (cachedImages.length > 0) return;
    }
  } catch (e) {
    // ignore cache errors
  }

  // Fetch from Supabase
  try {
    const fields = 'id,file_url,thumbnail_url,tradition,source_text,primary_figure,mood,scene_description,tags,orientation';
    const images = await supabaseQuery<ImageEntry>(
      'image_library',
      `select=${fields}&available=eq.true&order=created_at.desc&limit=500`,
    );
    cachedImages = images;
    await AsyncStorage.setItem(IMAGES_CACHE_KEY, JSON.stringify(images));
  } catch (error) {
    console.error('[ImageService] Failed to load image index:', error);
  }
}

/**
 * Check if a URL points to Supabase Storage (web-accessible).
 * Local drive paths (G:\...) are not usable by the mobile app.
 */
function isWebUrl(url: string | null): boolean {
  return !!url && (url.startsWith('http://') || url.startsWith('https://'));
}

/**
 * Get the best available image URL for an entry.
 * Prefers Supabase Storage URLs. Falls back to null for local paths.
 */
export function getImageUrl(entry: ImageEntry | null, size: 'full' | 'thumb' = 'full'): string | null {
  if (!entry) return null;
  const url = size === 'thumb' ? (entry.thumbnail_url || entry.file_url) : entry.file_url;
  return isWebUrl(url) ? url : null;
}

/**
 * Find the best matching image for a wisdom entry.
 *
 * Matching priority:
 * 1. Same source_text (e.g. "Bhagavad Gita" matches images from BG)
 * 2. Same tradition + mood
 * 3. Same tradition
 * 4. Any image (random)
 */
export function findImageForWisdom(
  tradition?: string | null,
  sourceText?: string | null,
  mood?: string | null,
  wisdomId?: string,
): ImageEntry | null {
  if (cachedImages.length === 0) return null;

  // Deterministic "random" based on wisdom ID (consistent per entry)
  const hash = wisdomId ? simpleHash(wisdomId) : Math.floor(Math.random() * 10000);

  // Priority 1: Match source_text
  if (sourceText) {
    const sourceMatch = cachedImages.filter(
      (img) => img.source_text && sourceText.toLowerCase().includes(img.source_text.toLowerCase()),
    );
    if (sourceMatch.length > 0) return sourceMatch[hash % sourceMatch.length];
  }

  // Priority 2: Match tradition + mood
  if (tradition && mood) {
    const tradMoodMatch = cachedImages.filter(
      (img) => img.tradition === tradition.toLowerCase() && img.mood === mood,
    );
    if (tradMoodMatch.length > 0) return tradMoodMatch[hash % tradMoodMatch.length];
  }

  // Priority 3: Match tradition
  if (tradition) {
    const tradMatch = cachedImages.filter(
      (img) => img.tradition === tradition.toLowerCase(),
    );
    if (tradMatch.length > 0) return tradMatch[hash % tradMatch.length];
  }

  // Fallback: any image
  return cachedImages[hash % cachedImages.length];
}

/**
 * Get a list of images for a tradition (for carousel/gallery views).
 */
export function getImagesForTradition(tradition: string, limit: number = 10): ImageEntry[] {
  return cachedImages
    .filter((img) => img.tradition === tradition.toLowerCase())
    .slice(0, limit);
}

/** Simple string hash for deterministic image selection */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}
