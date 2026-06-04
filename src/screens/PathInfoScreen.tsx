import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { getFaithTheme } from '../data/faiths';
import { RANKS, rankFor, useScoreStore } from '../store/scoreStore';
import { useStreakStore } from '../store/streakStore';
import { usePreferencesStore } from '../store/preferencesStore';

/** Explains the scorecard: what a streak / Jñāna / diya is, how you earn them, and the rank ladder. */
export const PathInfoScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const theme = getFaithTheme(usePreferencesStore.getState().primaryTradition);
  const jnana = useScoreStore((s) => s.jnana);
  const diyas = useScoreStore((s) => s.diyas);
  const streak = useStreakStore((s) => s.currentStreak);
  const { current, next, pct } = rankFor(jnana);

  const items = [
    { icon: '🔥', name: 'Streak', value: `${streak} day${streak === 1 ? '' : 's'}`,
      what: 'The number of days in a row you’ve done your sādhana. Practice every day to keep it alive — miss a day and it resets.',
      how: 'Earn it: complete any sādhana today.' },
    { icon: '✦', name: 'Jñāna', value: `${jnana}`,
      what: 'Knowledge points — your overall progress on the path. The more you understand and remember, the more Jñāna you gather, and the higher your rank.',
      how: 'Earn it: +20 for each verse you answer correctly in review, +10 for learning a new verse.' },
    { icon: '🪔', name: 'Diyas', value: `${diyas}`,
      what: 'Lamps you light through devotion. Each completed sādhana adds a diya — a small offering that builds over time.',
      how: 'Earn it: +1 per correct review, +5 for finishing a day’s sādhana.' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#020617', '#0b1220', '#020617']} style={StyleSheet.absoluteFill} />
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={16}><Ionicons name="chevron-back" size={26} color="#e2e8f0" /></Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.kicker, { color: theme.accent }]}>YOUR PATH</Text>
        <Text style={styles.title}>How it works</Text>
        <Text style={styles.sub}>Learning scripture, made into a daily practice.</Text>

        {/* current rank */}
        <View style={[styles.rankCard, { borderColor: theme.accentSoft }]}>
          <Text style={styles.rankLabel}>YOUR RANK</Text>
          <Text style={[styles.rankName, { color: theme.accent }]}>{current.name}</Text>
          <View style={styles.bar}><View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: theme.accent }]} /></View>
          <Text style={styles.rankNext}>
            {next ? `${jnana} / ${next.min} Jñāna → ${next.name}` : 'Highest rank reached 🙏'}
          </Text>
        </View>

        {items.map((it) => (
          <View key={it.name} style={styles.item}>
            <View style={styles.itemHead}>
              <Text style={styles.itemIcon}>{it.icon}</Text>
              <Text style={styles.itemName}>{it.name}</Text>
              <Text style={[styles.itemValue, { color: theme.accent }]}>{it.value}</Text>
            </View>
            <Text style={styles.itemWhat}>{it.what}</Text>
            <Text style={[styles.itemHow, { color: theme.accent }]}>{it.how}</Text>
          </View>
        ))}

        {/* rank ladder */}
        <Text style={[styles.section, { color: theme.accent }]}>THE PATH OF RANKS</Text>
        {RANKS.map((r) => {
          const reached = jnana >= r.min;
          const isCurrent = r.name === current.name;
          return (
            <View key={r.name} style={[styles.ladderRow, isCurrent && { borderColor: theme.accent, backgroundColor: theme.accentSoft }]}>
              <Ionicons name={reached ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={reached ? theme.accent : '#475569'} />
              <Text style={[styles.ladderName, reached && { color: '#f8fafc' }]}>{r.name}</Text>
              <Text style={styles.ladderMin}>{r.min === 0 ? 'start' : `${r.min} Jñāna`}</Text>
            </View>
          );
        })}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  topBar: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 4 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  kicker: { fontSize: 12, letterSpacing: 3, fontWeight: '800' },
  title: { fontSize: 30, color: '#f8fafc', fontFamily: 'Playfair_Bold', marginTop: 4 },
  sub: { fontSize: 13.5, color: '#94a3b8', marginTop: 6, marginBottom: 18 },
  rankCard: { borderWidth: 1, borderRadius: 18, padding: 18, backgroundColor: 'rgba(15,23,42,0.5)', marginBottom: 20 },
  rankLabel: { color: '#94a3b8', fontSize: 10, letterSpacing: 1.5, fontWeight: '800' },
  rankName: { fontSize: 26, fontFamily: 'Playfair_Bold', marginTop: 4, marginBottom: 12 },
  bar: { height: 8, borderRadius: 4, backgroundColor: 'rgba(148,163,184,0.18)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  rankNext: { color: '#94a3b8', fontSize: 12.5, marginTop: 8 },
  item: { borderTopWidth: 1, borderTopColor: 'rgba(148,163,184,0.1)', paddingVertical: 16 },
  itemHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  itemIcon: { fontSize: 20 },
  itemName: { flex: 1, color: '#f1f5f9', fontSize: 17, fontFamily: 'Playfair_Bold' },
  itemValue: { fontSize: 17, fontWeight: '800' },
  itemWhat: { color: '#cbd5e1', fontSize: 14.5, lineHeight: 22 },
  itemHow: { fontSize: 13, marginTop: 8, fontWeight: '600' },
  section: { fontSize: 12, letterSpacing: 1.5, fontWeight: '800', marginTop: 26, marginBottom: 12 },
  ladderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: 'rgba(148,163,184,0.12)', borderRadius: 12, padding: 14, marginBottom: 8 },
  ladderName: { flex: 1, color: '#94a3b8', fontSize: 15, fontWeight: '700' },
  ladderMin: { color: '#64748b', fontSize: 12 },
});
