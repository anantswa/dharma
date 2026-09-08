import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { FINAL_DEITIES } from '../../data/deityImages';
import { seedOptionFor, shuffle } from '../../data/vidya/seeds';
import type { MantraLesson } from '../../data/vidya/types';
import { getPlayableUri } from '../../services/streamCache';
import type { Grade } from '../../store/masteryStore';

type Option = { key: string; label: string; image?: { uri: string } | number };
type Props = { lesson: MantraLesson; pool: MantraLesson[]; accent: string; onResult: (g: Grade) => void };

/**
 * SeedEar (box 0–1): hear the seed — which Devī / which mantra carries it?
 * Four options: deity art where the seed calls a deity, mantra names
 * otherwise. Plays on its own channel (the mini-player is hidden on recall).
 * correct → knew · wrong → forgot (§3).
 */
export const SeedEar: React.FC<Props> = ({ lesson, pool, accent, onResult }) => {
  const [picked, setPicked] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const aliveRef = useRef(true);

  const { options, correctKey } = useMemo(() => {
    const correct = seedOptionFor(lesson);
    const seen = new Set([correct.key]);
    const others: Option[] = [];
    const add = (o: Option) => { if (!seen.has(o.key)) { seen.add(o.key); others.push(o); } };
    // same shelf first, then any lesson, then the app's own deity roster
    pool.filter((l) => l.id !== lesson.id && l.shelf === 'bija').forEach((l) => add(seedOptionFor(l)));
    pool.filter((l) => l.id !== lesson.id && l.shelf !== 'bija').forEach((l) => add(seedOptionFor(l)));
    const tradition = lesson.tradition === 'Buddhist' ? 'Buddhist' : 'Hindu';
    FINAL_DEITIES
      .filter((d) => (d.tradition ?? 'Hindu') === tradition && !d.name.includes('(') && d.id !== '9' && d.id !== '11' && d.id !== '14')
      .forEach((d) => add({ key: `d:${d.id}`, label: d.name, image: d.image }));
    const opts = shuffle([correct, ...shuffle(others).slice(0, 3)]);
    return { options: opts, correctKey: correct.key };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  const play = async () => {
    try {
      await soundRef.current?.unloadAsync();
      soundRef.current = null;
      const uri = await getPlayableUri(lesson.audio.spokenSlow);
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      if (!aliveRef.current) { sound.unloadAsync().catch(() => {}); return; } // left before the clip arrived
      soundRef.current = sound;
      setPlaying(true);
      sound.setOnPlaybackStatusUpdate((st) => { if (st.isLoaded && st.didJustFinish) setPlaying(false); });
    } catch { setPlaying(false); }
  };

  useEffect(() => {
    aliveRef.current = true;
    play();
    return () => { aliveRef.current = false; soundRef.current?.unloadAsync().catch(() => {}); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  const choose = (key: string) => {
    if (picked) return;
    setPicked(key);
    const ok = key === correctKey;
    try { Haptics.notificationAsync(ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error); } catch { /* noop */ }
    setTimeout(() => onResult(ok ? 'knew' : 'forgot'), 1100);
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.q, { color: accent }]}>HEAR THE SEED — WHO DOES IT CALL?</Text>
      <Pressable style={[styles.hear, { borderColor: accent }]} onPress={play} accessibilityRole="button" accessibilityLabel="Play the seed">
        <Ionicons name={playing ? 'volume-high' : 'volume-medium'} size={18} color={accent} />
        <Text style={[styles.hearTxt, { color: accent }]}>{playing ? 'listening…' : 'play again'}</Text>
      </Pressable>
      <View style={styles.grid}>
        {options.map((o) => {
          const reveal = picked !== null;
          const isCorrect = o.key === correctKey;
          const isPicked = o.key === picked;
          const border = reveal && isCorrect ? '#22c55e' : reveal && isPicked ? '#ef4444' : 'rgba(148,163,184,0.25)';
          return (
            <Pressable key={o.key} style={[styles.tile, { borderColor: border }]} onPress={() => choose(o.key)} disabled={reveal}>
              {o.image ? (
                <ExpoImage source={o.image} style={styles.art} contentFit="cover" contentPosition={{ top: '10%' }} cachePolicy="memory-disk" />
              ) : (
                <View style={[styles.art, styles.artFallback]}><Text style={styles.artTxt}>{o.label}</Text></View>
              )}
              <Text style={styles.label} numberOfLines={1}>{o.label}</Text>
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
  q: { fontSize: 11, letterSpacing: 1.5, fontWeight: '800' },
  hear: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, minHeight: 40 },
  hearTxt: { fontSize: 13, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '47%', borderWidth: 1.5, borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(15,23,42,0.55)' },
  art: { width: '100%', height: 110, backgroundColor: '#0b1220' },
  artFallback: { alignItems: 'center', justifyContent: 'center', padding: 8 },
  artTxt: { color: '#f8fafc', fontSize: 22, fontFamily: 'Playfair_Medium', textAlign: 'center' },
  label: { color: '#e2e8f0', fontSize: 13, fontWeight: '600', paddingHorizontal: 10, paddingVertical: 8 },
  mark: { position: 'absolute', top: 6, right: 6 },
});
