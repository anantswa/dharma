import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Share, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import * as Sharing from 'expo-sharing';
import { Image as ExpoImage } from 'expo-image';
import Animated, {
  Easing, FadeIn, FadeInDown, FadeOut, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { CourseVerse, getCourse } from '../data/courses';
import { ClozeRecall } from '../components/ClozeRecall';
import { MasteryCard } from '../components/MasteryCard';
import { PetalShower } from '../components/PetalShower';
import { ReciteRecorder } from '../components/ReciteRecorder';
import { VerseQuiz } from '../components/VerseQuiz';
import { useScoreStore } from '../store/scoreStore';
import { usePreferencesStore } from '../store/preferencesStore';
import { NARRATORS } from '../data/narrators';
import { REFLECTIONS } from '../data/reflections';

type VoiceVariant = { reciteKuber?: string; reciteShardul?: string; meaningHi?: string; meaningEn?: string };
const VOICES_BASE = 'https://dharmaweave.com/cdn/dharma-audio/voices';
const BELL_URL = 'https://dharmaweave.com/cdn/dharma-audio/sfx/bell_soft.mp3';

// Soft temple bell for ritual thresholds (sankalpa begin, completion). Cached through
// the same stream-then-cache path as narration (pre-warmed on mount), fire-and-forget,
// self-unloading, silent on failure — never touches the narration channel.
/** Bell disabled 2026-08-02 (Anant) — the sound works, the moment needs more thought. */
const BELL_ENABLED = false;
const playBell = async () => {
  if (!BELL_ENABLED) return;
  try {
    const uri = await getPlayableUri(BELL_URL);
    const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true, volume: 0.6 });
    sound.setOnPlaybackStatusUpdate((st) => {
      if (st.isLoaded && st.didJustFinish) sound.unloadAsync().catch(() => {});
    });
  } catch { /* silent */ }
};

const reflectionFor = (sanskrit: string) => REFLECTIONS[sanskrit.split(/\s+/).join(' ')];
import { getFaithTheme } from '../data/faiths';
import { getPlayableUri } from '../services/streamCache';
import { buildTodayQueue, Grade, useMasteryStore } from '../store/masteryStore';
import { useStreakStore } from '../store/streakStore';
import { getAchievement, useAchievementsStore } from '../store/achievementsStore';
import { useDedicationStore } from '../store/dedicationStore';
import { track } from '../services/analytics';

const haptic = (s: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
  try { Haptics.impactAsync(s); } catch { /* noop */ }
};

// Recall stages by Leitner box: recognition → cloze production → full recitation.
type Stage = 'new' | 'quiz' | 'cloze';

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
  const autoPlay = usePreferencesStore((s) => s.autoPlay);
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

  // The day's queue, built once — then a mutable state array so lapses can re-queue.
  const [queue, setQueue] = useState<CourseVerse[]>([]);
  const [queueReady, setQueueReady] = useState(false);
  const [counts, setCounts] = useState({ reviews: 0, fresh: 0 });
  const requeuedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!loaded || queueReady) return;
    const q = buildTodayQueue(course.verses, records as any, newPerDay);
    setQueue(q);
    setCounts({
      reviews: q.filter((v) => records[v.id]).length,
      fresh: q.filter((v) => !records[v.id]).length,
    });
    setQueueReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, queueReady]);

  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [recited, setRecited] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [chanting, setChanting] = useState(false);
  const chantStopRef = useRef(false);
  const [graded, setGraded] = useState(0);
  const [masteredNow, setMasteredNow] = useState(0);
  const [justMastered, setJustMastered] = useState<CourseVerse[]>([]);
  const [newSiddhis, setNewSiddhis] = useState<string[]>([]);
  const [dedicatedTo, setDedicatedTo] = useState<string | null>(null);
  const [dedicateName, setDedicateName] = useState('');
  const soundRef = useRef<Audio.Sound | null>(null);
  // Playback generation: bumped by stopSound() and every new play; in-flight plays
  // compare their captured generation after each await and bail if stale.
  const genRef = useRef(0);
  // Double-tap guard: one grade per card; released when the next card mounts.
  const gradingRef = useRef(false);
  const cardRef = useRef<View>(null);

  useEffect(() => {
    useMasteryStore.getState().load();
    useScoreStore.getState().load();
    useAchievementsStore.getState().load();
    useDedicationStore.getState().load();
    if (BELL_ENABLED) getPlayableUri(BELL_URL).catch(() => {}); // warm the bell cache before the sankalpa tap
  }, []);
  useEffect(() => () => {
    chantStopRef.current = true; // halt any in-flight chant loop
    soundRef.current?.unloadAsync().catch(() => {});
  }, []);

  const verse = queue[idx];
  // Funnel step 2: each verse faced. With step 3 below, the dashboard can
  // finally name WHERE the 21-of-27 who begin but never finish fall off.
  useEffect(() => {
    if (started && verse) track('lesson_start', { course: course.id, index: idx });
  }, [idx, started]);
  const rec = verse ? records[verse.id] : undefined;
  const isNew = verse ? !rec : false;
  const box = rec?.box ?? 0;
  const stage: Stage = isNew ? 'new' : box >= 2 ? 'cloze' : 'quiz';
  // Box 3→4 ("by heart") must be earned with a recitation, honor-system.
  const needsRecite = stage === 'cloze' && box === 3;
  const done = queueReady && (queue.length === 0 || idx >= queue.length);
  const total = queue.length;

  // Slow breathing on the backdrop painting — the KathaScroll living-art idiom.
  const breathe = useSharedValue(1.02);
  useEffect(() => {
    breathe.value = withRepeat(
      withTiming(1.08, { duration: 12000, easing: Easing.inOut(Easing.quad) }), -1, true,
    );
  }, [breathe]);
  const breatheStyle = useAnimatedStyle(() => ({ transform: [{ scale: breathe.value }] }));

  // Repeat-after-me cue: when the narration finishes on a new verse, the "Echo it"
  // button pulses twice — the listen→speak invitation.
  const echoPulse = useSharedValue(1);
  const pulseEcho = () => {
    echoPulse.value = withRepeat(
      withSequence(withTiming(1.08, { duration: 260 }), withTiming(1, { duration: 260 })), 2, false,
    );
  };
  const echoStyle = useAnimatedStyle(() => ({ transform: [{ scale: echoPulse.value }] }));

  // ---------- audio ----------
  const sourceFor = async (v: CourseVerse) => {
    const vv = variants[v.id];
    const recite = narrator === 'shardul' ? vv?.reciteShardul : vv?.reciteKuber;
    return recite
      ? { uri: await getPlayableUri(recite) }                          // chosen narrator
      : typeof v.audio === 'string'
        ? { uri: await getPlayableUri(v.audio) }                       // streamed combined
        : v.audio;                                                     // bundled require()
  };

  /** Does this verse have a recite-only track for the chosen narrator (vs the combined recite+meaning fallback)? */
  const hasReciteOnly = (v: CourseVerse) => {
    const vv = variants[v.id];
    return !!(narrator === 'shardul' ? vv?.reciteShardul : vv?.reciteKuber);
  };

  const stopSound = async () => {
    genRef.current += 1; // cancels any in-flight play
    try { await soundRef.current?.unloadAsync(); } catch { /* noop */ }
    soundRef.current = null;
    setPlaying(false);
  };

  const play = async (v?: CourseVerse, onFinish?: () => void) => {
    const target = v ?? verse;
    if (!target) return;
    const gen = ++genRef.current;
    try {
      await soundRef.current?.unloadAsync();
      soundRef.current = null;
      const source = await sourceFor(target);
      if (gen !== genRef.current) return; // superseded while resolving the URI
      const { sound } = await Audio.Sound.createAsync(source as any, { shouldPlay: true });
      if (gen !== genRef.current) { sound.unloadAsync().catch(() => {}); return; } // superseded mid-create
      sound.setOnPlaybackStatusUpdate((st) => {
        if (gen !== genRef.current || !st.isLoaded) return;
        setPlaying(st.isPlaying && !st.didJustFinish);
        if (st.didJustFinish) onFinish?.();
      });
      soundRef.current = sound;
      setPlaying(true);
    } catch { /* network hiccup; ignore */ }
  };

  const togglePlay = async () => {
    haptic();
    const s = soundRef.current;
    if (s) {
      try {
        const st = await s.getStatusAsync();
        if (st.isLoaded && st.isPlaying) { await s.pauseAsync(); setPlaying(false); return; }
        if (st.isLoaded && !st.didJustFinish && st.positionMillis > 0) { await s.playAsync(); setPlaying(true); return; }
      } catch { /* fall through to fresh play */ }
    }
    await play(undefined, stage === 'new' ? pulseEcho : undefined);
  };

  const replay = async () => {
    haptic();
    const s = soundRef.current;
    try {
      const st = s ? await s.getStatusAsync() : null;
      if (s && st?.isLoaded) { await s.replayAsync(); setPlaying(true); return; }
    } catch { /* fall through */ }
    await play(undefined, stage === 'new' ? pulseEcho : undefined);
  };

  // Card entry: reset per-verse state; weave the narration in. Cloze waits for reveal;
  // quiz cards only auto-play when a recite-only track exists (the combined fallback
  // narrates the meaning — the quiz's answer).
  useEffect(() => {
    gradingRef.current = false; // new card → accept a grade again
    setRevealed(false);
    setRecited(false);
    const shouldAuto =
      started && !!verse && autoPlay &&
      (stage === 'new' || (stage === 'quiz' && hasReciteOnly(verse)));
    if (!shouldAuto) return;
    // (bell disabled — no need to hold the narration back)
    const t = setTimeout(() => play(undefined, stage === 'new' ? pulseEcho : undefined), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, started]);

  // Stay a step ahead: warm the next verse's painting.
  useEffect(() => {
    const next = queue[idx + 1]?.artUrl;
    if (next) ExpoImage.prefetch(next).catch(() => {});
  }, [idx, queue]);

  // Play the meaning in the chosen language (Hindi=Kuber, English=Bill). Variant-only.
  const meaningAudio = (() => {
    const v = verse ? variants[verse.id] : undefined;
    return meaningLang === 'en' ? v?.meaningEn : v?.meaningHi;
  })();
  const playMeaning = async () => {
    if (!meaningAudio) return;
    haptic();
    const gen = ++genRef.current;
    try {
      await soundRef.current?.unloadAsync();
      soundRef.current = null;
      setPlaying(false);
      const uri = await getPlayableUri(meaningAudio);
      if (gen !== genRef.current) return;
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      if (gen !== genRef.current) { sound.unloadAsync().catch(() => {}); return; }
      sound.setOnPlaybackStatusUpdate((st) => {
        if (gen !== genRef.current || !st.isLoaded) return;
        setPlaying(st.isPlaying && !st.didJustFinish);
      });
      soundRef.current = sound;
      setPlaying(true);
    } catch { /* ignore */ }
  };

  const onRecited = () => {
    setRecited(true);
    track('verse_recited', { course: course.id, verse: verse?.id });
  };

  const grade = async (g: Grade) => {
    if (!verse || gradingRef.current) return;
    gradingRef.current = true;
    haptic(g === 'knew' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    const wasNew = isNew;
    const before = (records[verse.id]?.box ?? 0) >= 4;
    await useMasteryStore.getState().recordRecall(verse.id, g);
    const after = (useMasteryStore.getState().records[verse.id]?.box ?? 0) >= 4;
    if (!before && after) {
      setMasteredNow((m) => m + 1);
      setJustMastered((list) => [...list, verse]);
    }
    if (wasNew && g !== 'forgot') useScoreStore.getState().award(10, 0); // learning a new verse
    // In-session lapse: see the forgotten verse once more before the session ends.
    if (!wasNew && g === 'forgot' && !requeuedRef.current.has(verse.id)) {
      requeuedRef.current.add(verse.id);
      setQueue((q) => [...q, verse]);
    }
    setGraded((n) => n + 1);
    track('lesson_complete', { course: course.id, index: idx, grade: g });
    await stopSound();
    setIdx((i) => i + 1);
  };

  // Quiz result → award points + feed the SRS (correct = knew, wrong = review again).
  const quizResult = async (correct: boolean) => {
    if (correct) await useScoreStore.getState().award(20, 1, true);
    else await useScoreStore.getState().award(0, 0, false);
    await grade(correct ? 'knew' : 'forgot');
  };

  const revealCloze = () => {
    setRevealed(true);
    if (autoPlay) play();
  };

  // Funnel step 1: the deck was opened (seen), whether or not it is begun.
  useEffect(() => { track('deck_open', { course: course.id }); }, []);

  const beginSession = () => {
    haptic();
    playBell();
    track('sadhana_begin', { course: course.id, reviews: counts.reviews, fresh: counts.fresh });
    setStarted(true);
  };

  useEffect(() => {
    if (done && graded > 0) {
      (async () => {
        playBell();
        // Completing a sādhana counts as today's darshan/streak.
        await useStreakStore.getState().load();
        await useStreakStore.getState().recordVisit();
        await useScoreStore.getState().award(0, 5); // diyas for completing today's sādhana
        track('sadhana_complete', { course: course.id, graded, mastered: masteredNow });
        track('deck_complete', { course: course.id, graded });
        // Now that streak + score are up to date, see which Siddhis were just earned.
        const newly = useAchievementsStore.getState().evaluate();
        if (newly.length) setNewSiddhis(newly);
        // Triumphant haptic — the "bling".
        try {
          Haptics.notificationAsync(
            masteredNow > 0 || newly.length > 0
              ? Haptics.NotificationFeedbackType.Success
              : Haptics.NotificationFeedbackType.Warning,
          );
        } catch { /* noop */ }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  // Pariṇāmanā — dedicate the merit of this practice (kept on-device).
  const dedicate = async (to: string) => {
    const name = to.trim();
    if (!name) return;
    haptic(Haptics.ImpactFeedbackStyle.Medium);
    await useDedicationStore.getState().dedicate(name);
    setDedicatedTo(name);
    setDedicateName('');
    track('dedication', { course: course.id });
    const newly = useAchievementsStore.getState().evaluate();
    if (newly.length) setNewSiddhis((p) => [...p, ...newly.filter((id) => !p.includes(id))]);
  };

  const reward = justMastered[0];
  const shareReward = async () => {
    haptic(Haptics.ImpactFeedbackStyle.Medium);
    useScoreStore.getState().recordShare(); // Sevā — carrying the teaching outward
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

  // ---------- chant mode (completion) ----------
  const uniqueQueue = useMemo(() => {
    const seen = new Set<string>();
    return queue.filter((v) => (seen.has(v.id) ? false : (seen.add(v.id), true)));
  }, [queue]);
  const lastArt = useMemo(() => [...queue].reverse().find((v) => v.artUrl)?.artUrl, [queue]);

  const playAndWait = (v: CourseVerse) =>
    new Promise<void>((resolve) => {
      (async () => {
        const gen = ++genRef.current;
        try {
          await soundRef.current?.unloadAsync();
          soundRef.current = null;
          const source = await sourceFor(v);
          if (gen !== genRef.current || chantStopRef.current) { resolve(); return; }
          const { sound } = await Audio.Sound.createAsync(source as any, { shouldPlay: true });
          if (gen !== genRef.current || chantStopRef.current) { sound.unloadAsync().catch(() => {}); resolve(); return; }
          soundRef.current = sound;
          sound.setOnPlaybackStatusUpdate((st) => {
            if (!st.isLoaded || st.didJustFinish) resolve();
          });
        } catch { resolve(); }
      })();
    });

  const startChant = async () => {
    haptic(Haptics.ImpactFeedbackStyle.Medium);
    track('sadhana_chant_mode', { course: course.id, verses: uniqueQueue.length });
    chantStopRef.current = false;
    setChanting(true);
    for (const v of uniqueQueue) {
      if (chantStopRef.current) break;
      await playAndWait(v);
    }
    await stopSound();
    setChanting(false);
  };

  const stopChant = async () => {
    chantStopRef.current = true;
    await stopSound();
    setChanting(false);
  };

  // Full-bleed painting behind everything, breathing slowly, scrimmed for the text.
  const renderBackdrop = (artUrl?: string) =>
    artUrl ? (
      <Animated.View
        key={artUrl}
        entering={FadeIn.duration(350)}
        exiting={FadeOut.duration(350)}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Animated.View style={[StyleSheet.absoluteFill, breatheStyle]}>
          <ExpoImage
            source={{ uri: artUrl }}
            style={StyleSheet.absoluteFill as any}
            contentFit="cover"
            transition={250}
            cachePolicy="memory-disk"
          />
        </Animated.View>
        <LinearGradient
          colors={['transparent', 'rgba(2,6,23,0.55)', 'rgba(2,6,23,0.92)']}
          locations={[0, 0.5, 1]}
          style={styles.scrim}
          pointerEvents="none"
        />
      </Animated.View>
    ) : null;

  const audioRow = (label: string, delay = 0) => (
    <Animated.View entering={FadeInDown.delay(delay).duration(450)} style={styles.audioRow}>
      <Pressable style={[styles.playBtn, { borderColor: theme.accent }]} onPress={togglePlay}>
        <Ionicons name={playing ? 'pause' : 'volume-high'} size={18} color={theme.accent} />
        <Text style={[styles.playTxt, { color: theme.accent }]}>{playing ? 'Pause' : label}</Text>
      </Pressable>
      <Pressable style={[styles.repeatBtn, { borderColor: theme.accent }]} onPress={replay} hitSlop={8}>
        <Ionicons name="repeat" size={17} color={theme.accent} />
      </Pressable>
    </Animated.View>
  );

  // ---------- completion ----------
  if (done) {
    const streak = useStreakStore.getState().currentStreak;
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#020617', '#0b1220', '#020617']} style={StyleSheet.absoluteFill} />
        {!!lastArt && (
          <ExpoImage
            source={{ uri: lastArt }}
            style={[StyleSheet.absoluteFill, { opacity: 0.16 }] as any}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        )}
        <LinearGradient colors={['rgba(2,6,23,0.2)', 'rgba(2,6,23,0.7)', '#020617']} style={StyleSheet.absoluteFill} />
        {masteredNow > 0 && <PetalShower />}
        <ScrollView contentContainerStyle={styles.doneWrap}>
          <Animated.View entering={FadeInDown.duration(500)} style={{ alignItems: 'center' }}>
            <Text style={styles.doneMark}>🪔</Text>
            <Text style={styles.doneTitle}>
              {graded > 0 ? 'Sādhana complete' : 'All caught up'}
            </Text>
            <Text style={styles.doneSub}>
              {graded > 0
                ? `You strengthened ${graded} verse${graded === 1 ? '' : 's'} today.`
                : 'Nothing due right now — come back tomorrow for your next review.'}
            </Text>
          </Animated.View>
          {graded > 0 && (
            <Animated.View entering={FadeInDown.delay(150).duration(500)} style={[styles.statCard, { borderColor: theme.accentSoft }]}>
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
            </Animated.View>
          )}

          {newSiddhis.length > 0 && (
            <Animated.View entering={FadeInDown.delay(300).duration(500)} style={[styles.siddhiCard, { borderColor: theme.accent }]}>
              <Text style={[styles.siddhiKicker, { color: theme.accent }]}>
                {newSiddhis.length === 1 ? 'NEW SIDDHI ATTAINED' : 'NEW SIDDHIS ATTAINED'}
              </Text>
              {newSiddhis.map((id) => {
                const a = getAchievement(id);
                if (!a) return null;
                return (
                  <View key={id} style={styles.siddhiRow}>
                    <Text style={styles.siddhiIcon}>{a.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.siddhiTitle}>{a.title}</Text>
                      <Text style={styles.siddhiDesc}>{a.desc}</Text>
                    </View>
                  </View>
                );
              })}
            </Animated.View>
          )}

          {/* Pariṇāmanā — dedicate the merit */}
          {graded > 0 && (
            <Animated.View entering={FadeInDown.delay(420).duration(500)} style={[styles.dedicateCard, { borderColor: theme.accentSoft }]}>
              {dedicatedTo ? (
                <Text style={styles.dedicatedLine}>
                  🪷  The merit of this practice flows to{' '}
                  <Text style={{ color: theme.accent, fontFamily: 'Playfair_Bold' }}>{dedicatedTo}</Text>
                </Text>
              ) : (
                <>
                  <Text style={[styles.dedicateKicker, { color: theme.accent }]}>🪷  PARIṆĀMANĀ</Text>
                  <Text style={styles.dedicateAsk}>Dedicate this practice to someone?</Text>
                  <View style={styles.dedicateChips}>
                    <Pressable style={[styles.chip, { borderColor: theme.accent }]} onPress={() => dedicate('all beings')}>
                      <Text style={[styles.chipTxt, { color: theme.accent }]}>All beings</Text>
                    </Pressable>
                    <Pressable style={[styles.chip, { borderColor: theme.accent }]} onPress={() => dedicate('my family')}>
                      <Text style={[styles.chipTxt, { color: theme.accent }]}>My family</Text>
                    </Pressable>
                  </View>
                  <View style={styles.dedicateRow}>
                    <TextInput
                      style={styles.dedicateInput}
                      placeholder="…or a name, kept private"
                      placeholderTextColor="#475569"
                      value={dedicateName}
                      onChangeText={setDedicateName}
                      returnKeyType="done"
                      onSubmitEditing={() => dedicate(dedicateName)}
                    />
                    <Pressable
                      style={[styles.dedicateGo, { backgroundColor: theme.accent }, !dedicateName.trim() && { opacity: 0.4 }]}
                      disabled={!dedicateName.trim()}
                      onPress={() => dedicate(dedicateName)}
                    >
                      <Ionicons name="arrow-forward" size={16} color="#0b1220" />
                    </Pressable>
                  </View>
                </>
              )}
            </Animated.View>
          )}

          {reward && (
            <Animated.View entering={FadeInDown.delay(540).duration(500)} style={styles.rewardWrap}>
              <Text style={styles.rewardLine}>You learned {reward.titleHi} by heart 🎉</Text>
              <View style={styles.cardScale}>
                <MasteryCard ref={cardRef} sanskrit={reward.sanskrit} titleHi={reward.titleHi} artUrl={reward.artUrl} />
              </View>
              <Pressable style={[styles.shareBtn, { borderColor: theme.accent }]} onPress={shareReward}>
                <Ionicons name="share-social" size={18} color={theme.accent} />
                <Text style={[styles.shareTxt, { color: theme.accent }]}>Share this milestone</Text>
              </Pressable>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(640).duration(500)} style={{ alignItems: 'center', gap: 12 }}>
            {graded > 0 && uniqueQueue.length > 0 && (
              <Pressable
                style={[styles.chantBtn, { borderColor: theme.accent }]}
                onPress={chanting ? stopChant : startChant}
              >
                <Ionicons name={chanting ? 'stop' : 'musical-notes'} size={17} color={theme.accent} />
                <Text style={[styles.chantTxt, { color: theme.accent }]}>
                  {chanting ? 'Stop chanting' : "Chant today's verses"}
                </Text>
              </Pressable>
            )}
            <Pressable style={[styles.cta, { backgroundColor: theme.accent }]} onPress={() => navigation.goBack()}>
              <Text style={styles.ctaText}>Done</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  if (!queueReady || !verse) {
    return <View style={styles.container}><LinearGradient colors={['#020617', '#0b1220']} style={StyleSheet.absoluteFill} /></View>;
  }

  // ---------- opening sankalpa ----------
  if (!started) {
    const sankalpaArt = queue[0]?.artUrl ?? queue.find((v) => v.artUrl)?.artUrl;
    return (
      <Pressable style={styles.container} onPress={beginSession}>
        <LinearGradient colors={['#020617', '#0b1220', '#020617']} style={StyleSheet.absoluteFill} />
        {renderBackdrop(sankalpaArt)}
        <View style={styles.sankalpaTop} pointerEvents="box-none">
          <Pressable onPress={() => navigation.goBack()} hitSlop={16}>
            <Ionicons name="close" size={24} color="rgba(248,250,252,0.8)" />
          </Pressable>
        </View>
        <View style={styles.sankalpaWrap} pointerEvents="none">
          <Animated.Text entering={FadeInDown.duration(600)} style={[styles.sankalpaKicker, { color: theme.accent }]}>
            SĀDHANA
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(150).duration(600)} style={styles.sankalpaTitle}>
            {course.title}
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(300).duration(600)} style={styles.sankalpaCount}>
            Today: {counts.reviews} review{counts.reviews === 1 ? '' : 's'} · {counts.fresh} new verse{counts.fresh === 1 ? '' : 's'}
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(500).duration(700)} style={styles.sankalpaLine}>
            Take a breath. Begin with a quiet mind.
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(1000).duration(800)} style={styles.sankalpaTap}>
            tap to begin
          </Animated.Text>
        </View>
      </Pressable>
    );
  }

  // ---------- practice card ----------
  const a = theme.accent;
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#020617', '#0b1220', '#020617']} style={StyleSheet.absoluteFill} />
      {renderBackdrop(verse.artUrl)}

      {/* minimal top bar: close · hairline progress · gear */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={16}><Ionicons name="close" size={24} color="#94a3b8" /></Pressable>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(idx / total) * 100}%`, backgroundColor: a }]} />
        </View>
        <Text style={styles.progressTxt}>{idx + 1}/{total}</Text>
        <Pressable onPress={() => { haptic(); setSettingsOpen(true); }} hitSlop={12}>
          <Ionicons name="settings-outline" size={20} color="#94a3b8" />
        </Pressable>
      </View>

      <Animated.View
        key={`${verse.id}:${idx}`}
        entering={FadeIn.duration(350)}
        exiting={FadeOut.duration(350)}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {stage === 'new' ? (
            <>
              <Animated.View entering={FadeInDown.duration(550)}>
                <Text style={[styles.kicker, { color: a }]}>NEW VERSE · {verse.titleHi}</Text>
                <Text style={styles.sanskrit}>{verse.sanskrit}</Text>
              </Animated.View>
              {audioRow('Listen again', 250)}
              <Animated.View entering={FadeInDown.delay(400).duration(500)} style={{ marginBottom: 18 }}>
                <Animated.View style={echoStyle}>
                  <ReciteRecorder accent={a} label="Echo it" onStart={stopSound} onRecorded={onRecited} />
                </Animated.View>
              </Animated.View>
              <Animated.View entering={FadeInDown.delay(550).duration(550)} style={styles.revealBox}>
                <Text style={[styles.translit, { borderLeftColor: a }]}>{verse.transliteration}</Text>
                {/* the language flip lives NEXT TO the meaning — nobody has to find the gear */}
                <View style={styles.meaningHead}>
                  <Text style={[styles.meaningKicker, { color: a }]}>MEANING</Text>
                  <Pressable
                    style={[styles.langChip, { borderColor: a }]}
                    hitSlop={10}
                    onPress={() => {
                      const next = meaningLang === 'en' ? 'hi' : 'en';
                      usePreferencesStore.getState().setMeaningLang(next);
                      track('meaning_lang_switch', { to: next });
                      try { Haptics.selectionAsync(); } catch { /* noop */ }
                    }}
                  >
                    <Ionicons name="swap-horizontal" size={12} color={a} />
                    <Text style={[styles.langChipTxt, { color: a }]}>
                      {meaningLang === 'en' ? 'हिंदी में' : 'In English'}
                    </Text>
                  </Pressable>
                </View>
                <Text style={styles.meaning}>{meaningLang === 'en' ? verse.meaningEn : verse.meaningHi}</Text>
                {!!meaningAudio && (
                  <Pressable style={[styles.meaningBtn, { borderColor: a }]} onPress={playMeaning}>
                    <Ionicons name="volume-medium" size={16} color={a} />
                    <Text style={[styles.playTxt, { color: a }]}>
                      Hear the meaning · {meaningLang === 'en' ? 'English' : 'हिंदी'}
                    </Text>
                  </Pressable>
                )}
                {(() => {
                  const r = reflectionFor(verse.sanskrit);
                  return r ? (
                    <View style={[styles.reflectCard, { borderColor: theme.accentSoft }]}>
                      <Text style={[styles.reflectKicker, { color: a }]}>FOR TODAY</Text>
                      <Text style={styles.reflectText}>{r.reflection}</Text>
                      {!!r.insight && <Text style={styles.reflectInsight}>{r.insight}</Text>}
                    </View>
                  ) : null;
                })()}
              </Animated.View>
            </>
          ) : stage === 'quiz' ? (
            <>
              <Animated.View entering={FadeInDown.duration(550)}>
                <Text style={[styles.kicker, { color: a }]}>REVIEW · {verse.titleHi}</Text>
                <Text style={styles.sanskrit}>{verse.sanskrit}</Text>
              </Animated.View>
              {audioRow(`Hear it in ${NARRATORS[narrator]}'s voice`, 200)}
              <Animated.View entering={FadeInDown.delay(350).duration(500)} style={styles.quizWrap}>
                <VerseQuiz verse={verse} pool={course.verses} accent={a} onResult={quizResult} />
              </Animated.View>
            </>
          ) : (
            <>
              <Animated.View entering={FadeInDown.duration(550)}>
                <Text style={[styles.kicker, { color: a }]}>REVIEW · {verse.titleHi}</Text>
                <ClozeRecall sanskrit={verse.sanskrit} accent={a} revealed={revealed} onReveal={revealCloze} />
              </Animated.View>
              {revealed && (
                <Animated.View entering={FadeInDown.duration(450)} style={styles.revealBox}>
                  {audioRow(`Hear it in ${NARRATORS[narrator]}'s voice`)}
                  {needsRecite && (
                    <>
                      <Text style={styles.reciteAsk}>Recite from memory to seal it by heart</Text>
                      <ReciteRecorder accent={a} label="Recite from memory" onStart={stopSound} onRecorded={onRecited} />
                    </>
                  )}
                </Animated.View>
              )}
            </>
          )}
        </ScrollView>
      </Animated.View>

      {/* footer: begin CTA for new verses; accent-toned self-grades for cloze reviews */}
      {stage === 'new' && (
        <View style={styles.gradeBar}>
          <Pressable style={[styles.beginBtn, { backgroundColor: a }]} onPress={() => grade('okay')}>
            <Text style={styles.beginTxt}>Begin learning this verse</Text>
          </Pressable>
        </View>
      )}
      {stage === 'cloze' && revealed && (
        <View style={styles.gradeBar}>
          <Text style={styles.gradeQ}>How well did you know it?</Text>
          <View style={styles.gradeRow}>
            <Pressable
              style={[styles.gradeBtn, { borderColor: `${a}45`, backgroundColor: `${a}14` }]}
              onPress={() => grade('forgot')}
            >
              <Text style={[styles.gradeBtnTxt, { color: a }]}>Still learning</Text>
            </Pressable>
            <Pressable
              style={[styles.gradeBtn, { borderColor: `${a}80`, backgroundColor: `${a}2e` }]}
              onPress={() => grade('okay')}
            >
              <Text style={[styles.gradeBtnTxt, { color: a }]}>Nearly there</Text>
            </Pressable>
            <Pressable
              style={[
                styles.gradeBtn,
                { borderColor: a, backgroundColor: `${a}55` },
                needsRecite && !recited && { opacity: 0.35 },
              ]}
              disabled={needsRecite && !recited}
              onPress={() => grade('knew')}
            >
              <Text style={[styles.gradeBtnTxt, { color: '#f8fafc' }]}>By heart</Text>
            </Pressable>
          </View>
          {needsRecite && !recited && (
            <Text style={styles.gradeHint}>Recite it once to unlock “By heart”</Text>
          )}
        </View>
      )}

      {/* settings sheet — language, voice, auto-play */}
      <Modal visible={settingsOpen} transparent animationType="fade" onRequestClose={() => setSettingsOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSettingsOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>Practice settings</Text>
            <View style={styles.sheetRow}>
              <Text style={styles.sheetLbl}>Meaning</Text>
              <View style={styles.segGroup}>
                {(['hi', 'en'] as const).map((l) => (
                  <Pressable key={l} onPress={() => usePreferencesStore.getState().setMeaningLang(l)}
                    style={[styles.seg, meaningLang === l && { backgroundColor: a }]}>
                    <Text style={[styles.segTxt, meaningLang === l && styles.segActive]}>{l === 'hi' ? 'हिंदी' : 'English'}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.sheetRow}>
              <Text style={styles.sheetLbl}>Voice</Text>
              <View style={styles.segGroup}>
                {(['kuber', 'shardul'] as const).map((n) => (
                  <Pressable key={n} onPress={() => usePreferencesStore.getState().setNarrator(n)}
                    style={[styles.seg, narrator === n && { backgroundColor: a }]}>
                    <Text style={[styles.segTxt, narrator === n && styles.segActive]}>{NARRATORS[n]}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.sheetRow}>
              <Text style={styles.sheetLbl}>Auto-play narration</Text>
              <Switch
                value={autoPlay}
                onValueChange={(v) => usePreferencesStore.getState().setAutoPlay(v)}
                trackColor={{ false: 'rgba(148,163,184,0.3)', true: a }}
                thumbColor="#f8fafc"
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '45%' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 56, paddingHorizontal: 18, paddingBottom: 8 },
  progressBar: { flex: 1, height: 2, borderRadius: 1, backgroundColor: 'rgba(148,163,184,0.2)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 1 },
  progressTxt: { color: '#94a3b8', fontSize: 12, width: 38, textAlign: 'right' },
  segGroup: { flexDirection: 'row', backgroundColor: 'rgba(148,163,184,0.15)', borderRadius: 999, padding: 3 },
  seg: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  segTxt: { color: '#cbd5e1', fontSize: 12.5, fontWeight: '700' },
  segActive: { color: '#0b1220' },
  meaningBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, marginTop: 4 },
  quizWrap: { marginTop: 4 },
  scroll: { flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: 22, paddingTop: 18, paddingBottom: 26 },
  kicker: { fontSize: 12, letterSpacing: 2, fontWeight: '800', marginBottom: 14 },
  sanskrit: { color: '#f8fafc', fontSize: 24, fontFamily: 'Playfair_Medium', lineHeight: 38, marginBottom: 20 },
  audioRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  playBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'rgba(2,6,23,0.45)' },
  repeatBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(2,6,23,0.45)' },
  playTxt: { fontSize: 14, fontWeight: '600' },
  revealBox: { gap: 14 },
  translit: { color: '#cbd5e1', fontSize: 15, fontStyle: 'italic', lineHeight: 23, borderLeftWidth: 2, paddingLeft: 14 },
  meaning: { color: '#e2e8f0', fontSize: 16.5, lineHeight: 26, fontFamily: 'Playfair_Regular' },
  meaningHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, marginBottom: 6 },
  meaningKicker: { fontSize: 10, letterSpacing: 2, fontWeight: '800' },
  langChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, opacity: 0.9 },
  langChipTxt: { fontSize: 11.5, fontWeight: '700' },
  reflectCard: { borderWidth: 1, borderRadius: 14, padding: 14, backgroundColor: 'rgba(15,23,42,0.5)', gap: 6 },
  reflectKicker: { fontSize: 10, letterSpacing: 1.5, fontWeight: '800' },
  reflectText: { color: '#e2e8f0', fontSize: 14.5, lineHeight: 21 },
  reflectInsight: { color: '#94a3b8', fontSize: 13, fontStyle: 'italic', lineHeight: 19 },
  reciteAsk: { color: '#e2e8f0', fontSize: 15, fontFamily: 'Playfair_Bold', marginTop: 4 },
  gradeBar: { paddingHorizontal: 18, paddingBottom: 34, paddingTop: 12 },
  gradeQ: { color: '#cbd5e1', fontSize: 13, textAlign: 'center', marginBottom: 12 },
  gradeRow: { flexDirection: 'row', gap: 10 },
  gradeBtn: { flex: 1, borderWidth: 1.5, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  gradeBtnTxt: { fontSize: 13.5, fontWeight: '700' },
  gradeHint: { color: '#94a3b8', fontSize: 12, textAlign: 'center', marginTop: 10 },
  beginBtn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  beginTxt: { color: '#0b1220', fontSize: 16, fontWeight: '800' },
  // sankalpa
  sankalpaTop: { position: 'absolute', top: 56, left: 18, zIndex: 2 },
  sankalpaWrap: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 26, paddingBottom: 90 },
  sankalpaKicker: { fontSize: 13, letterSpacing: 4, fontWeight: '800', marginBottom: 10 },
  sankalpaTitle: { color: '#f8fafc', fontSize: 34, fontFamily: 'Playfair_Bold', lineHeight: 42, marginBottom: 12 },
  sankalpaCount: { color: '#cbd5e1', fontSize: 15, fontWeight: '600', marginBottom: 26 },
  sankalpaLine: { color: '#e2e8f0', fontSize: 17, fontFamily: 'Playfair_Regular', fontStyle: 'italic', lineHeight: 26, marginBottom: 34 },
  sankalpaTap: { color: 'rgba(248,250,252,0.75)', fontSize: 13, letterSpacing: 1.5, textAlign: 'center' },
  // settings sheet
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.72)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#0b1220', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 22, paddingTop: 22, paddingBottom: 44, gap: 18,
    borderWidth: 1, borderColor: 'rgba(148,163,184,0.15)',
  },
  sheetTitle: { color: '#f8fafc', fontSize: 18, fontFamily: 'Playfair_Bold', marginBottom: 4 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetLbl: { color: '#cbd5e1', fontSize: 14.5, fontWeight: '600' },
  // completion
  doneWrap: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, paddingVertical: 70 },
  siddhiCard: { width: '100%', borderWidth: 1.5, borderRadius: 18, padding: 18, backgroundColor: 'rgba(15,23,42,0.5)', marginBottom: 24, gap: 12 },
  siddhiKicker: { fontSize: 11, letterSpacing: 1.5, fontWeight: '800', textAlign: 'center' },
  siddhiRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  siddhiIcon: { fontSize: 30 },
  siddhiTitle: { color: '#f8fafc', fontSize: 16, fontFamily: 'Playfair_Bold' },
  siddhiDesc: { color: '#94a3b8', fontSize: 12.5, lineHeight: 18, marginTop: 2 },
  dedicateCard: { width: '100%', borderWidth: 1, borderRadius: 18, padding: 18, backgroundColor: 'rgba(15,23,42,0.5)', marginBottom: 24 },
  dedicateKicker: { fontSize: 11, letterSpacing: 1.5, fontWeight: '800', marginBottom: 8 },
  dedicateAsk: { color: '#e2e8f0', fontSize: 15, fontFamily: 'Playfair_Bold', marginBottom: 12 },
  dedicateChips: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipTxt: { fontSize: 13, fontWeight: '700' },
  dedicateRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dedicateInput: {
    flex: 1, borderWidth: 1, borderColor: 'rgba(148,163,184,0.2)', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, color: '#f1f5f9', fontSize: 14,
    backgroundColor: 'rgba(2,6,23,0.5)',
  },
  dedicateGo: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dedicatedLine: { color: '#e2e8f0', fontSize: 15, lineHeight: 23, textAlign: 'center' },
  rewardWrap: { alignItems: 'center', marginBottom: 26 },
  rewardLine: { color: '#e2e8f0', fontSize: 15, fontWeight: '600', marginBottom: 14, textAlign: 'center' },
  cardScale: { borderRadius: 18, overflow: 'hidden', marginBottom: 16 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 20, paddingVertical: 12 },
  shareTxt: { fontSize: 14, fontWeight: '700' },
  chantBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 22, paddingVertical: 12 },
  chantTxt: { fontSize: 14, fontWeight: '700' },
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
