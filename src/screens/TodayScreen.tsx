import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COURSE_LIST, getCourse } from '../data/courses';
import { getFaithTheme, todaysDarshan } from '../data/faiths';
import { buildTodayQueue, masteredCount, useMasteryStore } from '../store/masteryStore';
import { useStreakStore } from '../store/streakStore';
import { useJapaStore } from '../store/japaStore';
import { rankFor, useScoreStore } from '../store/scoreStore';
import { useAchievementsStore } from '../store/achievementsStore';
import { usePreferencesStore } from '../store/preferencesStore';
import { useDataStore } from '../store/dataStore';
import { todaysPanchang, TodayPanchang } from '../services/panchang';
import { track } from '../services/analytics';
import { FEATURED_HERO } from '../data/featured';
import { COMICS } from '../data/comics';
import { FaithChooser } from '../components/FaithChooser';
import { packIdOf, sortWallpapersForFaith } from '../data/wallpaperPacks';
import { useWallpaperCatalog } from '../store/wallpaperCatalogStore';

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
  const festivals = useDataStore((s) => s.festivals);
  const malas = useJapaStore((s) => s.malas);
  const [panchang, setPanchang] = useState<TodayPanchang | null>(null);
  const catalogWalls = useWallpaperCatalog((s) => s.wallpapers);
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
    useWallpaperCatalog.getState().load();
  }, []);

  // free-offer rail: ONE representative per pack (variety at a glance, not 4 temples)
  const wallThumbs = useMemo(() => {
    const sorted = sortWallpapersForFaith(catalogWalls, theme.key);
    const seen = new Set<string>();
    return sorted.filter((w) => {
      const p = packIdOf(w);
      if (seen.has(p)) return false;
      seen.add(p);
      return true;
    }).slice(0, 5);
  }, [catalogWalls, theme.key]);
  const hero = FEATURED_HERO[theme.key];

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
  const darshan = todaysDarshan(primary);

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

        {/* status row — the daily ritual at a glance; japa is part of the triad */}
        <View style={styles.statusRow}>
          <Pressable style={styles.stat} onPress={() => navigation.navigate('PathInfo')}>
            <Text style={styles.statNum}>🔥 {streak}</Text><Text style={styles.statLbl}>streak</Text>
          </Pressable>
          <Pressable style={styles.stat} onPress={() => navigation.navigate('PathInfo')}>
            <Text style={[styles.statNum, { color: theme.accent }]}>✦ {jnana}</Text><Text style={styles.statLbl}>{rank.current.name}</Text>
          </Pressable>
          <Pressable style={styles.stat} onPress={() => navigation.navigate('PathInfo')}>
            <Text style={styles.statNum}>🪔 {diyas}</Text><Text style={styles.statLbl}>diyas</Text>
          </Pressable>
          <Pressable style={styles.stat} onPress={() => navigation.navigate('Japa')}>
            <Text style={styles.statNum}>📿 {malas}</Text><Text style={styles.statLbl}>japa</Text>
          </Pressable>
        </View>

        {/* the one action */}
        <Pressable style={[styles.cta, { backgroundColor: theme.accent }]}
          onPress={() => navigation.navigate('Sadhana', { courseId: target?.id ?? faithCourses[0]?.id ?? courses[0]?.id })}>
          <Ionicons name="sparkles" size={20} color="#0b1220" />
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaTitle}>Begin today's sādhana</Text>
            <Text style={styles.ctaSub}>
              {totalDue > 0 ? `${totalDue} verse${totalDue === 1 ? '' : 's'} ready · ${target?.title}` : 'Start learning a new verse'}
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color="#0b1220" />
        </Pressable>

        {/* darshan card → temple — the temple is the heart, it comes first */}
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

        {/* ── the temple gives freely — real art, above the fold ── */}
        <Text style={[styles.section, { color: theme.accent }]}>THE TEMPLE GIVES FREELY</Text>

        {/* free hero card — faith-gated, actual art */}
        <Pressable
          style={styles.offerCard}
          onPress={() => { track('today_hero_tap', { hero: hero.title }); navigation.navigate(hero.route as any, hero.params as any); }}
        >
          <ExpoImage source={{ uri: hero.image }} style={StyleSheet.absoluteFill as any} contentFit="cover" transition={250} />
          <LinearGradient colors={['transparent', 'rgba(2,6,23,0.5)', 'rgba(2,6,23,0.95)']} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
          <View style={styles.offerBadge}><Text style={styles.offerBadgeTxt}>{hero.badge}</Text></View>
          <View style={styles.offerInner}>
            <Text style={styles.offerTitle}>{hero.title}</Text>
            <Text style={styles.offerSub}>{hero.sub}</Text>
          </View>
        </Pressable>

        {/* companion free book — compact row, keeps Today slim (Hindu content) */}
        {theme.key === 'Hindu' && (
          <Pressable
            style={styles.bookRow}
            onPress={() => { track('today_chalisa_tap'); navigation.navigate('KathaScroll', { comicId: 'hanuman-chalisa-illustrated' }); }}
          >
            <ExpoImage source={{ uri: COMICS[0].cover }} style={styles.bookThumb} contentFit="cover" transition={200} />
            <View style={{ flex: 1 }}>
              <View style={styles.offerBadgeInline}><Text style={styles.offerBadgeTxt}>FREE</Text></View>
              <Text style={styles.bookTitle}>Hanuman Chalisa — Illustrated</Text>
              <Text style={styles.bookSub}>Every verse on its own painting</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#64748b" />
          </Pressable>
        )}

        {/* free wallpapers rail — actual thumbs, faith-led order */}
        <Pressable onPress={() => { track('today_wallpapers_tap'); navigation.navigate('Wallpapers'); }}>
          <View style={styles.railHead}>
            <View style={styles.offerBadgeInline}><Text style={styles.offerBadgeTxt}>FREE</Text></View>
            <Text style={styles.railTitle}>Darshan wallpapers</Text>
            <Text style={[styles.railMore, { color: theme.accent }]}>See all →</Text>
          </View>
        </Pressable>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }} style={{ marginBottom: 20 }}>
          {wallThumbs.map((wp) => (
            <Pressable key={wp.id} onPress={() => { track('today_wallpaper_thumb_tap', { id: wp.id }); navigation.navigate('Wallpapers'); }}>
              <ExpoImage source={{ uri: wp.thumb }} style={styles.wallThumb} contentFit="cover" transition={200} />
            </Pressable>
          ))}
          {wallThumbs.length === 0 && [1, 2, 3, 4].map((i) => <View key={i} style={[styles.wallThumb, { backgroundColor: 'rgba(15,23,42,0.7)' }]} />)}
        </ScrollView>

        {/* Sahāra — the doorway for the moment of need */}
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

        {/* doorway to the full treasury */}
        <Pressable style={styles.mandirRow} onPress={() => navigation.navigate('Mandir' as any)}>
          <View style={[styles.readIcon, { backgroundColor: theme.accentSoft }]}>
            <Ionicons name="flame" size={20} color={theme.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.courseTitle}>Enter the {theme.key === 'Buddhist' ? 'Vihāra' : 'Mandir'}</Text>
            <Text style={styles.courseMeta}>Books · wallpapers · teachings · mantras — a place of abundance</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#475569" />
        </Pressable>
        <View style={{ height: 8 }} />

        {/* your courses */}
        <Text style={[styles.section, { color: theme.accent }]}>
          {inProgress.length ? 'CONTINUE LEARNING' : 'START A COURSE'}
        </Text>
        {(inProgress.length ? inProgress : faithCourses.slice(0, 4)).map((c) => (
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
  scroll: { paddingHorizontal: 18, paddingTop: 78, paddingBottom: 110 },
  greeting: { fontSize: 14, fontStyle: 'italic', marginBottom: 2 },
  title: { fontSize: 34, color: '#f8fafc', fontFamily: 'Playfair_Bold', marginBottom: 16 },
  panchang: { color: '#94a3b8', fontSize: 13, marginTop: -12, marginBottom: 16 },
  sahara: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: 'rgba(148,163,184,0.16)',
    backgroundColor: 'rgba(15,23,42,0.5)', borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 13, marginBottom: 16,
  },
  saharaLotus: { fontSize: 22 },
  saharaTitle: { color: '#f1f5f9', fontSize: 15, fontFamily: 'Playfair_Bold' },
  saharaSub: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  statusRow: { flexDirection: 'row', gap: 9, marginBottom: 18 },
  stat: { flex: 1, alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.55)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(148,163,184,0.14)', paddingVertical: 13 },
  statNum: { color: '#f8fafc', fontSize: 16.5, fontWeight: '800' },
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
  offerCard: { height: 190, borderRadius: 18, overflow: 'hidden', marginBottom: 18, justifyContent: 'flex-end', backgroundColor: '#0b1220' },
  offerInner: { padding: 14 },
  offerTitle: { color: '#f8fafc', fontSize: 21, fontFamily: 'Playfair_Bold' },
  offerSub: { color: '#cbd5e1', fontSize: 12, marginTop: 3 },
  offerBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: '#16a34a', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  offerBadgeInline: { alignSelf: 'flex-start', backgroundColor: '#16a34a', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  offerBadgeTxt: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  bookRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(15,23,42,0.5)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(148,163,184,0.12)', padding: 10, marginBottom: 18,
  },
  bookThumb: { width: 48, height: 66, borderRadius: 9, backgroundColor: '#0b1220' },
  bookTitle: { color: '#f1f5f9', fontSize: 14.5, fontFamily: 'Playfair_Bold', marginTop: 3 },
  bookSub: { color: '#94a3b8', fontSize: 11.5, marginTop: 2 },
  railHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  railTitle: { color: '#f1f5f9', fontSize: 16, fontFamily: 'Playfair_Bold', flex: 1 },
  railMore: { fontSize: 13, fontWeight: '700' },
  wallThumb: { width: 92, height: 172, borderRadius: 14, backgroundColor: '#0b1220' },
  mandirRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(15,23,42,0.5)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(251,191,36,0.28)', padding: 14, marginBottom: 22 },
  readIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  courseRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(15,23,42,0.5)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(148,163,184,0.12)', padding: 14, marginBottom: 10 },
  courseTitle: { color: '#f1f5f9', fontSize: 15.5, fontFamily: 'Playfair_Bold' },
  courseMeta: { color: '#94a3b8', fontSize: 12, marginTop: 3, marginBottom: 8 },
  bar: { height: 5, borderRadius: 3, backgroundColor: 'rgba(148,163,184,0.18)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
});
