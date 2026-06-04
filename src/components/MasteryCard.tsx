import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

export const MCARD_W = 360;
export const MCARD_H = 480;

type Props = {
  /** Devanagari verse just learned. */
  sanskrit: string;
  /** e.g. "चौपाई ५" */
  titleHi: string;
  /** Streamed URL of this verse's illustrated painting (falls back to bundled art). */
  artUrl?: string;
};

/**
 * The shareable reward you earn when a verse becomes "by heart" — the verse's own
 * illustrated painting + wordmark. Rendered off-screen and captured for WhatsApp/IG
 * (the viral loop). Self-contained styling so the captured pixels are deterministic.
 */
export const MasteryCard = React.forwardRef<View, Props>(({ sanskrit, titleHi, artUrl }, ref) => (
  <View ref={ref} collapsable={false} style={styles.card}>
    <Image
      source={artUrl ? { uri: artUrl } : require('../../assets/images/deities/hanuman_sunset.jpg')}
      style={StyleSheet.absoluteFill}
      resizeMode="cover"
    />
    <LinearGradient
      colors={['rgba(2,6,23,0.25)', 'rgba(2,6,23,0.7)', '#020617']}
      locations={[0, 0.5, 1]}
      style={StyleSheet.absoluteFill}
    />
    <View style={styles.inner}>
      <Text style={styles.kicker}>🪔  LEARNED BY HEART</Text>
      <Text style={styles.title}>{titleHi}</Text>
      <View style={styles.rule} />
      <Text style={styles.verse} numberOfLines={4}>{sanskrit}</Text>
      <View style={styles.footer}>
        <Text style={styles.wordmark}>Hanuman Chalisa · Dharma</Text>
      </View>
    </View>
  </View>
));

MasteryCard.displayName = 'MasteryCard';

const styles = StyleSheet.create({
  card: { width: MCARD_W, height: MCARD_H, backgroundColor: '#020617', overflow: 'hidden' },
  inner: { flex: 1, justifyContent: 'flex-end', padding: 26 },
  kicker: { color: '#fbbf24', fontSize: 12, letterSpacing: 2, fontWeight: '800', marginBottom: 10 },
  title: { color: '#f8fafc', fontSize: 22, fontFamily: 'Playfair_Bold' },
  rule: { width: 44, height: 3, borderRadius: 2, backgroundColor: '#fbbf24', marginVertical: 14, opacity: 0.9 },
  verse: { color: '#f1f5f9', fontSize: 19, fontFamily: 'Playfair_Medium', lineHeight: 30 },
  footer: { marginTop: 22 },
  wordmark: { color: '#cbd5e1', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
});
