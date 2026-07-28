import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  /** Full Devanagari verse. */
  sanskrit: string;
  accent: string;
  revealed: boolean;
  onReveal: () => void;
};

// Mask alternating words but keep trailing dandas/punctuation so the metre stays visible.
const maskWord = (w: string) => {
  const tail = w.match(/[।॥,.!?]+$/);
  return '____' + (tail ? tail[0] : '');
};

const clozeOf = (sanskrit: string, parity: number) =>
  sanskrit
    .split(/\s+/)
    .map((w, i) => (i % 2 === parity && !/^[।॥]+$/.test(w) ? maskWord(w) : w))
    .join(' ');

/**
 * Cloze recall — the middle rung of "by heart". Half the words are hidden; you say
 * the verse in your head (or aloud), reveal, and self-grade. Used for boxes 2–3,
 * between the meaning quiz (recognition) and full recitation (production).
 */
export const ClozeRecall: React.FC<Props> = ({ sanskrit, accent, revealed, onReveal }) => {
  // Random parity per mount so users can't memorize which words hide.
  const parity = useMemo(() => (Math.random() < 0.5 ? 0 : 1), []);
  const cloze = useMemo(() => clozeOf(sanskrit, parity), [sanskrit, parity]);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.kicker, { color: accent }]}>FILL THE MISSING WORDS FROM MEMORY</Text>
      <Text style={styles.verse}>{revealed ? sanskrit : cloze}</Text>
      {!revealed && (
        <Pressable
          style={[styles.revealBtn, { borderColor: accent }]}
          onPress={() => {
            try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch { /* noop */ }
            onReveal();
          }}
        >
          <Text style={[styles.revealTxt, { color: accent }]}>Reveal</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  kicker: { fontSize: 11, letterSpacing: 1.5, fontWeight: '800' },
  verse: { color: '#f8fafc', fontSize: 24, fontFamily: 'Playfair_Medium', lineHeight: 38 },
  revealBtn: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 22, paddingVertical: 10 },
  revealTxt: { fontSize: 14, fontWeight: '700' },
});
