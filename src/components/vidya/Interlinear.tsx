import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MantraWord } from '../../data/vidya/types';

type Props = {
  words: MantraWord[];
  accent: string;
  onPress: (word: MantraWord, index: number) => void;
};

/**
 * Word by word — interlinear: every word is a stacked triplet — Devanagari /
 * IAST / one-line gloss — in reading order, wrapping, so Gāyatrī's ten words
 * are read in one pass with no taps. Tapping a triplet sounds the word's own
 * clip (v2: rendered per word, so it matches exactly) and opens the optional
 * drill-down sheet. A small speaker marks the words that carry a clip.
 */
export const Interlinear: React.FC<Props> = ({ words, accent, onPress }) => (
  <View style={styles.wrap}>
    {words.map((w, i) => (
      <Pressable
        key={`${i}:${w.deva}`}
        onPress={() => onPress(w, i)}
        style={({ pressed }) => [styles.triplet, pressed && { opacity: 0.8, backgroundColor: `${accent}1a` }]}
        accessibilityRole="button"
        accessibilityLabel={`${w.iast} — ${w.glossEn}`}
      >
        <View style={styles.devaRow}>
          <Text style={styles.deva}>{w.deva}</Text>
          {!!w.audioUrl && <Ionicons name="volume-medium-outline" size={13} color={`${accent}aa`} />}
        </View>
        <Text style={styles.iast}>{w.iast}</Text>
        <Text style={styles.gloss}>{w.glossEn}</Text>
      </Pressable>
    ))}
  </View>
);

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  triplet: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, minWidth: 84, borderWidth: 1, borderColor: 'rgba(148,163,184,0.12)', backgroundColor: 'rgba(15,23,42,0.45)' },
  devaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deva: { color: '#f8fafc', fontSize: 22, fontFamily: 'Playfair_Medium', lineHeight: 34 },
  iast: { color: '#cbd5e1', fontSize: 12.5, fontStyle: 'italic', marginTop: 1 },
  gloss: { color: '#94a3b8', fontSize: 12, marginTop: 3, lineHeight: 16, maxWidth: 150 },
});
