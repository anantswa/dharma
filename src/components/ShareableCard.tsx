import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { deitiesForFaith, getFaithTheme } from '../data/faiths';

export const CARD_W = 360;
export const CARD_H = 480;

type Props = {
  wisdom: any;
  faith?: string | null;
};

/**
 * The image that gets shared to WhatsApp / Instagram — verse + faith art + wordmark.
 * Rendered off-screen and captured with react-native-view-shot. Self-contained styling
 * (no external theme deps) so the captured pixels are deterministic.
 */
export const ShareableCard = React.forwardRef<View, Props>(({ wisdom, faith }, ref) => {
  const theme = getFaithTheme(faith ?? wisdom?.tradition);
  const art = deitiesForFaith(faith ?? wisdom?.tradition)[0]?.image;
  const translation = wisdom?.translation_en || wisdom?.short_form || '';
  const original = wisdom?.original_transliteration || '';
  const source = wisdom?.source || wisdom?.source_text || '';

  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      {art && <Image source={art} style={StyleSheet.absoluteFill} resizeMode="cover" />}
      <LinearGradient
        colors={['rgba(2,6,23,0.35)', 'rgba(2,6,23,0.78)', '#020617']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.inner}>
        <View style={[styles.rule, { backgroundColor: theme.accent }]} />
        {!!original && <Text style={styles.original} numberOfLines={3}>{original}</Text>}
        <Text style={styles.translation} numberOfLines={6}>“{translation}”</Text>
        {!!source && <Text style={[styles.source, { color: theme.accent }]}>— {source}</Text>}
        <View style={styles.footer}>
          <Text style={styles.wordmark}>🪔  Dharma</Text>
        </View>
      </View>
    </View>
  );
});

ShareableCard.displayName = 'ShareableCard';

const styles = StyleSheet.create({
  card: { width: CARD_W, height: CARD_H, backgroundColor: '#020617', overflow: 'hidden' },
  inner: { flex: 1, justifyContent: 'flex-end', padding: 24 },
  rule: { width: 44, height: 3, borderRadius: 2, marginBottom: 16, opacity: 0.9 },
  original: { color: '#e2e8f0', fontSize: 15, fontFamily: 'Playfair_Medium', fontStyle: 'italic', marginBottom: 12, lineHeight: 22 },
  translation: { color: '#ffffff', fontSize: 21, fontFamily: 'Playfair_Bold', lineHeight: 29 },
  source: { fontSize: 13, fontFamily: 'Playfair_Regular', fontStyle: 'italic', marginTop: 12 },
  footer: { marginTop: 20, flexDirection: 'row', alignItems: 'center' },
  wordmark: { color: '#f8fafc', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
});
