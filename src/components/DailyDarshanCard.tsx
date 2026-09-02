/**
 * Move 1 — the daily darshan card: every visit ends with prasad.
 *
 * Today's deity (festival-aware via dailyDarshan) + one wisdom line, with
 * save / share actions. The shared image is captured from an off-screen
 * ShareableCard-style layout so WhatsApp receives a composed devotional
 * card, not a screenshot. Deterministic per day — same card all day, on
 * every surface, on every device with the same tradition.
 *
 * After the FIRST save/share ever, this card asks once — and only once —
 * whether to ring the ārati bell daily (Move 2's discovery moment).
 */
import React, { useMemo, useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDailyDarshan } from '../services/dailyDarshan';
import { getFaithTheme } from '../data/faiths';
import { usePreferencesStore } from '../store/preferencesStore';
import { enableAratiBell } from '../services/notificationService';
import { track } from '../services/analytics';

const CARD_W = 360;
const CARD_H = 480;
const BELL_PROMPTED_KEY = 'dharma.bellPromptShown';

export const DailyDarshanCard: React.FC = () => {
  const primary = usePreferencesStore((s) => s.primaryTradition);
  const theme = getFaithTheme(primary);
  const daily = useMemo(() => getDailyDarshan(primary), [primary]);
  const captureRefView = useRef<View>(null);
  const [busy, setBusy] = useState<'save' | 'share' | null>(null);
  const [done, setDone] = useState<string | null>(null);

  React.useEffect(() => { track('darshan_card_view', { festival: daily.festival?.name }); }, []);

  const capture = async (): Promise<string | null> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { captureRef } = require('react-native-view-shot');
      return await captureRef(captureRefView, { format: 'png', quality: 1, result: 'tmpfile' });
    } catch { return null; }
  };

  const maybeOfferBell = async () => {
    try {
      const seen = await AsyncStorage.getItem(BELL_PROMPTED_KEY);
      if (seen) return;
      await AsyncStorage.setItem(BELL_PROMPTED_KEY, '1');
      Alert.alert(
        'Ring the ārati bell each morning?',
        "Today's darshan can arrive as a gentle notification at a time you choose. Opt-in, on this device only — change it any time in Settings.",
        [
          { text: 'Not now', style: 'cancel' },
          {
            // unified bell default: 07:00 everywhere (store default, Settings, sheet row)
            text: 'Ring at 7:00 am',
            onPress: async () => {
              const ok = await enableAratiBell('07:00', usePreferencesStore.getState().primaryTradition);
              if (ok) track('bell_optin', { hour: 7, from: 'card_prompt' });
            },
          },
        ],
      );
    } catch { /* never block the save on the prompt */ }
  };

  const save = async () => {
    if (busy) return;
    setBusy('save');
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch { /* noop */ }
    const uri = await capture();
    if (uri) {
      try {
        const perm = await MediaLibrary.requestPermissionsAsync(true);
        if (perm.granted) {
          await MediaLibrary.saveToLibraryAsync(uri);
          setDone('Saved to Photos — set it as your wallpaper from there 🪷');
          try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch { /* noop */ }
          track('darshan_card_save', { festival: daily.festival?.name });
          await maybeOfferBell();
        } else if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { mimeType: 'image/png' });
          track('darshan_card_share', { festival: daily.festival?.name, via: 'save_fallback' });
        }
      } catch { /* stay calm */ }
    }
    setBusy(null);
  };

  const share = async () => {
    if (busy) return;
    setBusy('share');
    const uri = await capture();
    try {
      if (uri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: "Share today's darshan" });
        track('darshan_card_share', { festival: daily.festival?.name });
        await maybeOfferBell();
      }
    } catch { /* user cancelled — fine */ }
    setBusy(null);
  };

  return (
    <View style={styles.wrap}>
      {/* visible card */}
      <View style={styles.card}>
        <ExpoImage source={daily.deity.image} style={StyleSheet.absoluteFill as any}
          contentFit="cover" contentPosition={{ top: '8%' }} transition={300} cachePolicy="memory-disk" />
        <LinearGradient colors={['rgba(2,6,23,0.05)', 'rgba(2,6,23,0.55)', 'rgba(2,6,23,0.96)']}
          locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
        <View style={styles.inner}>
          <Text style={[styles.kicker, { color: theme.accent }]}>
            🪔  {daily.reason.toUpperCase()}
          </Text>
          <Text style={styles.wisdom} numberOfLines={4}>“{daily.wisdom.text}”</Text>
          {!!daily.wisdom.source && (
            <Text style={[styles.source, { color: theme.accent }]}>— {daily.wisdom.source}</Text>
          )}
          <View style={styles.actions}>
            <Pressable style={[styles.btn, { backgroundColor: theme.accent }]} onPress={share} disabled={!!busy}>
              <Text style={styles.btnTxtDark}>{busy === 'share' ? '…' : 'Share'}</Text>
            </Pressable>
            <Pressable style={styles.btnGhost} onPress={save} disabled={!!busy}>
              <Text style={styles.btnTxt}>{busy === 'save' ? '…' : 'Save'}</Text>
            </Pressable>
          </View>
          {!!done && <Text style={styles.doneTxt}>{done}</Text>}
        </View>
      </View>

      {/* off-screen capture layout — deterministic pixels for the share sheet */}
      <View style={styles.offscreen} pointerEvents="none">
        <View ref={captureRefView} collapsable={false} style={styles.shot}>
          <Image source={daily.deity.image as any} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <LinearGradient colors={['rgba(2,6,23,0.15)', 'rgba(2,6,23,0.72)', '#020617']}
            locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
          <View style={styles.shotInner}>
            <View style={[styles.rule, { backgroundColor: theme.accent }]} />
            <Text style={styles.shotKicker}>{daily.reason}</Text>
            <Text style={styles.shotWisdom} numberOfLines={6}>“{daily.wisdom.text}”</Text>
            {!!daily.wisdom.source && (
              <Text style={[styles.shotSource, { color: theme.accent }]}>— {daily.wisdom.source}</Text>
            )}
            <Text style={styles.wordmark}>🪔  Dharma</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  card: {
    borderRadius: 20, overflow: 'hidden', aspectRatio: 0.86,
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.18)', backgroundColor: '#0f172a',
  },
  inner: { flex: 1, justifyContent: 'flex-end', padding: 18 },
  kicker: { fontSize: 11, letterSpacing: 1.3, fontWeight: '800', marginBottom: 8 },
  wisdom: { color: '#ffffff', fontSize: 18.5, lineHeight: 26, fontFamily: Platform.select({ ios: 'Playfair_Bold', default: undefined }), fontWeight: '700' },
  source: { fontSize: 12.5, fontStyle: 'italic', marginTop: 8 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  btn: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 12 },
  btnGhost: {
    flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(248,250,252,0.35)',
  },
  btnTxt: { color: '#f8fafc', fontWeight: '700', fontSize: 14.5 },
  btnTxtDark: { color: '#0b1220', fontWeight: '800', fontSize: 14.5 },
  doneTxt: { color: '#4ade80', fontSize: 12, marginTop: 10, textAlign: 'center' },
  offscreen: { position: 'absolute', left: -9999, top: 0 },
  shot: { width: CARD_W, height: CARD_H, backgroundColor: '#020617', overflow: 'hidden' },
  shotInner: { flex: 1, justifyContent: 'flex-end', padding: 24 },
  rule: { width: 44, height: 3, borderRadius: 2, marginBottom: 14, opacity: 0.9 },
  shotKicker: { color: '#cbd5e1', fontSize: 12.5, letterSpacing: 0.6, marginBottom: 8 },
  shotWisdom: { color: '#ffffff', fontSize: 21, lineHeight: 29, fontFamily: Platform.select({ ios: 'Playfair_Bold', default: undefined }), fontWeight: '700' },
  shotSource: { fontSize: 13, fontStyle: 'italic', marginTop: 10 },
  wordmark: { color: '#f8fafc', fontSize: 14, fontWeight: '800', letterSpacing: 1, marginTop: 18 },
});
