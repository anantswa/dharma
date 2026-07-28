import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import Animated, {
  Easing, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming,
} from 'react-native-reanimated';
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

const HERO_H = 240;
const ROW_H = 62; // 44px thumb + 2×9 vertical padding

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
  const todayQueue = buildTodayQueue(verses, records as any, newPerDay);
  const dueToday = todayQueue.length;
  const pct = total ? mastered / total : 0;
  // The pilgrimage's "you are here": the next verse you'll practice.
  const current = todayQueue[0] ?? verses[0];
  const heroArt = current?.artUrl ?? verses.find((v) => v.artUrl)?.artUrl;
  const currentIdx = current ? verses.findIndex((v) => v.id === current.id) : -1;

  const scrollRef = useRef<ScrollView>(null);
  const didScrollRef = useRef(false);

  // "You are here" pulse on the current bead.
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [pulse]);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.35 }],
    opacity: 0.75 - pulse.value * 0.45,
  }));

  // Overall rank from how much is by heart (scales to any course length).
  const rank =
    mastered >= total ? 'Siddha · complete'
    : mastered >= Math.round(total * 0.66) ? 'Siddha'
    : mastered >= Math.round(total * 0.33) ? 'Upāsaka'
    : mastered >= 1 ? 'Shishya'
    : 'Begin';
  // "Daily goal" = clear today's due queue.
  const goalMet = dueToday === 0 && mastered > 0;

  // Nearest rank milestone (same thresholds as `rank`).
  const t33 = Math.round(total * 0.33);
  const t66 = Math.round(total * 0.66);
  const milestone =
    mastered >= total ? null
    : mastered >= t66 ? { need: total - mastered, name: 'completion' }
    : mastered >= t33 ? { need: t66 - mastered, name: 'Siddha' }
    : mastered >= 1 ? { need: t33 - mastered, name: 'Upāsaka' }
    : { need: 1, name: 'Shishya' };

  const bead = (lvl: MasteryLevel) => {
    if (lvl === 'siddha') {
      return (
        <View style={[styles.beadHalo, { backgroundColor: `${theme.accent}2e` }]}>
          <View style={[styles.bead, {
            backgroundColor: theme.accent,
            shadowColor: theme.accent, shadowOpacity: 0.9, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 6,
          }]} />
        </View>
      );
    }
    if (lvl === 'upasaka') return <View style={[styles.bead, { backgroundColor: theme.accent }]} />;
    if (lvl === 'shishya') return <View style={[styles.bead, { borderWidth: 1.5, borderColor: theme.accent }]} />;
    return <View style={[styles.bead, styles.beadDim]} />;
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#020617', '#0b1220', '#020617']} style={StyleSheet.absoluteFill} />

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* hero — the current verse's painting, scrimmed, title + rank over it */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.hero}>
          {heroArt ? (
            <ExpoImage source={{ uri: heroArt }} style={StyleSheet.absoluteFill as any} contentFit="cover" transition={250} cachePolicy="memory-disk" />
          ) : (
            <LinearGradient colors={['#0b1220', '#020617']} style={StyleSheet.absoluteFill} />
          )}
          <LinearGradient
            colors={['transparent', 'rgba(2,6,23,0.55)', 'rgba(2,6,23,0.95)']}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.heroBottom}>
            <Text style={[styles.kicker, { color: theme.accent }]}>LEARN BY HEART</Text>
            <View style={styles.heroTitleRow}>
              <Text style={styles.title} numberOfLines={2}>{course.title}</Text>
              <View style={[styles.rankBadge, { borderColor: theme.accent, backgroundColor: 'rgba(2,6,23,0.55)' }]}>
                <Text style={[styles.rankTxt, { color: theme.accent }]}>{rank}</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>{total} verses · {course.subtitle}</Text>
          </View>
        </Animated.View>

        <View style={styles.body}>
          {/* progress */}
          <Animated.View entering={FadeInDown.delay(120).duration(500)} style={[styles.progressCard, { borderColor: theme.accentSoft }]}>
            <View style={styles.progressTop}>
              <Text style={styles.progressBig}>{mastered}<Text style={styles.progressOf}> / {total}</Text></Text>
              <Text style={styles.progressLbl}>by heart</Text>
            </View>
            <View style={styles.bar}>
              <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: theme.accent }]} />
            </View>
            <View style={styles.goalRow}>
              <Ionicons
                name={goalMet ? 'checkmark-circle' : 'ellipse-outline'}
                size={16}
                color={goalMet ? theme.accent : '#64748b'}
              />
              <Text style={styles.goalTxt}>
                {goalMet ? "Today's goal complete 🎉" : `Today's goal · ${dueToday} verse${dueToday === 1 ? '' : 's'} to practice`}
              </Text>
            </View>
            {milestone && (
              <Text style={[styles.milestoneTxt, { color: theme.accent }]}>
                {milestone.need} verse{milestone.need === 1 ? '' : 's'} from {milestone.name}
              </Text>
            )}
          </Animated.View>

          {/* today's sadhana CTA */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <Pressable style={[styles.cta, { backgroundColor: theme.accent }]} onPress={() => navigation.navigate('Sadhana', { courseId: course.id })}>
              <Ionicons name="sparkles" size={18} color="#0b1220" />
              <Text style={styles.ctaText}>
                {dueToday > 0 ? `Begin today's sādhana · ${dueToday}` : 'Practice (all caught up)'}
              </Text>
            </Pressable>
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(260).duration(500)} style={styles.ladderLine}>
            Shishya → Upāsaka → Siddha — a verse becomes yours in stages.
          </Animated.Text>

          {/* the bead path — every verse a bead on the pilgrimage */}
          <View
            style={styles.path}
            onLayout={(e) => {
              // Bring "you are here" into view once, after the entering animations settle.
              if (didScrollRef.current || currentIdx <= 3) return;
              didScrollRef.current = true;
              const y = HERO_H + e.nativeEvent.layout.y + currentIdx * ROW_H - 200;
              setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, y), animated: true }), 450);
            }}
          >
            <View style={styles.pathLine} />
            {verses.map((v, i) => {
              const lvl = levelForBox(records[v.id]?.box);
              const isCurrent = i === currentIdx;
              return (
                <Animated.View
                  key={v.id}
                  entering={FadeInDown.delay(Math.min(320 + i * 35, 900)).duration(450)}
                  style={styles.row}
                >
                  <View style={styles.beadCol}>
                    {isCurrent && (
                      <Animated.View style={[styles.pulseRing, { borderColor: theme.accent }, pulseStyle]} />
                    )}
                    {bead(lvl)}
                  </View>
                  {v.artUrl ? (
                    <ExpoImage source={{ uri: v.artUrl }} style={styles.thumb} contentFit="cover" cachePolicy="memory-disk" />
                  ) : (
                    <View style={[styles.thumb, { backgroundColor: 'rgba(148,163,184,0.15)' }]} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{v.titleHi}</Text>
                    <Text style={styles.rowVerse} numberOfLines={1}>{v.sanskrit}</Text>
                  </View>
                  <Text style={[styles.rowLvl, { color: lvl === 'new' ? '#475569' : theme.accent }]}>
                    {LEVEL_LABEL[lvl]}
                  </Text>
                </Animated.View>
              );
            })}
          </View>
          <Text style={styles.footer}>🪔  Spaced repetition · your progress saves automatically</Text>
        </View>
      </ScrollView>

      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={16} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#f8fafc" />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  topBar: { position: 'absolute', top: 52, left: 14 },
  backBtn: {
    width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(2,6,23,0.6)',
  },
  scroll: { paddingBottom: 60 },
  hero: { height: 240, justifyContent: 'flex-end', backgroundColor: '#0b1220', overflow: 'hidden' },
  heroBottom: { paddingHorizontal: 20, paddingBottom: 14 },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  kicker: { fontSize: 12, letterSpacing: 3, fontWeight: '800' },
  title: { flex: 1, fontSize: 28, color: '#f8fafc', fontFamily: 'Playfair_Bold', marginTop: 4 },
  subtitle: { fontSize: 13.5, color: '#cbd5e1', marginTop: 6 },
  body: { paddingHorizontal: 20, paddingTop: 16 },
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
  milestoneTxt: { fontSize: 12.5, fontWeight: '700', marginTop: 8 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, paddingVertical: 16, marginBottom: 16 },
  ctaText: { color: '#0b1220', fontSize: 16, fontWeight: '800' },
  ladderLine: { color: '#94a3b8', fontSize: 12.5, fontStyle: 'italic', marginBottom: 14 },
  path: { position: 'relative' },
  pathLine: { position: 'absolute', left: 11, top: 22, bottom: 22, width: 2, backgroundColor: 'rgba(148,163,184,0.15)', borderRadius: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 },
  beadCol: { width: 24, height: 26, alignItems: 'center', justifyContent: 'center' },
  bead: { width: 12, height: 12, borderRadius: 6 },
  pulseRing: { position: 'absolute', width: 26, height: 26, borderRadius: 13, borderWidth: 1.5 },
  beadDim: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(148,163,184,0.25)' },
  beadHalo: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  thumb: { width: 44, height: 44, borderRadius: 10, backgroundColor: 'rgba(15,23,42,0.6)' },
  rowTitle: { color: '#f1f5f9', fontSize: 14, fontWeight: '600' },
  rowVerse: { color: '#64748b', fontSize: 12.5, marginTop: 2, fontFamily: 'Playfair_Medium' },
  rowLvl: { fontSize: 11, fontWeight: '700' },
  footer: { color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 18 },
});
