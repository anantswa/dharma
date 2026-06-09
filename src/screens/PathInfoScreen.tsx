import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { getFaithTheme } from '../data/faiths';
import { RANKS, rankFor, useScoreStore } from '../store/scoreStore';
import { FREEZE_CAP, FREEZE_COST, useStreakStore } from '../store/streakStore';
import { useMasteryStore } from '../store/masteryStore';
import { ACHIEVEMENTS, useAchievementsStore } from '../store/achievementsStore';
import { usePreferencesStore } from '../store/preferencesStore';

const SANKALPA = [
  { n: 1, label: 'Gentle', note: '1 new verse / day' },
  { n: 3, label: 'Steady', note: '3 new verses / day' },
  { n: 5, label: 'Devout', note: '5 new verses / day' },
];

/** Explains the scorecard: what a streak / Jñāna / diya is, how you earn them, and the rank ladder. */
export const PathInfoScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const theme = getFaithTheme(usePreferencesStore.getState().primaryTradition);
  const jnana = useScoreStore((s) => s.jnana);
  const diyas = useScoreStore((s) => s.diyas);
  const streak = useStreakStore((s) => s.currentStreak);
  const freezes = useStreakStore((s) => s.freezes);
  const newPerDay = useMasteryStore((s) => s.newPerDay);
  const unlocked = useAchievementsStore((s) => s.unlocked);
  const { current, next, pct } = rankFor(jnana);

  useFocusEffect(useCallback(() => {
    useMasteryStore.getState().load();
    useStreakStore.getState().load();
    useScoreStore.getState().load();
    useAchievementsStore.getState().load().then(() => useAchievementsStore.getState().evaluate());
  }, []));

  const earnedSiddhis = ACHIEVEMENTS.filter((a) => unlocked[a.id]).length;

  const buyFreeze = async () => {
    if (freezes >= FREEZE_CAP || diyas < FREEZE_COST) return;
    const ok = await useScoreStore.getState().spend(FREEZE_COST);
    if (ok) await useStreakStore.getState().addFreeze(1);
  };

  const items = [
    { icon: '🔥', name: 'Streak', value: `${streak} day${streak === 1 ? '' : 's'}`,
      what: 'The number of days in a row you’ve done your sādhana. Practice every day to keep it alive — miss a day and it resets.',
      how: 'Earn it: complete any sādhana today.' },
    { icon: '✦', name: 'Jñāna', value: `${jnana}`,
      what: 'Knowledge points — your overall progress on the path. The more you understand and remember, the more Jñāna you gather, and the higher your rank.',
      how: 'Earn it: +20 for each verse you answer correctly in review, +10 for learning a new verse.' },
    { icon: '🪔', name: 'Diyas', value: `${diyas}`,
      what: 'Lamps you light through devotion. Each completed sādhana adds a diya — and you can offer them to light a guarding lamp that protects your streak.',
      how: 'Earn it: +1 per correct review, +5 for finishing a day’s sādhana. Spend it: guarding lamps, above.' },
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

        {/* Siddhis link */}
        <Pressable style={[styles.linkCard, { borderColor: theme.accentSoft }]} onPress={() => navigation.navigate('Achievements')}>
          <Text style={styles.linkIcon}>🏅</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.linkTitle}>Siddhis</Text>
            <Text style={styles.linkSub}>{earnedSiddhis} of {ACHIEVEMENTS.length} milestones attained</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#475569" />
        </Pressable>

        {/* Sankalpa — daily intention */}
        <View style={[styles.actionCard, { borderColor: theme.accentSoft }]}>
          <Text style={styles.actionKicker}>🙏  YOUR SANKALPA</Text>
          <Text style={styles.actionTitle}>Daily intention</Text>
          <Text style={styles.actionDesc}>
            How many new verses to take on each day. Reviews of what you already know always continue —
            this only sets the pace of the new.
          </Text>
          <View style={styles.sankalpaRow}>
            {SANKALPA.map((opt) => {
              const active = newPerDay === opt.n;
              return (
                <Pressable
                  key={opt.n}
                  style={[styles.sankalpaOpt, active && { backgroundColor: theme.accent, borderColor: theme.accent }]}
                  onPress={() => useMasteryStore.getState().setNewPerDay(opt.n)}
                >
                  <Text style={[styles.sankalpaLabel, active && { color: '#0b1220' }]}>{opt.label}</Text>
                  <Text style={[styles.sankalpaNote, active && { color: 'rgba(11,18,32,0.75)' }]}>{opt.note}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Streak insurance — keep the lamp lit */}
        <View style={[styles.actionCard, { borderColor: theme.accentSoft }]}>
          <Text style={styles.actionKicker}>🪔  KEEP THE LAMP LIT</Text>
          <Text style={styles.actionTitle}>Guarding lamps · {freezes}/{FREEZE_CAP}</Text>
          <Text style={styles.actionDesc}>
            Life happens. A guarding lamp keeps your streak alive through a missed day — automatically.
            You earn one every 7-day streak, and can light one with diyas.
          </Text>
          <Pressable
            style={[
              styles.buyBtn,
              { borderColor: theme.accent },
              (freezes >= FREEZE_CAP || diyas < FREEZE_COST) && styles.buyBtnDisabled,
            ]}
            onPress={buyFreeze}
            disabled={freezes >= FREEZE_CAP || diyas < FREEZE_COST}
          >
            <Ionicons name="flame" size={16} color={theme.accent} />
            <Text style={[styles.buyTxt, { color: theme.accent }]}>
              {freezes >= FREEZE_CAP
                ? 'You hold the maximum'
                : diyas < FREEZE_COST
                  ? `Need ${FREEZE_COST} diyas (you have ${diyas})`
                  : `Light a guarding lamp · ${FREEZE_COST} 🪔`}
            </Text>
          </Pressable>
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
  linkCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 16, backgroundColor: 'rgba(15,23,42,0.5)', marginBottom: 14 },
  linkIcon: { fontSize: 22 },
  linkTitle: { color: '#f1f5f9', fontSize: 16, fontFamily: 'Playfair_Bold' },
  linkSub: { color: '#94a3b8', fontSize: 12.5, marginTop: 2 },
  actionCard: { borderWidth: 1, borderRadius: 18, padding: 18, backgroundColor: 'rgba(15,23,42,0.5)', marginBottom: 14 },
  actionKicker: { color: '#94a3b8', fontSize: 10, letterSpacing: 1.5, fontWeight: '800' },
  actionTitle: { color: '#f1f5f9', fontSize: 18, fontFamily: 'Playfair_Bold', marginTop: 4 },
  actionDesc: { color: '#94a3b8', fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: 14 },
  sankalpaRow: { flexDirection: 'row', gap: 8 },
  sankalpaOpt: { flex: 1, borderWidth: 1, borderColor: 'rgba(148,163,184,0.2)', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 6, alignItems: 'center' },
  sankalpaLabel: { color: '#e2e8f0', fontSize: 14, fontWeight: '800' },
  sankalpaNote: { color: '#94a3b8', fontSize: 10.5, marginTop: 3, textAlign: 'center' },
  buyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderRadius: 999, paddingVertical: 13 },
  buyBtnDisabled: { opacity: 0.5 },
  buyTxt: { fontSize: 14, fontWeight: '700' },
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
