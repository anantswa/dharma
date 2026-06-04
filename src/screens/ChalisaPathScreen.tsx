import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { getCourse } from '../data/courses';
import { getFaithTheme } from '../data/faiths';
import {
  buildTodayQueue,
  LEVEL_LABEL,
  levelForBox,
  masteredCount,
  MasteryLevel,
  useMasteryStore,
} from '../store/masteryStore';

const LEVEL_COLOR: Record<MasteryLevel, string> = {
  new: '#475569',
  shishya: '#eab308',
  upasaka: '#38bdf8',
  siddha: '#4ade80',
};

export const ChalisaPathScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const course = getCourse(route.params?.courseId);
  const theme = getFaithTheme('Hindu');
  const records = useMasteryStore((s) => s.records);
  const newPerDay = useMasteryStore((s) => s.newPerDay);

  useFocusEffect(useCallback(() => { useMasteryStore.getState().load(); }, []));

  const verses = course.verses;
  const ids = verses.map((v) => v.id);
  const mastered = masteredCount(ids, records as any);
  const total = verses.length;
  const dueToday = buildTodayQueue(verses, records as any, newPerDay).length;
  const pct = total ? mastered / total : 0;

  // Overall rank from how much is by heart (scales to any course length).
  const rank =
    mastered >= total ? 'Siddha · complete'
    : mastered >= Math.round(total * 0.66) ? 'Siddha'
    : mastered >= Math.round(total * 0.33) ? 'Upāsaka'
    : mastered >= 1 ? 'Shishya'
    : 'Begin';
  // "Daily goal" = clear today's due queue.
  const goalMet = dueToday === 0 && mastered > 0;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#020617', '#0b1220', '#020617']} style={StyleSheet.absoluteFill} />

      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={16}>
          <Ionicons name="chevron-back" size={26} color="#e2e8f0" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.kicker, { color: theme.accent }]}>LEARN BY HEART</Text>
        <Text style={styles.title}>{course.title}</Text>
        <Text style={styles.subtitle}>{total} verses · {course.subtitle}</Text>

        {/* progress */}
        <View style={[styles.progressCard, { borderColor: theme.accentSoft }]}>
          <View style={styles.progressTop}>
            <Text style={styles.progressBig}>{mastered}<Text style={styles.progressOf}> / {total}</Text></Text>
            <View style={[styles.rankBadge, { borderColor: theme.accent, backgroundColor: theme.accentSoft }]}>
              <Text style={[styles.rankTxt, { color: theme.accent }]}>{rank}</Text>
            </View>
          </View>
          <View style={styles.bar}>
            <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: theme.accent }]} />
          </View>
          <View style={styles.goalRow}>
            <Ionicons
              name={goalMet ? 'checkmark-circle' : 'ellipse-outline'}
              size={16}
              color={goalMet ? '#4ade80' : '#64748b'}
            />
            <Text style={styles.goalTxt}>
              {goalMet ? "Today's goal complete 🎉" : `Today's goal · ${dueToday} verse${dueToday === 1 ? '' : 's'} to practice`}
            </Text>
          </View>
        </View>

        {/* today's sadhana CTA */}
        <Pressable style={[styles.cta, { backgroundColor: theme.accent }]} onPress={() => navigation.navigate('Sadhana', { courseId: course.id })}>
          <Ionicons name="sparkles" size={18} color="#0b1220" />
          <Text style={styles.ctaText}>
            {dueToday > 0 ? `Begin today's sādhana · ${dueToday}` : 'Practice (all caught up)'}
          </Text>
        </Pressable>

        {/* verse list with mastery level */}
        <View style={styles.list}>
          {verses.map((v) => {
            const lvl = levelForBox(records[v.id]?.box);
            return (
              <View key={v.id} style={styles.row}>
                {v.artUrl ? (
                  <ExpoImage source={{ uri: v.artUrl }} style={styles.thumb} contentFit="cover" cachePolicy="memory-disk" />
                ) : (
                  <View style={[styles.thumb, { backgroundColor: 'rgba(148,163,184,0.15)' }]} />
                )}
                <View style={[styles.dot, { backgroundColor: LEVEL_COLOR[lvl] }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{v.titleHi}</Text>
                  <Text style={styles.rowVerse} numberOfLines={1}>{v.sanskrit}</Text>
                </View>
                <Text style={[styles.rowLvl, { color: LEVEL_COLOR[lvl] }]}>{LEVEL_LABEL[lvl]}</Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.footer}>🪔  Spaced repetition · your progress saves automatically</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  topBar: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 4 },
  scroll: { paddingHorizontal: 20, paddingBottom: 60 },
  kicker: { fontSize: 12, letterSpacing: 3, fontWeight: '800' },
  title: { fontSize: 30, color: '#f8fafc', fontFamily: 'Playfair_Bold', marginTop: 4 },
  subtitle: { fontSize: 13.5, color: '#94a3b8', marginTop: 6, marginBottom: 18 },
  progressCard: { borderWidth: 1, borderRadius: 18, padding: 18, backgroundColor: 'rgba(15,23,42,0.5)', marginBottom: 14 },
  progressTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 },
  progressBig: { color: '#f8fafc', fontSize: 30, fontWeight: '800' },
  progressOf: { color: '#64748b', fontSize: 18, fontWeight: '600' },
  progressLbl: { color: '#94a3b8', fontSize: 13 },
  rankBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  rankTxt: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  bar: { height: 8, borderRadius: 4, backgroundColor: 'rgba(148,163,184,0.18)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  goalTxt: { color: '#cbd5e1', fontSize: 13 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, paddingVertical: 16, marginBottom: 22 },
  ctaText: { color: '#0b1220', fontSize: 16, fontWeight: '800' },
  list: { gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(148,163,184,0.08)' },
  thumb: { width: 48, height: 48, borderRadius: 10, backgroundColor: 'rgba(15,23,42,0.6)' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  rowTitle: { color: '#f1f5f9', fontSize: 14, fontWeight: '600' },
  rowVerse: { color: '#64748b', fontSize: 12.5, marginTop: 2, fontFamily: 'Playfair_Medium' },
  rowLvl: { fontSize: 11, fontWeight: '700' },
  footer: { color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 18 },
});
