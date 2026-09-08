import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { COURSE_LIST, getCourse } from '../data/courses';
import { getFaithTheme } from '../data/faiths';
import { buildTodayQueue, masteredCount, useMasteryStore } from '../store/masteryStore';
import { useStreakStore } from '../store/streakStore';
import { useJapaStore } from '../store/japaStore';
import { rankFor, useScoreStore } from '../store/scoreStore';
import { useAchievementsStore } from '../store/achievementsStore';
import { usePreferencesStore } from '../store/preferencesStore';
import { track } from '../services/analytics';

/**
 * Path — learning + meditative growth as its own tab (IA reorg, Phase 1).
 * Your scorecard, the one course catalog (absorbs the Today/Mandir copies),
 * Reflections, and Jyotish last — deliberately unannounced, Hindu-gated.
 * Promoted from the old Learn stack screen; the "Learn" route now redirects
 * here so old deep links keep working.
 */
export const PathScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const records = useMasteryStore((s) => s.records);
  const newPerDay = useMasteryStore((s) => s.newPerDay);
  const streak = useStreakStore((s) => s.currentStreak);
  const jnana = useScoreStore((s) => s.jnana);
  const diyas = useScoreStore((s) => s.diyas);
  const malas = useJapaStore((s) => s.malas);

  const primary = usePreferencesStore((s) => s.primaryTradition);
  const theme = getFaithTheme(primary);
  const rank = rankFor(jnana);

  useFocusEffect(useCallback(() => {
    useMasteryStore.getState().load();
    useScoreStore.getState().load();
    useStreakStore.getState().load();
    useAchievementsStore.getState().load().then(() => useAchievementsStore.getState().evaluate());
  }, []));

  // your own tradition leads; canonical accents from the faith system
  const groups = useMemo(() => {
    const all = [
      { faith: 'Hindu', accent: getFaithTheme('Hindu').accent, courses: COURSE_LIST.filter((c) => c.faith === 'Hindu') },
      { faith: 'Buddhist', accent: getFaithTheme('Buddhist').accent, courses: COURSE_LIST.filter((c) => c.faith === 'Buddhist') },
    ];
    return primary === 'Buddhist' ? all.reverse() : all;
  }, [primary]);

  const Card = ({ c, accent }: { c: typeof COURSE_LIST[number]; accent: string }) => {
    const course = getCourse(c.id);
    const ids = course.verses.map((v) => v.id);
    const mastered = masteredCount(ids, records as any);
    // due-count as a quiet badge — Today owns the one sādhana CTA
    const due = ids.some((id) => records[id]) ? buildTodayQueue(course.verses, records as any, newPerDay).length : 0;
    const art = course.verses[0]?.artUrl;
    return (
      <Pressable style={styles.card} onPress={() => navigation.navigate('ChalisaPath', { courseId: c.id })}>
        <LinearGradient
          colors={[`${accent}22`, `${accent}07`]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.cardGrad}
        >
          {art ? (
            <ExpoImage source={{ uri: art }} style={styles.artThumb} contentFit="cover" cachePolicy="memory-disk" />
          ) : (
            <View style={[styles.icon, { backgroundColor: `${accent}22` }]}>
              <Ionicons name="sparkles" size={24} color={accent} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{c.title}</Text>
            <Text style={styles.cardSub} numberOfLines={1}>{c.subtitle}</Text>
            <Text style={styles.cardMeta}>
              {mastered > 0 ? `${mastered}/${c.count} by heart` : `${c.count} verses`}
            </Text>
          </View>
          {due > 0 && (
            <View style={[styles.dueBadge, { backgroundColor: `${accent}22` }]}>
              <Text style={[styles.dueBadgeTxt, { color: accent }]}>{due} due</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={22} color="#475569" />
        </LinearGradient>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#020617', '#0b1220', '#020617']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.kicker, { color: theme.accent }]}>YOUR GROWTH</Text>
        <Text style={styles.title}>The Path</Text>
        <Text style={styles.headerSub}>Learn the scriptures by heart — one verse a day.</Text>

        {/* ── slot 2: Dhyāna — the meditative half of the category ─────── */}
        <Pressable style={styles.linkRow} onPress={() => navigation.navigate('Dhyana')}>
          <Text style={styles.linkIcon}>🪔</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Dhyāna · ध्यान</Text>
            <Text style={styles.cardSub}>A meditation room in the Mandir</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#475569" />
        </Pressable>

        {/* ── slot 3: Mantra Vidyā — learn the mantras you already say ──── */}
        <Pressable style={styles.linkRow} onPress={() => navigation.navigate('VidyaShelf')}>
          <Text style={styles.linkIcon}>🕉️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Mantra Vidyā · मन्त्र विद्या</Text>
            <Text style={styles.cardSub}>The words you already say — and what they mean</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#475569" />
        </Pressable>

        {/* scorecard — progress is Path's subject */}
        <View style={styles.statusRow}>
          <Pressable style={styles.stat} onPress={() => navigation.navigate('PathInfo')}>
            <Text style={styles.statNum}>{streak}</Text><Text style={styles.statLbl}>{streak === 1 ? 'day of practice' : 'days of practice'}</Text>
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
        <Pressable style={styles.linkRow} onPress={() => navigation.navigate('Achievements')}>
          <Text style={styles.linkIcon}>🏅</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Siddhis</Text>
            <Text style={styles.cardSub}>Milestones on your path</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#475569" />
        </Pressable>

        {/* the one course catalog (Today and Mandir link here) */}
        {groups.map((g) => g.courses.length > 0 && (
          <View key={g.faith}>
            <Text style={[styles.section, { color: g.accent }]}>{g.faith.toUpperCase()}</Text>
            {g.courses.map((c) => <Card key={c.id} c={c} accent={g.accent} />)}
          </View>
        ))}

        {/* Reflections — essays are learning, not temple goods */}
        <Text style={[styles.section, { color: theme.accent }]}>REFLECTIONS</Text>
        <Pressable style={styles.linkRow} onPress={() => navigation.navigate('Articles')}>
          <Text style={styles.linkIcon}>📜</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Reflections</Text>
            <Text style={styles.cardSub}>Essays on the stories & their meaning</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#475569" />
        </Pressable>

        {/* Jyotish — last, no badge, deliberately unannounced; Hindu-gated
            (never shown to Buddhist users, carried from MandirScreen) */}
        {theme.key === 'Hindu' && (
          <Pressable style={styles.linkRow} onPress={() => { track('jyotish_entry_path'); navigation.navigate('JyotishHome'); }}>
            <Text style={styles.linkIcon}>🪐</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Path of the Sky · ज्योतिष</Text>
              <Text style={styles.cardSub}>Learn to read a birth chart, as a game</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#475569" />
          </Pressable>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  scroll: { paddingHorizontal: 16, paddingTop: 64, paddingBottom: 110 },
  kicker: { fontSize: 11, letterSpacing: 2.5, fontWeight: '800' },
  title: { fontSize: 32, fontFamily: 'Playfair_Bold', color: '#f8fafc', marginTop: 4 },
  headerSub: { fontSize: 14, color: '#94a3b8', marginTop: 4, marginBottom: 16 },
  statusRow: { flexDirection: 'row', gap: 9, marginBottom: 10 },
  stat: { flex: 1, alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.55)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(148,163,184,0.14)', paddingVertical: 13, paddingHorizontal: 4 },
  statNum: { color: '#f8fafc', fontSize: 16.5, fontWeight: '800' },
  statLbl: { color: '#94a3b8', fontSize: 10.5, marginTop: 4, textAlign: 'center' },
  section: { fontSize: 12, letterSpacing: 1.5, fontWeight: '800', marginTop: 22, marginBottom: 12 },
  card: { borderRadius: 18, overflow: 'hidden', marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  cardGrad: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  icon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  artThumb: { width: 50, height: 50, borderRadius: 14, backgroundColor: 'rgba(15,23,42,0.6)' },
  cardTitle: { fontSize: 17, fontFamily: 'Playfair_Bold', color: '#f1f5f9' },
  cardSub: { fontSize: 12.5, color: '#94a3b8', marginTop: 2 },
  cardMeta: { fontSize: 12, color: '#64748b', marginTop: 6 },
  dueBadge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  dueBadgeTxt: { fontSize: 11, fontWeight: '800' },
  linkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(15,23,42,0.5)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(148,163,184,0.12)', padding: 14, marginBottom: 10,
  },
  linkIcon: { fontSize: 22 },
});
