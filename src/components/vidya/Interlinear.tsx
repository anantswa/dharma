import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MantraWord } from '../../data/vidya/types';

type Props = {
  words: MantraWord[];
  accent: string;
  /** Word currently sounding (sync-highlight); -1 for none. */
  highlight: number;
  onPress: (word: MantraWord, index: number) => void;
};

/**
 * Word by word — interlinear by default (§3 screen 3): every word is a stacked
 * triplet — Devanagari / IAST / one-line gloss — in reading order, wrapping, so
 * Gāyatrī's ten words are read in one pass with no taps. Tapping a triplet is
 * optional depth (the drill-down sheet), never the path.
 */
export const Interlinear: React.FC<Props> = ({ words, accent, highlight, onPress }) => (
  <View style={styles.wrap}>
    {words.map((w, i) => {
      const lit = i === highlight;
      return (
        <Pressable
          key={`${i}:${w.deva}`}
          onPress={() => onPress(w, i)}
          style={({ pressed }) => [styles.triplet, lit && { backgroundColor: `${accent}1a` }, pressed && { opacity: 0.8 }]}
          accessibilityRole="button"
          accessibilityLabel={`${w.iast} — ${w.glossEn}`}
        >
          <Text style={[styles.deva, lit && { color: accent }]}>{w.deva}</Text>
          <Text style={styles.iast}>{w.iast}</Text>
          <Text style={styles.gloss}>{w.glossEn}</Text>
        </Pressable>
      );
    })}
  </View>
);

/** The same words as one spaced Devanagari line (screen 2's word-split view). */
export const WordLine: React.FC<{ words: MantraWord[]; accent: string; highlight: number; size?: number }> = ({ words, accent, highlight, size = 26 }) => (
  <View style={styles.line}>
    {words.map((w, i) => (
      <Text key={`${i}:${w.deva}`} style={[styles.lineWord, { fontSize: size, lineHeight: size * 1.55 }, i === highlight && { color: accent }]}>
        {w.deva}
      </Text>
    ))}
  </View>
);

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  triplet: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, minWidth: 84, borderWidth: 1, borderColor: 'rgba(148,163,184,0.12)', backgroundColor: 'rgba(15,23,42,0.45)' },
  deva: { color: '#f8fafc', fontSize: 22, fontFamily: 'Playfair_Medium', lineHeight: 34 },
  iast: { color: '#cbd5e1', fontSize: 12.5, fontStyle: 'italic', marginTop: 1 },
  gloss: { color: '#94a3b8', fontSize: 12, marginTop: 3, lineHeight: 16, maxWidth: 150 },
  line: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 2 },
  lineWord: { color: '#f8fafc', fontFamily: 'Playfair_Medium' },
});
