import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import * as Sharing from 'expo-sharing';
import { Image as ExpoImage } from 'expo-image';
import { CourseVerse, getCourse } from '../data/courses';
import { MasteryCard } from '../components/MasteryCard';
import { PetalShower } from '../components/PetalShower';
import { ReciteRecorder } from '../components/ReciteRecorder';
import { VerseQuiz } from '../components/VerseQuiz';
import { useScoreStore } from '../store/scoreStore';
import { usePreferencesStore } from '../store/preferencesStore';
import { NARRATORS } from '../data/narrators';
import { REFLECTIONS } from '../data/reflections';

type VoiceVariant = { reciteKuber?: string; reciteShardul?: string; meaningHi?: string; meaningEn?: string };
const VOICES_BASE = 'https://aiwugigdrvijjeoqtpog.supabase.co/storage/v1/object/public/dharma-audio/voices';

const reflectionFor = (sanskrit: string) => REFLECTIONS[sanskrit.split(/\s+/).join(' ')];
import { getFaithTheme } from '../data/faiths';
import { getPlayableUri } from '../services/streamCache';
import { buildTodayQueue, Grade, useMasteryStore } from '../store/masteryStore';
import { useStreakStore } from '../store/streakStore';

const haptic = (s: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
  try { Haptics.impactAsync(s); } catch { /* noop */ }
};

export const SadhanaScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const course = getCourse(route.params?.courseId);
  const theme = getFaithTheme('Hindu');
  const records = useMasteryStore((s) => s.records);
  const loaded = useMasteryStore((s) => s.loaded);
  const newPerDay = useMasteryStore((s) => s.newPerDay);
  const jnana = useScoreStore((s) => s.jnana);
  const diyas = useScoreStore((s) => s.diyas);
  const meaningLang = usePreferencesStore((s) => s.meaningLang);
  const narrator = usePreferencesStore((s) => s.narrator);
  const [variants, setVariants] = useState<Record<string, VoiceVariant>>({});

  // Live voice-variant manifest (Kuber/Shardul recite + Hindi/English meaning). Graceful if absent.
  useEffect(() => {
    let alive = true;
    fetch(`${VOICES_BASE}/${course.id}.json`)
      .then((r) => r.json())
      .then((d) => { if (alive && d && typeof d === 'object') setVariants(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, [course.id]);

  // Build the day's queue once, when the engine has loaded.
  const queue = useMemo<CourseVerse[]>(() => {
    if (!loaded) return [];
    return buildTodayQueue(course.verses, records as any, newPerDay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [graded, setGraded] = useState(0);
  const [masteredNow, setMasteredNow] = useState(0);
  const [justMastered, setJustMastered] = useState<CourseVerse[]>([]);
  const soundRef = useRef<Audio.Sound | null>(null);
  const cardRef = useRef<View>(null);

  useEffect(() => { useMasteryStore.getState().load(); useScoreStore.getState().load(); }, []);
  useEffect(() => () => { soundRef.current?.unloadAsync().catch(() => {}); }, []);

  const verse = queue[idx];
  const isNew = verse ? !records[verse.id] : false;
  const done = loaded && (queue.length === 0 || idx >= queue.length);

  // New verses are shown fully (learning); reviews start hidden (recall test).
  useEffect(() => { setRevealed(isNew); }, [idx, isNew]);

  const play = async () => {
    if (!verse) return;
    haptic();
    try {
      await soundRef.current?.unloadAsync();
      const v = variants[verse.id];
      const recite = narrator === 'shardul' ? v?.reciteShardul : v?.reciteKuber;
      const source = recite
        ? { uri: await getPlayableUri(recite) }                         // chosen narrator
        : typeof verse.audio === 'string'
          ? { uri: await getPlayableUri(verse.audio) }                  // streamed combined
          : verse.audio;                                               // bundled require()
      const { sound } = await Audio.Sound.createAsync(source as any, { shouldPlay: true });
      soundRef.current = sound;
    } catch { /* network hiccup; ignore */ }
  };

  // Play the meaning in the chosen language (Hindi=Kuber, English=Bill). Variant-only.
  const meaningAudio = (() => {
    const v = verse ? variants[verse.id] : undefined;
    return meaningLang === 'en' ? v?.meaningEn : v?.meaningHi;
  })();
  const playMeaning = async () => {
    if (!meaningAudio) return;
    haptic();
    try {
      await soundRef.current?.unloadAsync();
      const { sound } = await Audio.Sound.createAsync({ uri: await getPlayableUri(meaningAudio) }, { shouldPlay: true });
      soundRef.current = sound;
    } catch { /* ignore */ }
  };

  const grade = async (g: Grade) => {
    if (!verse) return;
    haptic(g === 'knew' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    const before = (records[verse.id]?.box ?? 0) >= 4;
    await useMasteryStore.getState().recordRecall(verse.id, g);
    const after = (useMasteryStore.getState().records[verse.id]?.box ?? 0) >= 4;
    if (!before && after) {
      setMasteredNow((m) => m + 1);
      setJustMastered((list) => [...list, verse]);
    }
    if (isNew && g !== 'forgot') useScoreStore.getState().award(10, 0); // learning a new verse
    setGraded((n) => n + 1);
    await soundRef.current?.unloadAsync().catch(() => {});
    setIdx((i) => i + 1);
  };

  // Quiz result → award points + feed the SRS (correct = knew, wrong = review again).
  const quizResult = async (correct: boolean) => {
    if (correct) await useScoreStore.getState().award(20, 1, true);
    else await useScoreStore.getState().award(0, 0, false);
    await grade(correct ? 'knew' : 'forgot');
  };

  useEffect(() => {
    if (done && graded > 0) {
      // Completing a sādhana counts as today's darshan/streak.
      useStreakStore.getState().load().then(() => useStreakStore.getState().recordVisit());
      useScoreStore.getState().award(0, 5); // diyas for completing today's sādhana
      // Triumphant haptic — the "bling".
      try {
        Haptics.notificationAsync(
          masteredNow > 0 ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
        );
      } catch { /* noop */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const reward = justMastered[0];
  const shareReward = async () => {
    haptic(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { captureRef } = require('react-native-view-shot');
      if (cardRef.current && (await Sharing.isAvailableAsync())) {
        const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your milestone' });
        return;
      }
    } catch { /* fall through */ }
    try {
      await Share.share({ message: `I just learned ${reward?.titleHi} of the ${course.title} by heart 🪔\n\n${reward?.sanskrit}\n\n— Dharma` });
    } catch { /* dismissed */ }
  };

  // ---------- completion ----------
  if (done) {
    const streak = useStreakStore.getState().currentStreak;
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#020617', '#0b1220', '#020617']} style={StyleSheet.absoluteFill} />
        {masteredNow > 0 && <PetalShower />}
        <ScrollView contentContainerStyle={styles.doneWrap}>
          <Text style={styles.doneMark}>🪔</Text>
          <Text style={styles.doneTitle}>
            {graded > 0 ? 'Sādhana complete' : 'All caught up'}
          </Text>
          <Text style={styles.doneSub}>
            {graded > 0
              ? `You strengthened ${graded} verse${graded === 1 ? '' : 's'} today.`
              : 'Nothing due right now — come back tomorrow for your next review.'}
          </Text>
          {graded > 0 && (
            <View style={[styles.statCard, { borderColor: theme.accentSoft }]}>
              <View style={styles.statRow}>
                <Text style={styles.statNum}>{masteredNow}</Text>
                <Text style={styles.statLbl}>by heart</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={[styles.statNum, { color: theme.accent }]}>✦ {jnana}</Text>
                <Text style={styles.statLbl}>Jñāna</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statNum}>🪔 {diyas}</Text>
                <Text style={styles.statLbl}>diyas</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={[styles.statNum, { color: theme.accent }]}>🔥 {streak}</Text>
                <Text style={styles.statLbl}>streak</Text>
              </View>
            </View>
          )}

          {reward && (
            <View style={styles.rewardWrap}>
              <Text style={styles.rewardLine}>You learned {reward.titleHi} by heart 🎉</Text>
              <View style={styles.cardScale}>
                <MasteryCard ref={cardRef} sanskrit={reward.sanskrit} titleHi={reward.titleHi} artUrl={reward.artUrl} />
              </View>
              <Pressable style={[styles.shareBtn, { borderColor: theme.accent }]} onPress={shareReward}>
                <Ionicons name="share-social" size={18} color={theme.accent} />
                <Text style={[styles.shareTxt, { color: theme.accent }]}>Share this milestone</Text>
              </Pressable>
            </View>
          )}

          <Pressable style={[styles.cta, { backgroundColor: theme.accent }]} onPress={() => navigation.goBack()}>
            <Text style={styles.ctaText}>Done</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  if (!verse) {
    return <View style={styles.container}><LinearGradient colors={['#020617', '#0b1220']} style={StyleSheet.absoluteFill} /></View>;
  }

  const total = queue.length;
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#020617', '#0b1220', '#020617']} style={StyleSheet.absoluteFill} />

      {/* progress */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={16}><Ionicons name="close" size={24} color="#94a3b8" /></Pressable>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(idx / total) * 100}%`, backgroundColor: theme.accent }]} />
        </View>
        <Text style={styles.progressTxt}>{idx + 1}/{total}</Text>
      </View>

      <View style={styles.scoreStrip}>
        <Text style={[styles.scoreText, { color: theme.accent }]}>✦ {jnana} Jñāna</Text>
        <Text style={styles.scoreText}>🪔 {diyas}</Text>
      </View>

      {/* meaning-language + narrator toggles */}
      <View style={styles.toggleRow}>
        <View style={styles.segGroup}>
          {(['hi', 'en'] as const).map((l) => (
            <Pressable key={l} onPress={() => usePreferencesStore.getState().setMeaningLang(l)}
              style={[styles.seg, meaningLang === l && { backgroundColor: theme.accent }]}>
              <Text style={[styles.segTxt, meaningLang === l && styles.segActive]}>{l === 'hi' ? 'हिंदी' : 'English'}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.segGroup}>
          {(['kuber', 'shardul'] as const).map((n) => (
            <Pressable key={n} onPress={() => usePreferencesStore.getState().setNarrator(n)}
              style={[styles.seg, narrator === n && { backgroundColor: theme.accent }]}>
              <Text style={[styles.segTxt, narrator === n && styles.segActive]}>{NARRATORS[n]}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {verse.artUrl && (
          <View style={styles.heroWrap}>
            <ExpoImage
              source={{ uri: verse.artUrl }}
              style={styles.hero}
              contentFit="cover"
              transition={250}
              cachePolicy="memory-disk"
            />
            <LinearGradient
              colors={['transparent', 'rgba(2,6,23,0.85)']}
              style={styles.heroFade}
            />
          </View>
        )}
        <Text style={[styles.kicker, { color: theme.accent }]}>
          {isNew ? 'NEW VERSE' : 'REVIEW'} · {verse.titleHi}
        </Text>
        <Text style={styles.sanskrit}>{verse.sanskrit}</Text>

        <Pressable style={[styles.playBtn, { borderColor: theme.accent }]} onPress={play}>
          <Ionicons name="volume-high" size={18} color={theme.accent} />
          <Text style={[styles.playTxt, { color: theme.accent }]}>
            Hear it in {NARRATORS[narrator]}'s voice
          </Text>
        </Pressable>

        {!isNew ? (
          <View style={styles.quizWrap}>
            <VerseQuiz verse={verse} pool={course.verses} accent={theme.accent} onResult={quizResult} />
          </View>
        ) : !revealed ? (
          <Pressable style={styles.revealBtn} onPress={() => { haptic(); setRevealed(true); }}>
            <Text style={styles.revealTxt}>Recall the meaning… then tap to reveal</Text>
          </Pressable>
        ) : (
          <View style={styles.revealBox}>
            <Text style={[styles.translit, { borderLeftColor: theme.accent }]}>{verse.transliteration}</Text>
            <Text style={styles.meaning}>{meaningLang === 'en' ? verse.meaningEn : verse.meaningHi}</Text>
            {!!meaningAudio && (
              <Pressable style={[styles.meaningBtn, { borderColor: theme.accent }]} onPress={playMeaning}>
                <Ionicons name="volume-medium" size={16} color={theme.accent} />
                <Text style={[styles.playTxt, { color: theme.accent }]}>
                  Hear the meaning · {meaningLang === 'en' ? 'English' : 'हिंदी'}
                </Text>
              </Pressable>
            )}
            {(() => {
              const r = reflectionFor(verse.sanskrit);
              return r ? (
                <View style={[styles.reflectCard, { borderColor: theme.accentSoft }]}>
                  <Text style={[styles.reflectKicker, { color: theme.accent }]}>FOR TODAY</Text>
                  <Text style={styles.reflectText}>{r.reflection}</Text>
                  {!!r.insight && <Text style={styles.reflectInsight}>{r.insight}</Text>}
                </View>
              ) : null;
            })()}
            <ReciteRecorder accent={theme.accent} />
          </View>
        )}
      </ScrollView>

      {/* self-graded recall (new verses only; reviews are quizzed) */}
      {isNew && revealed && (
        <View style={styles.gradeBar}>
          <Text style={styles.gradeQ}>{isNew ? 'Ready to start learning it?' : 'How well did you know it?'}</Text>
          <View style={styles.gradeRow}>
            <Pressable style={[styles.gradeBtn, { borderColor: '#ef4444' }]} onPress={() => grade('forgot')}>
              <Text style={[styles.gradeBtnTxt, { color: '#f87171' }]}>Forgot</Text>
            </Pressable>
            <Pressable style={[styles.gradeBtn, { borderColor: '#eab308' }]} onPress={() => grade('okay')}>
              <Text style={[styles.gradeBtnTxt, { color: '#facc15' }]}>Almost</Text>
            </Pressable>
            <Pressable style={[styles.gradeBtn, { borderColor: '#22c55e' }]} onPress={() => grade('knew')}>
              <Text style={[styles.gradeBtnTxt, { color: '#4ade80' }]}>Knew it</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 56, paddingHorizontal: 18, paddingBottom: 8 },
  progressBar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(148,163,184,0.2)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressTxt: { color: '#94a3b8', fontSize: 12, width: 38, textAlign: 'right' },
  scoreStrip: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 6 },
  scoreText: { fontSize: 13, fontWeight: '700', color: '#cbd5e1' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18, paddingBottom: 8 },
  segGroup: { flexDirection: 'row', backgroundColor: 'rgba(148,163,184,0.15)', borderRadius: 999, padding: 3 },
  seg: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  segTxt: { color: '#cbd5e1', fontSize: 12.5, fontWeight: '700' },
  segActive: { color: '#0b1220' },
  meaningBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, marginTop: 4 },
  quizWrap: { marginTop: 4 },
  scroll: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 30 },
  heroWrap: { height: 230, borderRadius: 18, overflow: 'hidden', marginBottom: 18, backgroundColor: 'rgba(15,23,42,0.6)' },
  hero: { width: '100%', height: '100%' },
  heroFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 90 },
  kicker: { fontSize: 12, letterSpacing: 2, fontWeight: '800', marginBottom: 14 },
  sanskrit: { color: '#f8fafc', fontSize: 24, fontFamily: 'Playfair_Medium', lineHeight: 38, marginBottom: 20 },
  playBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 24 },
  playTxt: { fontSize: 14, fontWeight: '600' },
  revealBtn: { borderWidth: 1, borderColor: 'rgba(148,163,184,0.3)', borderStyle: 'dashed', borderRadius: 16, padding: 20, alignItems: 'center' },
  revealTxt: { color: '#94a3b8', fontSize: 14 },
  revealBox: { gap: 14 },
  translit: { color: '#cbd5e1', fontSize: 15, fontStyle: 'italic', lineHeight: 23, borderLeftWidth: 2, paddingLeft: 14 },
  meaning: { color: '#e2e8f0', fontSize: 16.5, lineHeight: 26, fontFamily: 'Playfair_Regular' },
  reflectCard: { borderWidth: 1, borderRadius: 14, padding: 14, backgroundColor: 'rgba(15,23,42,0.5)', gap: 6 },
  reflectKicker: { fontSize: 10, letterSpacing: 1.5, fontWeight: '800' },
  reflectText: { color: '#e2e8f0', fontSize: 14.5, lineHeight: 21 },
  reflectInsight: { color: '#94a3b8', fontSize: 13, fontStyle: 'italic', lineHeight: 19 },
  gradeBar: { paddingHorizontal: 18, paddingBottom: 34, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(148,163,184,0.12)' },
  gradeQ: { color: '#cbd5e1', fontSize: 13, textAlign: 'center', marginBottom: 12 },
  gradeRow: { flexDirection: 'row', gap: 10 },
  gradeBtn: { flex: 1, borderWidth: 1.5, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  gradeBtnTxt: { fontSize: 14, fontWeight: '700' },
  doneWrap: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, paddingVertical: 70 },
  rewardWrap: { alignItems: 'center', marginBottom: 26 },
  rewardLine: { color: '#e2e8f0', fontSize: 15, fontWeight: '600', marginBottom: 14, textAlign: 'center' },
  cardScale: { borderRadius: 18, overflow: 'hidden', marginBottom: 16 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 20, paddingVertical: 12 },
  shareTxt: { fontSize: 14, fontWeight: '700' },
  doneMark: { fontSize: 56, marginBottom: 16 },
  doneTitle: { color: '#f8fafc', fontSize: 28, fontFamily: 'Playfair_Bold', marginBottom: 8 },
  doneSub: { color: '#94a3b8', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  statCard: { flexDirection: 'row', gap: 16, borderWidth: 1, borderRadius: 18, paddingVertical: 18, paddingHorizontal: 18, marginBottom: 30 },
  statRow: { alignItems: 'center' },
  statNum: { color: '#f8fafc', fontSize: 20, fontWeight: '800' },
  statLbl: { color: '#94a3b8', fontSize: 11, marginTop: 4 },
  cta: { borderRadius: 16, paddingVertical: 16, paddingHorizontal: 60, alignItems: 'center' },
  ctaText: { color: '#0b1220', fontSize: 16, fontWeight: '800' },
});
