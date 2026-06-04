import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COURSE_LIST, getCourse } from '../data/courses';
import { getFaithTheme, todaysDarshan } from '../data/faiths';
import { buildTodayQueue, masteredCount, useMasteryStore } from '../store/masteryStore';
import { useStreakStore } from '../store/streakStore';
import { rankFor, useScoreStore } from '../store/scoreStore';
import { usePreferencesStore } from '../store/preferencesStore';

/**
 * "Today" — the habit-first launchpad. Opens to your streak + one clear next action
 * (today's sādhana) + your courses + a tap-through to the temple. Replaces temple-as-home.
 */
export const TodayScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const primary = usePreferencesStore((s) => s.primaryTradition);
  const theme = getFaithTheme(primary);
  const records = useMasteryStore((s) => s.records);
  const newPerDay = useMasteryStore((s) => s.newPerDay);
  const streak = useStreakStore((s) => s.currentStreak);
  const jnana = useScoreStore((s) => s.jnana);
  const diyas = useScoreStore((s) => s.diyas);

  useFocusEffect(useCallback(() => {
    useMasteryStore.getState().load();
    useScoreStore.getState().load();
    useStreakStore.getState().load();
  }, []));

  // Per-course progress + due counts.
  const courses = useMemo(() => COURSE_LIST.map((c) => {
    const verses = getCourse(c.id).verses;
    const ids = verses.map((v) => v.id);
    return {
      ...c,
      mastered: masteredCount(ids, records as any),
      due: buildTodayQueue(verses, records as any, newPerDay).length,
      started: ids.some((id) => records[id]),
    };
  }), [records, newPerDay]);

  const totalDue = courses.reduce((s, c) => s + c.due, 0);
  const inProgress = courses.filter((c) => c.started);
  const target = (inProgress.find((c) => c.due > 0) || courses.find((c) => c.id === 'chalisa') || courses[0]);
  const rank = rankFor(jnana);

  // Today's darshan — the traditional weekday deity (meaningful, not random).
  const darshan = todaysDarshan(primary);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#020617', '#0b1220', '#020617']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.greeting, { color: theme.accent }]}>{theme.greeting}</Text>
        <Text style={styles.title}>Today</Text>

        {/* status row — tap to learn how scoring works */}
        <Pressable onPress={() => navigation.navigate('PathInfo')}>
          <View style={styles.statusRow}>
            <View style={styles.stat}><Text style={styles.statNum}>🔥 {streak}</Text><Text style={styles.statLbl}>streak</Text></View>
            <View style={styles.stat}><Text style={[styles.statNum, { color: theme.accent }]}>✦ {jnana}</Text><Text style={styles.statLbl}>{rank.current.name}</Text></View>
            <View style={styles.stat}><Text style={styles.statNum}>🪔 {diyas}</Text><Text style={styles.statLbl}>diyas</Text></View>
          </View>
          <Text style={styles.howLink}>ⓘ  What do these mean? Tap to learn how it works</Text>
        </Pressable>

        {/* the one action */}
        <Pressable style={[styles.cta, { backgroundColor: theme.accent }]}
          onPress={() => navigation.navigate('Sadhana', { courseId: target?.id ?? 'chalisa' })}>
          <Ionicons name="sparkles" size={20} color="#0b1220" />
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaTitle}>Begin today's sādhana</Text>
            <Text style={styles.ctaSub}>
              {totalDue > 0 ? `${totalDue} verse${totalDue === 1 ? '' : 's'} ready · ${target?.title}` : 'Start learning a new verse'}
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color="#0b1220" />
        </Pressable>

        {/* darshan card → temple (today's weekday deity; opens temple to the same one) */}
        <Pressable style={styles.darshan} onPress={() => navigation.navigate('Temple', { deityIndex: darshan.index })}>
          <ExpoImage source={darshan.deity.image} style={StyleSheet.absoluteFill as any} contentFit="cover" contentPosition={{ top: '7%' }} transition={250} />
          <LinearGradient colors={[`${theme.accent}55`, 'transparent']} style={styles.darshanGlow} pointerEvents="none" />
          <LinearGradient colors={['rgba(2,6,23,0.0)', 'rgba(2,6,23,0.45)', '#020617']} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
          <View style={styles.darshanInner}>
            <Text style={[styles.darshanKicker, { color: theme.accent }]}>{'🪔'}  {darshan.reason.toUpperCase()}</Text>
            <Text style={styles.darshanText}>{darshan.deity.name}</Text>
            <View style={[styles.darshanCta, { backgroundColor: theme.accent }]}>
              <Text style={styles.darshanCtaTxt}>Enter the temple</Text>
              <Ionicons name="arrow-forward" size={15} color="#0b1220" />
            </View>
          </View>
        </Pressable>

        {/* explore */}
        <Text style={[styles.section, { color: theme.accent }]}>EXPLORE</Text>
        {([
          { icon: 'film-outline', title: 'Films', meta: 'Cinematic kathas to watch', go: 'Films', params: undefined },
          { icon: 'images-outline', title: 'Illustrated comics', meta: 'Read the graphic novels', go: 'ComicReader', params: { comicId: 'hanuman-chalisa-illustrated' } },
          { icon: 'book-outline', title: 'Reflections', meta: 'Essays on the stories & their meaning', go: 'Articles', params: undefined },
        ] as const).map((r) => (
          <Pressable key={r.title} style={styles.readRow} onPress={() => navigation.navigate(r.go as any, r.params as any)}>
            <View style={[styles.readIcon, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name={r.icon as any} size={20} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.courseTitle}>{r.title}</Text>
              <Text style={styles.courseMeta}>{r.meta}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#475569" />
          </Pressable>
        ))}
        <View style={{ height: 8 }} />

        {/* your courses */}
        <Text style={[styles.section, { color: theme.accent }]}>
          {inProgress.length ? 'CONTINUE LEARNING' : 'START A COURSE'}
        </Text>
        {(inProgress.length ? inProgress : courses.slice(0, 4)).map((c) => (
          <Pressable key={c.id} style={styles.courseRow}
            onPress={() => navigation.navigate('ChalisaPath', { courseId: c.id })}>
            <View style={{ flex: 1 }}>
              <Text style={styles.courseTitle}>{c.title}</Text>
              <Text style={styles.courseMeta}>
                {c.mastered}/{c.count} by heart{c.due > 0 ? ` · ${c.due} due` : ''}
              </Text>
              <View style={styles.bar}>
                <View style={[styles.barFill, { width: `${(c.count ? c.mastered / c.count : 0) * 100}%`, backgroundColor: theme.accent }]} />
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#475569" />
          </Pressable>
        ))}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  scroll: { paddingHorizontal: 18, paddingTop: 64, paddingBottom: 110 },
  greeting: { fontSize: 14, fontStyle: 'italic', marginBottom: 2 },
  title: { fontSize: 34, color: '#f8fafc', fontFamily: 'Playfair_Bold', marginBottom: 16 },
  statusRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  howLink: { color: '#64748b', fontSize: 12, textAlign: 'center', marginBottom: 18 },
  stat: { flex: 1, alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.55)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(148,163,184,0.14)', paddingVertical: 14 },
  statNum: { color: '#f8fafc', fontSize: 18, fontWeight: '800' },
  statLbl: { color: '#94a3b8', fontSize: 11, marginTop: 4 },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 18, marginBottom: 16 },
  ctaTitle: { color: '#0b1220', fontSize: 17, fontWeight: '800' },
  ctaSub: { color: 'rgba(11,18,32,0.75)', fontSize: 12.5, marginTop: 2, fontWeight: '600' },
  darshan: { height: 230, borderRadius: 20, overflow: 'hidden', marginBottom: 22, justifyContent: 'flex-end', backgroundColor: '#0b1220' },
  darshanGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 110 },
  darshanInner: { padding: 18 },
  darshanKicker: { fontSize: 11, letterSpacing: 1.5, fontWeight: '800' },
  darshanText: { color: '#f8fafc', fontSize: 24, fontFamily: 'Playfair_Bold', marginTop: 4 },
  darshanCta: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, marginTop: 12 },
  darshanCtaTxt: { color: '#0b1220', fontSize: 13, fontWeight: '800' },
  section: { fontSize: 12, letterSpacing: 1.5, fontWeight: '800', marginBottom: 12 },
  readRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(15,23,42,0.5)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(148,163,184,0.12)', padding: 14, marginBottom: 22 },
  readIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  courseRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(15,23,42,0.5)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(148,163,184,0.12)', padding: 14, marginBottom: 10 },
  courseTitle: { color: '#f1f5f9', fontSize: 15.5, fontFamily: 'Playfair_Bold' },
  courseMeta: { color: '#94a3b8', fontSize: 12, marginTop: 3, marginBottom: 8 },
  bar: { height: 5, borderRadius: 3, backgroundColor: 'rgba(148,163,184,0.18)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
});
