import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getFaithTheme } from '../data/faiths';
import { showIstaLine } from '../data/featured';
import { WALLPAPER_PACKS, packIdOf, packOrderForFaith } from '../data/wallpaperPacks';
import { usePreferencesStore } from '../store/preferencesStore';
import { useWallpaperCatalog } from '../store/wallpaperCatalogStore';
import { useIstaInterest } from '../store/istaInterestStore';
import { track } from '../services/analytics';

const { width: W } = Dimensions.get('window');
const CELL = (W - 20 * 2 - 12) / 2;

type Wallpaper = { id: string; title: string; tradition?: string; url: string; thumb: string };

/**
 * Darshan Wallpapers — free sacred lock-screen art, streamed from the catalog
 * (new drops appear with no app update). Full-screen preview → one-tap save to
 * Photos (falls back to the share sheet if permission is declined).
 */
export const WallpapersScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const theme = getFaithTheme(usePreferencesStore((s) => s.primaryTradition));
  const walls = useWallpaperCatalog((s) => s.wallpapers);
  const [open, setOpen] = useState<Wallpaper | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const istaNoted = useIstaInterest((s) => Object.keys(s.noted).length > 0);

  useEffect(() => {
    track('wallpapers_open');
    useWallpaperCatalog.getState().load();
  }, []);

  const save = async (w: Wallpaper) => {
    if (saving) return;
    setSaving(true);
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch { /* noop */ }
    try {
      const dest = `${FileSystem.cacheDirectory}${w.id}.jpg`;
      const dl = await FileSystem.downloadAsync(w.url, dest);
      const perm = await MediaLibrary.requestPermissionsAsync(true); // write-only access
      if (perm.granted) {
        await MediaLibrary.saveToLibraryAsync(dl.uri);
        setSavedId(w.id);
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch { /* noop */ }
        track('wallpaper_saved', { id: w.id });
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(dl.uri, { mimeType: 'image/jpeg' }); // fallback: share sheet → Save Image
        track('wallpaper_shared', { id: w.id });
      }
    } catch { /* network hiccup — stay calm */ }
    setSaving(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#020617', '#0b1220', '#020617']} style={StyleSheet.absoluteFill} />
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={16}>
          <Ionicons name="chevron-back" size={26} color="#e2e8f0" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
          <Text style={[styles.kicker, { color: theme.accent }]}>FREE · FOR YOUR LOCK SCREEN</Text>
          <Text style={styles.title}>Darshan Wallpapers</Text>
          <Text style={styles.sub}>Sacred art made for the phone — a one-second darshan, every time you look.</Text>
        </View>

        {walls.length === 0 && <Text style={styles.empty}>Loading wallpapers…</Text>}

        {packOrderForFaith(theme.key)
          .map((pid) => WALLPAPER_PACKS.find((p) => p.id === pid)!)
          .filter(Boolean)
          .map((pack) => {
          const items = walls.filter((w) => packIdOf(w) === pack.id);
          if (items.length === 0) return null;
          return (
            <View key={pack.id} style={{ marginTop: 18 }}>
              <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
                <Text style={styles.packName}>{pack.name}</Text>
                <Text style={styles.packBlurb}>{pack.blurb}</Text>
              </View>
              <View style={styles.grid}>
                {items.map((item) => (
                  <Pressable
                    key={item.id}
                    style={styles.cell}
                    onPress={() => { setSavedId(null); setOpen(item); try { Haptics.selectionAsync(); } catch { /* noop */ } }}
                  >
                    <ExpoImage source={{ uri: item.thumb }} style={styles.cellImg} contentFit="cover" transition={200} />
                    <Text style={styles.cellTitle} numberOfLines={1}>{item.title.replace(/^[^—]+—\s*/, '')}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })}

        {/* iṣṭa packs teaser — interest signal for the paid line (Hindu imagery → faith-gated) */}
        {walls.length > 0 && showIstaLine(theme.key) && (
          <Pressable
            style={styles.teaser}
            onPress={() => {
              track('wallpaper_pack_teaser_tap');
              try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch { /* noop */ }
              useIstaInterest.getState().note('teaser');
            }}
          >
            <Ionicons name={istaNoted ? 'checkmark-circle' : 'lock-closed'} size={16} color={theme.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.teaserTitle}>{istaNoted ? '🙏 Noted — opening soon' : 'Iṣṭa packs — coming soon'}</Text>
              <Text style={styles.teaserSub}>
                {istaNoted
                  ? 'Your interest shapes what we make first.'
                  : 'Hanuman · Mahadev · Krishna — tap to tell us you want them'}
              </Text>
            </View>
          </Pressable>
        )}
      </ScrollView>

      {/* full-screen preview */}
      <Modal visible={!!open} animationType="fade" onRequestClose={() => setOpen(null)}>
        {open && (
          <View style={styles.previewWrap}>
            <ExpoImage source={{ uri: open.url }} style={StyleSheet.absoluteFill as any} contentFit="cover" transition={250} />
            {/* faux lock-screen clock so you see it as a wallpaper */}
            <View style={styles.clockWrap} pointerEvents="none">
              <Text style={styles.clockTime}>9:41</Text>
              <Text style={styles.clockDate}>Tuesday, October 20</Text>
            </View>
            <LinearGradient colors={['transparent', 'rgba(2,6,23,0.75)']} style={styles.previewFade} />
            <Pressable style={styles.closeBtn} onPress={() => setOpen(null)} hitSlop={12}>
              <Ionicons name="close" size={24} color="#f8fafc" />
            </Pressable>
            <View style={styles.previewBottom}>
              <Text style={styles.previewTitle}>{open.title}</Text>
              <Pressable
                style={[styles.saveBtn, { backgroundColor: theme.accent }, saving && { opacity: 0.6 }]}
                disabled={saving}
                onPress={() => save(open)}
              >
                <Ionicons name={savedId === open.id ? 'checkmark' : 'download'} size={18} color="#0b1220" />
                <Text style={styles.saveTxt}>
                  {savedId === open.id ? 'Saved to Photos' : saving ? 'Saving…' : 'Save wallpaper'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  topBar: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 6 },
  kicker: { fontSize: 11, letterSpacing: 2, fontWeight: '800' },
  title: { fontSize: 30, color: '#f8fafc', fontFamily: 'Playfair_Bold', marginTop: 4 },
  sub: { fontSize: 13.5, color: '#94a3b8', marginTop: 6, lineHeight: 20 },
  empty: { color: '#64748b', textAlign: 'center', marginTop: 60 },
  packName: { fontSize: 20, color: '#f8fafc', fontFamily: 'Playfair_Bold' },
  packBlurb: { fontSize: 12.5, color: '#94a3b8', marginTop: 3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20 },
  teaser: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 22, marginHorizontal: 20,
    padding: 16, borderRadius: 16, backgroundColor: 'rgba(15,23,42,0.75)',
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.25)',
  },
  teaserTitle: { color: '#f1f5f9', fontSize: 14.5, fontWeight: '700' },
  teaserSub: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  cell: { width: CELL, marginBottom: 16 },
  cellImg: { width: CELL, height: CELL * 1.9, borderRadius: 18, backgroundColor: 'rgba(15,23,42,0.6)' },
  cellTitle: { color: '#cbd5e1', fontSize: 12.5, marginTop: 8, textAlign: 'center' },
  previewWrap: { flex: 1, backgroundColor: '#000' },
  clockWrap: { position: 'absolute', top: 74, left: 0, right: 0, alignItems: 'center', opacity: 0.92 },
  clockTime: { color: '#f8fafc', fontSize: 76, fontWeight: '300', letterSpacing: 1 },
  clockDate: { color: 'rgba(248,250,252,0.85)', fontSize: 16, marginTop: -4 },
  previewFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 200 },
  closeBtn: {
    position: 'absolute', top: 54, right: 16, width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(2,6,23,0.55)',
  },
  previewBottom: { position: 'absolute', bottom: 44, left: 24, right: 24, alignItems: 'center', gap: 12 },
  previewTitle: { color: '#f1f5f9', fontSize: 16, fontFamily: 'Playfair_Bold' },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 999, paddingVertical: 13, paddingHorizontal: 26,
  },
  saveTxt: { color: '#0b1220', fontSize: 15, fontWeight: '800' },
});
