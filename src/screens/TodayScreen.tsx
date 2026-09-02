import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COURSE_LIST, getCourse } from '../data/courses';
import { getFaithTheme, templeEntryIndex } from '../data/faiths';
import { getDailyDarshan } from '../services/dailyDarshan';
import { WisdomStrip } from '../components/WisdomStrip';
import { buildTodayQueue, masteredCount, useMasteryStore } from '../store/masteryStore';
import { useStreakStore } from '../store/streakStore';
import { useJapaStore } from '../store/japaStore';
import { rankFor, useScoreStore } from '../store/scoreStore';
import { useAchievementsStore } from '../store/achievementsStore';
import { usePreferencesStore } from '../store/preferencesStore';
import { useDataStore } from '../store/dataStore';
import { todaysPanchang, TodayPanchang } from '../services/panchang';
import { track } from '../services/analytics';
import { FaithChooser } from '../components/FaithChooser';

/**
 * "Today" — the 60-second daily ritual (IA reorg, Phase 1). One short page:
 * pañchāṅg line · wisdom strip · practice line · the one sādhana CTA · one
 * continue-course row · temple doorway · Sahāra. Every block has ONE home —
 * merchandising (books, wallpapers, comic) lives in Mandir; catalogs and the
 * scorecard live on Path.
 */
export const TodayScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const primary = usePreferencesStore((s) => s.primaryTradition);
  const theme = getFaithTheme(primary);
  const records = useMasteryStore((s) => s.records);
  const newPerDay = useMasteryStore((s) => s.newPerDay);
  const streak = useStreakStore((s) => s.currentStreak);
  const jnana = useScoreStore((s) => s.jnana);
  const festivals = useDataStore((s) => s.festivals);
  const malas = useJapaStore((s) => s.malas);
  const [panchang, setPanchang] = useState<TodayPanchang | null>(null);
  const insets = useSafeAreaInsets();

  useFocusEffect(useCallback(() => {
    useMasteryStore.getState().load();
    useScoreStore.getState().load();
    useStreakStore.getState().load();
    useAchievementsStore.getState().load().then(() => useAchievementsStore.getState().evaluate());
  }, []));

  useEffect(() => {
    track('app_open');
    todaysPanchang().then(setPanchang).catch(() => {});
  }, []);

  // Festival awareness — does today carry a festival? (one line, tappable)
  const todaysFestival = useMemo(() => {
    const today = new Date();
    const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return festivals.find((f) => f.date === key && f.faith !== 'Secular') ?? null;
  }, [festivals]);

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

  const inProgress = courses.filter((c) => c.started);
  // faith-pure fallback: a fresh Buddhist install begins with the Dhammapada, not the Chalisa
  const faithCourses = courses.filter((c) => c.faith === theme.key);
  const target = (inProgress.find((c) => c.due > 0) || faithCourses[0] || courses[0]);
  // honest count: what YOUR practice holds today — started courses, or just the target for a fresh start
  const totalDue = (inProgress.length ? inProgress : [target]).filter(Boolean).reduce((s, c) => s + c.due, 0);
  const rank = rankFor(jnana);

  // Today's darshan — the traditional weekday deity (meaningful, not random).
  const darshan = getDailyDarshan(primary);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#020617', '#0b1220', '#020617']} style={StyleSheet.absoluteFill} />
      <FaithChooser />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 18 }]} showsVerticalScrollIndicator={false}>
        <Text style={[styles.greeting, { color: theme.accent }]}>{theme.greeting}</Text>
        <Text style={styles.title}>Today</Text>

        {/* pañchāṅg line — tithi from the verified drik engine; festival when one falls today */}
        {(todaysFestival || panchang) && (
          <Pressable
            disabled={!todaysFestival}
            onPress={() => todaysFestival && navigation.navigate('FestivalDetail', { festival: todaysFestival })}
          >
            <Text style={styles.panchang}>
              {todaysFestival ? (
                <Text style={{ color: theme.accent, fontWeight: '700' }}>🪔 Today is {todaysFestival.name}</Text>
              ) : (
                <>🌙 {panchang!.tithi} · {panchang!.masa}</>
              )}
            </Text>
          </Pressable>
        )}

        {/* today's wisdom — one line; tap opens the full darshan card */}
        <WisdomStrip />

        {/* practice line — feedback, not a destination; the full scorecard lives on Path */}
        <View style={styles.practiceStrip}>
          <Pressable style={styles.practiceMain} hitSlop={8} onPress={() => navigation.navigate('Path' as any)}>
            <Text style={styles.practiceTxt} numberOfLines={1}>
              {streak > 0 ? `day ${streak} of practice` : 'your practice begins today'}
              {'  ·  '}
              <Text style={{ color: theme.accent }}>✦ {rank.current.name}</Text>
            </Text>
          </Pressable>
          {/* japa stays one tap from Today */}
          <Pressable hitSlop={10} onPress={() => navigation.navigate('Japa')}>
            <Text style={styles.practiceTxt}>📿 {malas}</Text>
          </Pressable>
        </View>

        {/* the one action */}
        <Pressable style={[styles.cta, { backgroundColor: theme.accent }]}
          onPress={() => navigation.navigate('Sadhana', { courseId: target?.id ?? faithCourses[0]?.id ?? courses[0]?.id })}>
          <Ionicons name="sparkles" size={20} color="#0b1220" />
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaTitle}>Begin today’s sādhana</Text>
            <Text style={styles.ctaSub}>
              {totalDue > 0 ? `${totalDue} verse${totalDue === 1 ? '' : 's'} ready · ${target?.title}` : 'Start learning a new verse'}
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color="#0b1220" />
        </Pressable>

        {/* one next step — the catalog's home is Path */}
        <View style={styles.sectionRow}>
          <Text style={[styles.section, { color: theme.accent }]}>
            {target?.started ? 'CONTINUE LEARNING' : 'START A COURSE'}
          </Text>
          <Pressable hitSlop={10} onPress={() => navigation.navigate('Path' as any)}>
            <Text style={[styles.sectionMore, { color: theme.accent }]}>All courses →</Text>
          </Pressable>
        </View>
        {target && (
          <Pressable style={styles.courseRow}
            onPress={() => navigation.navigate('ChalisaPath', { courseId: target.id })}>
            <View style={{ flex: 1 }}>
              <Text style={styles.courseTitle}>{target.title}</Text>
              <Text style={styles.courseMeta}>
                {target.mastered}/{target.count} by heart{target.due > 0 ? ` · ${target.due} due` : ''}
              </Text>
              <View style={styles.bar}>
                <View style={[styles.barFill, { width: `${(target.count ? target.mastered / target.count : 0) * 100}%`, backgroundColor: theme.accent }]} />
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#475569" />
          </Pressable>
        )}

        {/* temple doorway — Today points at the temple; Mandir owns the big hero */}
        <Pressable
          style={styles.templeRow}
          onPress={() => navigation.navigate('Temple', { deityIndex: templeEntryIndex(primary, usePreferencesStore.getState().ista) })}
        >
          <ExpoImage source={darshan.deity.image} style={styles.templeThumb} contentFit="cover" contentPosition={{ top: '10%' }} transition={250} />
          <View style={{ flex: 1 }}>
            <Text style={styles.courseTitle}>Enter the temple</Text>
            <Text style={styles.templeMeta} numberOfLines={1}>{darshan.reason}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#475569" />
        </Pressable>

        {/* Sahāra — the doorway for the moment of need (its one home) */}
        <Pressable
          style={({ pressed }) => [styles.sahara, pressed && { opacity: 0.85 }]}
          onPress={() => navigation.navigate('Sahara')}
        >
          <Text style={styles.saharaLotus}>🪷</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.saharaTitle}>What brings you today?</Text>
            <Text style={styles.saharaSub}>A mantra, a breath, a verse — for this moment</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#64748b" />
        </Pressable>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  scroll: { paddingHorizontal: 18, paddingTop: 78, paddingBottom: 110 },
  greeting: { fontSize: 14, fontStyle: 'italic', marginBottom: 2 },
  title: { fontSize: 34, color: '#f8fafc', fontFamily: 'Playfair_Bold', marginBottom: 16 },
  panchang: { color: '#94a3b8', fontSize: 13, marginTop: -12, marginBottom: 16 },
  practiceStrip: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 32, marginBottom: 18, paddingHorizontal: 2 },
  practiceMain: { flex: 1, justifyContent: 'center' },
  practiceTxt: { color: '#94a3b8', fontSize: 13.5, fontWeight: '600' },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 18, marginBottom: 16 },
  ctaTitle: { color: '#0b1220', fontSize: 17, fontWeight: '800' },
  ctaSub: { color: 'rgba(11,18,32,0.75)', fontSize: 12.5, marginTop: 2, fontWeight: '600' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  section: { flex: 1, fontSize: 12, letterSpacing: 1.5, fontWeight: '800' },
  sectionMore: { fontSize: 13, fontWeight: '700' },
  courseRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(15,23,42,0.5)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(148,163,184,0.12)', padding: 14, marginBottom: 16 },
  courseTitle: { color: '#f1f5f9', fontSize: 15.5, fontFamily: 'Playfair_Bold' },
  courseMeta: { color: '#94a3b8', fontSize: 12, marginTop: 3, marginBottom: 8 },
  bar: { height: 5, borderRadius: 3, backgroundColor: 'rgba(148,163,184,0.18)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  templeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, height: 72,
    backgroundColor: 'rgba(15,23,42,0.5)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.28)', paddingHorizontal: 14, marginBottom: 16,
  },
  templeThumb: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#0b1220' },
  templeMeta: { color: '#94a3b8', fontSize: 12, marginTop: 3 },
  sahara: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: 'rgba(148,163,184,0.16)',
    backgroundColor: 'rgba(15,23,42,0.5)', borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 13, marginBottom: 16,
  },
  saharaLotus: { fontSize: 22 },
  saharaTitle: { color: '#f1f5f9', fontSize: 15, fontFamily: 'Playfair_Bold' },
  saharaSub: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
});
