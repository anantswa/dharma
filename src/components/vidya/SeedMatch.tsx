import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { shuffle, type SeedPair } from '../../data/vidya/seeds';
import type { Grade } from '../../store/masteryStore';

type Props = { pairs: SeedPair[]; accent: string; onResult: (g: Grade) => void };

/**
 * SeedMatch (box 2–3): four seeds ↔ four deities, tap-to-pair (no drag).
 * Distractors come from the same shelf via the seed registry.
 * all right → knew · one miss → okay · two+ → forgot (§3).
 */
export const SeedMatch: React.FC<Props> = ({ pairs, accent, onResult }) => {
  const seeds = useMemo(() => shuffle(pairs), [pairs]);
  const deities = useMemo(() => shuffle(pairs), [pairs]);
  const [selected, setSelected] = useState<string | null>(null);         // seed
  const [matched, setMatched] = useState<Record<string, string>>({});    // seed → deityId
  const [done, setDone] = useState(false);

  const finish = (m: Record<string, string>) => {
    setDone(true);
    const misses = pairs.filter((p) => m[p.seed] !== p.deityId).length;
    const g: Grade = misses === 0 ? 'knew' : misses === 1 ? 'okay' : 'forgot';
    try { Haptics.notificationAsync(misses === 0 ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning); } catch { /* noop */ }
    setTimeout(() => onResult(g), 1300);
  };

  const tapSeed = (seed: string) => {
    if (done || matched[seed]) return;
    try { Haptics.selectionAsync(); } catch { /* noop */ }
    setSelected((s) => (s === seed ? null : seed));
  };

  const tapDeity = (deityId: string) => {
    if (done || !selected) return;
    if (Object.values(matched).includes(deityId)) return;
    const next = { ...matched, [selected]: deityId };
    setMatched(next);
    setSelected(null);
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch { /* noop */ }
    if (Object.keys(next).length === pairs.length) finish(next);
  };

  const okFor = (seed: string) => done && matched[seed] === pairs.find((p) => p.seed === seed)?.deityId;
  const deityOk = (deityId: string) => {
    const seed = Object.keys(matched).find((s) => matched[s] === deityId);
    return !!seed && okFor(seed);
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.q, { color: accent }]}>MATCH EACH SEED TO ITS DEITY</Text>
      <Text style={styles.hint}>tap a seed, then the one it calls</Text>
      <View style={styles.cols}>
        <View style={styles.col}>
          {seeds.map((p) => {
            const paired = !!matched[p.seed];
            const sel = selected === p.seed;
            const border = done ? (okFor(p.seed) ? '#22c55e' : '#ef4444') : sel ? accent : paired ? `${accent}66` : 'rgba(148,163,184,0.25)';
            return (
              <Pressable key={p.seed} onPress={() => tapSeed(p.seed)} style={[styles.seed, { borderColor: border }, sel && { backgroundColor: `${accent}1f` }]}>
                <Text style={styles.seedDeva}>{p.seed}</Text>
                <Text style={styles.seedIast}>{p.iast}</Text>
                {paired && !done && <Text style={[styles.pairedLbl, { color: accent }]} numberOfLines={1}>{pairs.find((q) => q.deityId === matched[p.seed])?.deityName}</Text>}
              </Pressable>
            );
          })}
        </View>
        <View style={styles.col}>
          {deities.map((p) => {
            const taken = Object.values(matched).includes(p.deityId);
            const border = done ? '#334155' : taken ? `${accent}66` : 'rgba(148,163,184,0.25)';
            return (
              <Pressable key={p.deityId} onPress={() => tapDeity(p.deityId)} style={[styles.deity, { borderColor: border }, taken && !done && { opacity: 0.55 }]} disabled={taken || done}>
                {p.image ? (
                  <ExpoImage source={p.image} style={styles.art} contentFit="cover" contentPosition={{ top: '10%' }} cachePolicy="memory-disk" />
                ) : (
                  <View style={[styles.art, { backgroundColor: '#0b1220' }]} />
                )}
                <Text style={styles.deityName} numberOfLines={2}>{p.deityName}</Text>
                {done && (
                  <Ionicons name={deityOk(p.deityId) ? 'checkmark-circle' : 'close-circle'} size={16} color={deityOk(p.deityId) ? '#22c55e' : '#ef4444'} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  q: { fontSize: 11, letterSpacing: 1.5, fontWeight: '800' },
  hint: { color: '#64748b', fontSize: 12.5, fontStyle: 'italic', marginBottom: 4 },
  cols: { flexDirection: 'row', gap: 10 },
  col: { flex: 1, gap: 10 },
  seed: { borderWidth: 1.5, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12, minHeight: 64, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'center' },
  seedDeva: { color: '#f8fafc', fontSize: 24, fontFamily: 'Playfair_Medium', lineHeight: 34 },
  seedIast: { color: '#94a3b8', fontSize: 12, fontStyle: 'italic' },
  pairedLbl: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  deity: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: 14, padding: 8, minHeight: 64, backgroundColor: 'rgba(15,23,42,0.55)' },
  art: { width: 44, height: 44, borderRadius: 12 },
  deityName: { flex: 1, color: '#e2e8f0', fontSize: 13, fontWeight: '600' },
});
