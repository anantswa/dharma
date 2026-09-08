import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image as ExpoImage } from 'expo-image';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { shuffle } from '../../data/vidya/seeds';
import type { QuizItem } from '../../data/vidya/types';
import type { Grade } from '../../store/masteryStore';

type Props = {
  items: QuizItem[];
  accent: string;
  onResult: (g: Grade) => void;
};

type Round = { prompt: string; imageUrl?: string; options: string[]; correct: number };

/**
 * ImageQuiz (v2 rule 6 — gamification more visual): the card's own `quiz[]`,
 * one question at a time — the image (when it has one) above the prompt,
 * four options shuffled at render, the authored `correct` index followed
 * through the shuffle. Several questions per card; the whole run grades once:
 * no miss → knew · one miss → okay · more → forgot.
 */
export const ImageQuiz: React.FC<Props> = ({ items, accent, onResult }) => {
  const rounds = useMemo<Round[]>(() => items.map((q) => {
    const order = shuffle(q.options.map((_, i) => i));
    return { prompt: q.prompt, imageUrl: q.imageUrl, options: order.map((i) => q.options[i]), correct: order.indexOf(q.correct) };
  }), [items]);
  const [n, setN] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [misses, setMisses] = useState(0);

  const round = rounds[n];
  if (!round) return null;
  const last = n === rounds.length - 1;

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const ok = i === round.correct;
    const missed = misses + (ok ? 0 : 1);
    if (!ok) setMisses(missed);
    try { Haptics.notificationAsync(ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error); } catch { /* noop */ }
    setTimeout(() => {
      if (last) onResult(missed === 0 ? 'knew' : missed === 1 ? 'okay' : 'forgot');
      else { setN(n + 1); setPicked(null); }
    }, ok ? 900 : 1400);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={[styles.q, { color: accent }]}>TEST YOURSELF</Text>
        <Text style={styles.count}>{n + 1} / {rounds.length}</Text>
      </View>
      {!!round.imageUrl && (
        <ExpoImage source={{ uri: round.imageUrl }} style={styles.image} contentFit="cover" transition={250} cachePolicy="memory-disk" />
      )}
      <Text style={styles.prompt}>{round.prompt}</Text>
      <View style={styles.grid}>
        {round.options.map((opt, i) => {
          const reveal = picked !== null;
          const isCorrect = i === round.correct;
          const isPicked = i === picked;
          const border = reveal && isCorrect ? '#22c55e' : reveal && isPicked ? '#ef4444' : 'rgba(148,163,184,0.25)';
          const bg = reveal && isCorrect ? 'rgba(34,197,94,0.14)' : reveal && isPicked ? 'rgba(239,68,68,0.14)' : 'rgba(15,23,42,0.55)';
          return (
            <Pressable
              key={`${n}:${i}`}
              onPress={() => choose(i)}
              disabled={reveal}
              style={[styles.opt, { borderColor: border, backgroundColor: bg }]}
              accessibilityRole="button"
              accessibilityLabel={opt}
            >
              <Text style={styles.optTxt}>{opt}</Text>
              {reveal && isCorrect && <Ionicons name="checkmark-circle" size={18} color="#22c55e" style={styles.mark} />}
              {reveal && isPicked && !isCorrect && <Ionicons name="close-circle" size={18} color="#ef4444" style={styles.mark} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  q: { fontSize: 11, letterSpacing: 1.5, fontWeight: '800' },
  count: { color: '#64748b', fontSize: 11.5, fontWeight: '700', fontVariant: ['tabular-nums'] },
  image: { width: '100%', aspectRatio: 4 / 3, borderRadius: 18, backgroundColor: '#0b1220' },
  prompt: { color: '#f8fafc', fontSize: 18, lineHeight: 27, fontFamily: 'Playfair_Medium' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  opt: { width: '47.5%', flexGrow: 1, minHeight: 64, borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 12, justifyContent: 'center' },
  optTxt: { color: '#e2e8f0', fontSize: 15, lineHeight: 21, fontWeight: '600', paddingRight: 18 },
  mark: { position: 'absolute', top: 6, right: 6 },
});
