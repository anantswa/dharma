import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Stream-then-cache: resolve a remote audio URL to a playable URI. On native we
 * download once into the cache directory and reuse it (so repeat plays are instant
 * and work offline). On web (or any failure) we just return the remote URL and let
 * the player stream it. This is what keeps the app light — nothing is bundled.
 */
const dir = (FileSystem.cacheDirectory ?? '') + 'audio/';

function fileName(url: string): string {
  const tail = url.split('/').pop() || 'track.mp3';
  return tail.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function getPlayableUri(remoteUrl: string): Promise<string> {
  if (Platform.OS === 'web' || !FileSystem.cacheDirectory) return remoteUrl;
  try {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
    const local = dir + fileName(remoteUrl);
    const info = await FileSystem.getInfoAsync(local);
    if (info.exists && info.size && info.size > 0) return local;
    const res = await FileSystem.downloadAsync(remoteUrl, local);
    return res.uri || remoteUrl;
  } catch {
    return remoteUrl; // graceful fallback to streaming
  }
}
