import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CourseVerse } from '../data/courses';

type Props = {
  verse: CourseVerse;
  pool: CourseVerse[];
  accent: string;
  onResult: (correct: boolean) => void;
};

const trim = (s: string, n = 140) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
const shuffle = <T,>(a: T[]) => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};

/**
 * Meaning-match quiz: show the verse, pick its true meaning from 4. Distractors are
 * other verses' meanings from the same course (plausible, same register). This is the
 * "I got tested" mechanic; the result feeds the SRS grade.
 */
export const VerseQuiz: React.FC<Props> = ({ verse, pool, accent, onResult }) => {
  const [picked, setPicked] = useState<number | null>(null);

  const { options, correctIdx } = useMemo(() => {
    const correct = (verse.meaningEn || verse.meaningHi || '').trim();
    const distractors = shuffle(
      pool.filter((v) => v.id !== verse.id && (v.meaningEn || '').trim() && v.meaningEn !== correct),
    ).slice(0, 3).map((v) => v.meaningEn.trim());
    const opts = shuffle([correct, ...distractors]);
    return { options: opts, correctIdx: opts.indexOf(correct) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verse.id]);

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const correct = i === correctIdx;
    try {
      Haptics.notificationAsync(
        correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
      );
    } catch { /* noop */ }
    setTimeout(() => onResult(correct), 1100);
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.q, { color: accent }]}>WHAT DOES THIS VERSE MEAN?</Text>
      {options.map((opt, i) => {
        const isCorrect = i === correctIdx;
        const isPicked = i === picked;
        const reveal = picked !== null;
        const bg = reveal && isCorrect ? 'rgba(34,197,94,0.16)'
          : reveal && isPicked ? 'rgba(239,68,68,0.16)' : 'rgba(15,23,42,0.55)';
        const border = reveal && isCorrect ? '#22c55e'
          : reveal && isPicked ? '#ef4444' : 'rgba(148,163,184,0.25)';
        return (
          <Pressable key={i} onPress={() => choose(i)} disabled={reveal}
            style={[styles.opt, { backgroundColor: bg, borderColor: border }]}>
            <Text style={styles.optText}>{trim(opt)}</Text>
            {reveal && isCorrect && <Ionicons name="checkmark-circle" size={20} color="#22c55e" />}
            {reveal && isPicked && !isCorrect && <Ionicons name="close-circle" size={20} color="#ef4444" />}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  q: { fontSize: 11, letterSpacing: 1.5, fontWeight: '800', marginBottom: 2 },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 14 },
  optText: { flex: 1, color: '#e2e8f0', fontSize: 14, lineHeight: 20 },
});
