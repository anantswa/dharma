/**
 * The Wisdom strip — the darshan card's in-app remnant on Today (IA reorg §4).
 *
 * A ~64pt line: 40×40 deity thumb · today's wisdom · 🪔. One pressable, min
 * 48pt tap target; at fontScale ≥ 1.15 it becomes a two-line ~84pt variant
 * instead of truncating harder. Tap → DarshanSheet (full card, Save/Share) —
 * share stays two taps.
 *
 * First-run affordance: until the sheet has been opened once, a small 🔔 pip
 * sits on the thumb and a one-time sub-line invites the tap. Gentle and
 * self-extinguishing (AsyncStorage flag, mirrors the BELL_PROMPTED_KEY
 * pattern) — never a badge that nags.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { PixelRatio, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image as ExpoImage } from 'expo-image';
import { getDailyDarshan } from '../services/dailyDarshan';
import { getFaithTheme } from '../data/faiths';
import { track } from '../services/analytics';
import { usePreferencesStore } from '../store/preferencesStore';
import { DarshanSheet } from './DarshanSheet';

const SHEET_OPENED_KEY = 'dharma.darshanSheetOpened';

export const WisdomStrip: React.FC = () => {
  const primary = usePreferencesStore((s) => s.primaryTradition);
  const theme = getFaithTheme(primary);
  const daily = useMemo(() => getDailyDarshan(primary), [primary]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [firstRun, setFirstRun] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SHEET_OPENED_KEY)
      .then((seen) => setFirstRun(!seen))
      .catch(() => {});
  }, []);

  // median user is 40+, mid-range Android, large system fonts — two lines, not harder truncation
  const bigType = PixelRatio.getFontScale() >= 1.15;

  const openSheet = () => {
    track('darshan_strip_tap');
    setSheetOpen(true);
    if (firstRun) {
      setFirstRun(false);
      AsyncStorage.setItem(SHEET_OPENED_KEY, '1').catch(() => {});
    }
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.strip, bigType && styles.stripBig, pressed && { opacity: 0.85 }]}
        hitSlop={6}
        onPress={openSheet}
        accessibilityRole="button"
        accessibilityLabel={`Today's wisdom — ${daily.wisdom.text}. Opens darshan card.`}
      >
        <View>
          <ExpoImage
            source={daily.deity.image}
            style={styles.thumb}
            contentFit="cover"
            contentPosition={{ top: '10%' }}
            transition={200}
          />
          {firstRun && (
            <View style={[styles.pip, { borderColor: theme.accent }]}>
              <Text style={styles.pipTxt}>🔔</Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.quote} numberOfLines={bigType ? 2 : 1}>“{daily.wisdom.text}”</Text>
          {firstRun && (
            <Text style={[styles.hint, { color: theme.accent }]}>tap for today’s darshan card</Text>
          )}
        </View>
        <Text style={styles.diya}>🪔</Text>
      </Pressable>
      <DarshanSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
};

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48,
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.18)',
    backgroundColor: 'rgba(15,23,42,0.5)', borderRadius: 16,
    paddingHorizontal: 12, paddingVertical: 12, marginBottom: 16,
  },
  stripBig: { minHeight: 84 },
  thumb: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#0b1220' },
  pip: {
    position: 'absolute', top: -5, right: -5, width: 18, height: 18, borderRadius: 9,
    borderWidth: 1, backgroundColor: 'rgba(2,6,23,0.9)', alignItems: 'center', justifyContent: 'center',
  },
  pipTxt: { fontSize: 9 },
  quote: { color: '#f1f5f9', fontSize: 14, fontFamily: 'Playfair_Bold', lineHeight: 19 },
  hint: { fontSize: 11, fontWeight: '700', marginTop: 3 },
  diya: { fontSize: 16 },
});
