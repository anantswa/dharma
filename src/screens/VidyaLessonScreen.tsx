import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ClozeRecall } from '../components/ClozeRecall';
import { ReciteRecorder } from '../components/ReciteRecorder';
import { VerseQuiz } from '../components/VerseQuiz';
import { Interlinear, WordLine } from '../components/vidya/Interlinear';
import { MulaBuilder } from '../components/vidya/MulaBuilder';
import { SeedEar } from '../components/vidya/SeedEar';
import { SeedMatch } from '../components/vidya/SeedMatch';
import { VidyaMiniPlayer } from '../components/vidya/VidyaMiniPlayer';
import { WordSheet } from '../components/vidya/WordSheet';
import { getFaithTheme } from '../data/faiths';
import { toCourseVerse } from '../data/vidya';
import { buildMulaTarget, buildSeedPairs } from '../data/vidya/seeds';
import { deityName, lessonArt } from '../data/vidya/shelves';
import type { MantraLesson, MantraWord } from '../data/vidya/types';
import { track } from '../services/analytics';
import { useVidyaPlayer, VidyaPlayer } from '../services/vidyaPlayer';
import { Grade, LEVEL_LABEL, levelForBox, useMasteryStore } from '../store/masteryStore';
import { usePreferencesStore } from '../store/preferencesStore';
import { useVidyaStore } from '../store/vidyaStore';

const PAGES = 8;
const RECALL = PAGES - 1;
const PLAYER_H = 118; // clearance under each page for the pinned bar

const CONFIDENCE_LABEL: Record<MantraLesson['source']['confidence'], string> = {
  located: 'located',
  'located (tantric text, dated)': 'located · tantric text, dated',
  traditional: 'traditional',
  'traditional (modern commentary)': 'traditional · modern commentary',
  contested: 'contested',
};

/**
 * Mantra Vidyā — one card, eight screens (§3), the BANG leading (§8):
 *   1 the connection · 2 see it · 3 word by word · 4 whole meaning ·
 *   5 significance (+ collapsed "where this comes from") · 6 practice ·
 *   7 practise (Japa / Recall) · 8 recall (grades the SRS).
 * The pinned mini-player rides screens 1–7 and hides on 8.
 */
export const VidyaLessonScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const id: string | undefined = route.params?.id;
  const from: string = route.params?.from ?? 'shelf';
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const lessons = useVidyaStore((s) => s.lessons);
  const loops = useVidyaStore((s) => s.loops);
  const lesson = useMemo(() => lessons.find((l) => l.id === id), [lessons, id]);
  const records = useMasteryStore((s) => s.records);
  const autoPlay = usePreferencesStore((s) => s.autoPlay);
  const wordIndex = useVidyaPlayer((s) => s.wordIndex);

  const [page, setPage] = useState(0);
  const [sheetWord, setSheetWord] = useState<MantraWord | null>(null);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [recited, setRecited] = useState(false);
  const [result, setResult] = useState<Grade | null>(null);
  const pagerRef = useRef<ScrollView>(null);
  const gradedRef = useRef(false);
  /** Leitner box frozen on entering recall, so the widget cannot swap mid-grade. */
  const recallBoxRef = useRef<number | undefined>(undefined);

  const accent = getFaithTheme(lesson?.tradition === 'Buddhist' ? 'Buddhist' : 'Hindu').accent;

  const pageRef = useRef(0);
  useEffect(() => {
    if (!lesson) return;
    track('vidya_lesson_start', { id: lesson.id, from });
    track('vidya_screen', { id: lesson.id, n: 1 });
    useMasteryStore.getState().load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id]);

  // The player is bound while this card has focus: auto-play the slow
  // recitation on arrival (screen 1); navigation away — Japa, another lesson,
  // back — stops it, so no lesson audio leaks under the temple.
  useFocusEffect(useCallback(() => {
    if (!lesson) return undefined;
    const sung = lesson.audio.master ?? (lesson.audio.loopKey ? loops[lesson.audio.loopKey] : undefined);
    VidyaPlayer.attach(lesson, sung, autoPlay && pageRef.current !== RECALL);
    return () => { VidyaPlayer.stop(); };
    // the sung url is refreshed by the effect below when the loop manifest lands later
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id]));
  useEffect(() => {
    if (!lesson) return;
    const sung = lesson.audio.master ?? (lesson.audio.loopKey ? loops[lesson.audio.loopKey] : undefined);
    if (sung && !useVidyaPlayer.getState().sungUrl) useVidyaPlayer.getState().setState({ sungUrl: sung });
  }, [loops, lesson]);

  const goTo = (n: number) => {
    pagerRef.current?.scrollTo({ x: n * width, animated: true });
    onPage(n);
  };
  const onPage = (n: number) => {
    if (n === page || !lesson) return;
    setPage(n);
    pageRef.current = n;
    track('vidya_screen', { id: lesson.id, n: n + 1 });
    if (n === RECALL) {
      recallBoxRef.current = useMasteryStore.getState().records[lesson.id]?.box;
      VidyaPlayer.pause(); // no listening during recall
    }
  };
  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    onPage(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const openWord = (w: MantraWord) => {
    try { Haptics.selectionAsync(); } catch { /* noop */ }
    setSheetWord(w);
    VidyaPlayer.openWord(w);
  };
  const closeWord = () => {
    setSheetWord(null);
    VidyaPlayer.closeWord();
  };

  const toJapa = () => {
    if (!lesson) return;
    track('vidya_japa', { id: lesson.id });
    VidyaPlayer.stop(); // Japa owns the audio from here
    navigation.navigate('Japa', lesson.audio.loopKey ? { mantraKey: lesson.audio.loopKey } : {});
  };

  const grade = async (g: Grade) => {
    if (!lesson || gradedRef.current) return;
    gradedRef.current = true;
    await useMasteryStore.getState().recordRecall(lesson.id, g);
    track('vidya_recall', { id: lesson.id, grade: g });
    track('vidya_lesson_complete', { id: lesson.id });
    setResult(g);
  };

  if (!lesson) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#020617', '#0b1220', '#020617']} style={StyleSheet.absoluteFill} />
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={16}><Ionicons name="chevron-back" size={26} color="#e2e8f0" /></Pressable>
        </View>
        <Text style={styles.missing}>This lesson is not in the loaded catalog yet.</Text>
      </View>
    );
  }

  const isSeed = lesson.class === 'bija';
  const words = lesson.words ?? [];
  const art = lessonArt(lesson);
  const who = deityName(lesson.deityId);
  const pageContent = { paddingBottom: PLAYER_H + insets.bottom };

  /* ── screen 8: recall, staged by Leitner box ─────────────────────────── */
  const renderRecall = () => {
    if (result) {
      const level = levelForBox(useMasteryStore.getState().records[lesson.id]?.box);
      return (
        <View style={styles.doneWrap}>
          <Text style={styles.doneDeva}>{lesson.sanskrit}</Text>
          <Text style={[styles.doneLevel, { color: accent }]}>{LEVEL_LABEL[level]}</Text>
          <Text style={styles.doneSub}>
            {result === 'knew' ? 'It stays with you.' : result === 'okay' ? 'Nearly there — it comes round again soon.' : 'It comes round again tomorrow.'}
          </Text>
          <Pressable style={[styles.primaryBtn, { backgroundColor: accent }]} onPress={toJapa}>
            <Text style={styles.primaryTxt}>Japa with this mantra</Text>
          </Pressable>
          <Pressable style={{ padding: 14 }} onPress={() => navigation.goBack()}>
            <Text style={styles.quietTxt}>Back to the shelf</Text>
          </Pressable>
        </View>
      );
    }
    const box = recallBoxRef.current ?? records[lesson.id]?.box;
    const stage = box === undefined || box <= 1 ? 0 : box <= 3 ? 1 : 2;
    if (isSeed) {
      const pairs = buildSeedPairs(lesson, lessons).slice(0, 4);
      const mula = stage === 2 ? buildMulaTarget(lesson, lessons) : null;
      if (stage === 2 && mula) {
        return <MulaBuilder target={mula.target} distractors={mula.distractors} prompt={`Build the mūla mantra for ${mula.deityName}`} accent={accent} onResult={grade} />;
      }
      if (stage >= 1 && pairs.length >= 2) return <SeedMatch pairs={pairs} accent={accent} onResult={grade} />;
      return <SeedEar lesson={lesson} pool={lessons} accent={accent} onResult={grade} />;
    }
    if (stage === 0) {
      const pool = lessons.filter((l) => l.class !== 'bija').map(toCourseVerse);
      return <VerseQuiz verse={toCourseVerse(lesson)} pool={pool} accent={accent} onResult={(ok) => grade(ok ? 'knew' : 'forgot')} />;
    }
    return (
      <View style={{ gap: 18 }}>
        <ClozeRecall sanskrit={lesson.sanskrit} accent={accent} revealed={revealed} onReveal={() => setRevealed(true)} />
        {revealed && stage === 2 && !recited && (
          <>
            <Text style={styles.reciteAsk}>Recite from memory to seal it by heart</Text>
            <ReciteRecorder accent={accent} label="Recite from memory" onRecorded={() => setRecited(true)} />
          </>
        )}
        {revealed && (stage === 1 || recited) && (
          <View>
            <Text style={styles.gradeQ}>How well did you know it?</Text>
            <View style={styles.gradeRow}>
              {([['forgot', 'Still learning'], ['okay', 'Nearly there'], ['knew', 'I knew it']] as [Grade, string][]).map(([g, label], i) => (
                <Pressable key={g} style={[styles.gradeBtn, { borderColor: `${accent}${['45', '80', 'ff'][i]}`, backgroundColor: `${accent}${['14', '2e', '55'][i]}` }]} onPress={() => grade(g)}>
                  <Text style={[styles.gradeBtnTxt, { color: i === 2 ? '#0b1220' : accent }]}>{label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  const next = (label: string) => (
    <Pressable style={[styles.nextBtn, { borderColor: `${accent}66` }]} onPress={() => goTo(page + 1)} hitSlop={8}>
      <Text style={[styles.nextTxt, { color: accent }]}>{label}</Text>
      <Ionicons name="arrow-forward" size={16} color={accent} />
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#020617', '#0b1220', '#020617']} style={StyleSheet.absoluteFill} />
      {art && page === 0 && (
        <>
          <ExpoImage source={art} style={styles.backdrop} contentFit="cover" contentPosition={{ top: '0%' }} transition={400} />
          <LinearGradient colors={['rgba(2,6,23,0.15)', 'rgba(2,6,23,0.85)', '#020617']} locations={[0, 0.55, 0.8]} style={StyleSheet.absoluteFill} />
        </>
      )}

      {/* top bar: back · dots · card name */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={16} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={26} color="#e2e8f0" />
        </Pressable>
        <View style={styles.dots}>
          {Array.from({ length: PAGES }, (_, i) => (
            <Pressable key={i} onPress={() => goTo(i)} hitSlop={6}>
              <View style={[styles.dot, i === page && { backgroundColor: accent, width: 16 }]} />
            </Pressable>
          ))}
        </View>
        <Text style={styles.topTitle} numberOfLines={1}>{lesson.titleHi}</Text>
      </View>

      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        style={{ flex: 1 }}
      >
        {/* 1 · BANG — the one-line connection, large; Devanagari beneath */}
        <ScrollView style={{ width }} contentContainerStyle={[styles.pageBang, pageContent]} showsVerticalScrollIndicator={false}>
          {who && <Text style={[styles.kicker, { color: accent }]}>{who.toUpperCase()}</Text>}
          <Text style={styles.bang}>{lesson.titleEn}</Text>
          {isSeed ? (
            <Text style={[styles.sanskrit, styles.sanskritSeed, { textAlign: 'left' }]}>{lesson.sanskrit}</Text>
          ) : words.length ? (
            <WordLine words={words} accent={accent} highlight={wordIndex} size={24} />
          ) : (
            <Text style={styles.sanskrit}>{lesson.sanskrit}</Text>
          )}
          <Text style={styles.iastSoft}>{lesson.transliteration}</Text>
          {next('See it')}
        </ScrollView>

        {/* 2 · See it */}
        <ScrollView style={{ width }} contentContainerStyle={[styles.page, pageContent]} showsVerticalScrollIndicator={false}>
          <Text style={[styles.kicker, { color: accent }]}>SEE IT</Text>
          <Text style={[styles.sanskrit, isSeed && styles.sanskritSeed]}>{lesson.sanskrit}</Text>
          <Text style={[styles.translit, { borderLeftColor: accent }]}>{lesson.transliteration}</Text>
          {!!lesson.sayItLike && (
            <View style={styles.block}>
              <Text style={[styles.kickerSm, { color: accent }]}>SAY IT LIKE</Text>
              <Text style={styles.sayIt}>{lesson.sayItLike}</Text>
            </View>
          )}
          {words.length > 1 && (
            <View style={styles.block}>
              <Text style={[styles.kickerSm, { color: accent }]}>{isSeed ? 'SOUND BY SOUND' : 'WORD BY WORD'}</Text>
              <WordLine words={words} accent={accent} highlight={wordIndex} />
            </View>
          )}
          {lesson.class === 'vedic' && (
            <Text style={styles.footnote}>Taught here without Vedic accents (svara); traditional recitation adds them.</Text>
          )}
          {next(isSeed ? 'Sound by sound' : 'Word by word')}
        </ScrollView>

        {/* 3 · Word by word — interlinear by default; tap for the optional sheet */}
        <ScrollView style={{ width }} contentContainerStyle={[styles.page, pageContent]} showsVerticalScrollIndicator={false}>
          <Text style={[styles.kicker, { color: accent }]}>{isSeed ? 'SOUND BY SOUND' : 'WORD BY WORD'}</Text>
          {words.length ? (
            <Interlinear words={words} accent={accent} highlight={wordIndex} onPress={openWord} />
          ) : (
            <Text style={styles.footnote}>Word glosses are on their way for this card.</Text>
          )}
          <Text style={[styles.footnote, { marginTop: 14 }]}>tap a word to hear it alone and read more</Text>
          {next('The whole meaning')}
        </ScrollView>

        {/* 4 · The whole meaning */}
        <ScrollView style={{ width }} contentContainerStyle={[styles.page, pageContent]} showsVerticalScrollIndicator={false}>
          <Text style={[styles.kicker, { color: accent }]}>THE WHOLE MEANING</Text>
          <Text style={styles.meaning}>{lesson.meaningEn}</Text>
          {!!lesson.meaningHi && <Text style={styles.meaningHi}>{lesson.meaningHi}</Text>}
          {next('Why it matters')}
        </ScrollView>

        {/* 5 · Significance — and the honesty layer, small and collapsed */}
        <ScrollView style={{ width }} contentContainerStyle={[styles.page, pageContent]} showsVerticalScrollIndicator={false}>
          <Text style={[styles.kicker, { color: accent }]}>WHAT THE TEXT SAYS</Text>
          <Text style={styles.body}>{lesson.significance?.textSays}</Text>
          <Text style={[styles.kicker, { color: accent, marginTop: 22 }]}>WHAT TRADITION SAYS</Text>
          <Text style={styles.body}>{lesson.significance?.traditionSays}</Text>
          <Text style={[styles.kicker, { color: '#94a3b8', marginTop: 22 }]}>WHAT WE DON’T CLAIM</Text>
          <Text style={styles.bodySoft}>{lesson.significance?.weDoNotClaim}</Text>

          <Pressable style={styles.sourceRow} onPress={() => setSourceOpen((v) => !v)} accessibilityRole="button">
            <Ionicons name={sourceOpen ? 'chevron-down' : 'chevron-forward'} size={16} color="#94a3b8" />
            <Text style={styles.sourceLbl}>Where this comes from</Text>
            <View style={[styles.badge, { borderColor: `${accent}66` }]}>
              <Text style={[styles.badgeTxt, { color: accent }]}>{CONFIDENCE_LABEL[lesson.source?.confidence] ?? lesson.source?.confidence}</Text>
            </View>
          </Pressable>
          {sourceOpen && (
            <View style={styles.sourceBody}>
              <Text style={styles.sourceText}>{lesson.source?.text}{lesson.source?.ref ? ` · ${lesson.source.ref}` : ''}</Text>
              {!!lesson.source?.note && <Text style={styles.sourceNote}>{lesson.source.note}</Text>}
            </View>
          )}
          {next('How it’s practised')}
        </ScrollView>

        {/* 6 · How it's practised */}
        <ScrollView style={{ width }} contentContainerStyle={[styles.page, pageContent]} showsVerticalScrollIndicator={false}>
          <Text style={[styles.kicker, { color: accent }]}>HOW IT’S PRACTISED</Text>
          <View style={styles.practiceGrid}>
            <View style={styles.practiceCell}>
              <Text style={styles.practiceNum}>{lesson.practice?.count === 'once' ? 'once' : `${lesson.practice?.count ?? '—'}×`}</Text>
              <Text style={styles.practiceLbl}>count</Text>
            </View>
            {!!lesson.practice?.timeOfDay && (
              <View style={styles.practiceCell}>
                <Text style={styles.practiceVal}>{lesson.practice.timeOfDay}</Text>
                <Text style={styles.practiceLbl}>time of day</Text>
              </View>
            )}
            <View style={styles.practiceCell}>
              <Text style={styles.practiceVal}>{(lesson.practice?.mode ?? []).join(' · ') || '—'}</Text>
              <Text style={styles.practiceLbl}>mode — the traditional gradation</Text>
            </View>
          </View>
          {!!lesson.practice?.dikshaNote && <Text style={styles.diksha}>{lesson.practice.dikshaNote}</Text>}
          {next('Practise')}
        </ScrollView>

        {/* 7 · Practise */}
        <ScrollView style={{ width }} contentContainerStyle={[styles.page, pageContent]} showsVerticalScrollIndicator={false}>
          <Text style={[styles.kicker, { color: accent }]}>PRACTISE</Text>
          <Text style={styles.sanskrit}>{lesson.sanskrit}</Text>
          <Pressable style={[styles.bigBtn, { backgroundColor: accent }]} onPress={toJapa}>
            <Text style={styles.bigBtnIcon}>📿</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.bigBtnTitle}>Japa</Text>
              <Text style={styles.bigBtnSub}>108 beads, this mantra{lesson.audio.loopKey && loops[lesson.audio.loopKey] ? ' sung underneath' : ''}</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#0b1220" />
          </Pressable>
          <Pressable style={[styles.bigBtn, styles.bigBtnOutline, { borderColor: accent }]} onPress={() => goTo(RECALL)}>
            <Text style={styles.bigBtnIcon}>✦</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.bigBtnTitle, { color: '#f8fafc' }]}>Recall</Text>
              <Text style={[styles.bigBtnSub, { color: '#94a3b8' }]}>a short check — it schedules the next visit</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={accent} />
          </Pressable>
        </ScrollView>

        {/* 8 · Recall — the player is hidden here */}
        <ScrollView style={{ width }} contentContainerStyle={[styles.page, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
          <Text style={[styles.kicker, { color: accent }]}>RECALL</Text>
          {page === RECALL && renderRecall()}
        </ScrollView>
      </ScrollView>

      {page !== RECALL && <VidyaMiniPlayer lesson={lesson} accent={accent} bottomInset={insets.bottom} />}

      <WordSheet
        word={sheetWord}
        accent={accent}
        onClose={closeWord}
        onHear={(w) => VidyaPlayer.playWord(w)}
        onOpenLesson={(lid) => { closeWord(); navigation.push('VidyaLesson', { id: lid, from: 'alsoIn' }); }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  backdrop: { ...StyleSheet.absoluteFillObject, height: '62%', opacity: 0.75 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 6 },
  dots: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(148,163,184,0.35)' },
  topTitle: { flex: 1, textAlign: 'right', color: '#94a3b8', fontSize: 13, fontFamily: 'Playfair_Medium' },
  missing: { color: '#94a3b8', fontSize: 15, textAlign: 'center', marginTop: 60, paddingHorizontal: 30 },
  page: { paddingHorizontal: 22, paddingTop: 18 },
  pageBang: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 120, justifyContent: 'flex-end' },
  kicker: { fontSize: 11, letterSpacing: 2, fontWeight: '800', marginBottom: 12 },
  kickerSm: { fontSize: 10.5, letterSpacing: 1.5, fontWeight: '800', marginBottom: 6 },
  bang: { color: '#f8fafc', fontSize: 30, fontFamily: 'Playfair_Bold', lineHeight: 40, marginBottom: 22 },
  sanskrit: { color: '#f8fafc', fontSize: 24, fontFamily: 'Playfair_Medium', lineHeight: 38, marginBottom: 16 },
  sanskritSeed: { fontSize: 72, lineHeight: 100, textAlign: 'center' },
  iastSoft: { color: '#94a3b8', fontSize: 14, fontStyle: 'italic', marginTop: 6 },
  translit: { color: '#cbd5e1', fontSize: 15, fontStyle: 'italic', lineHeight: 23, borderLeftWidth: 2, paddingLeft: 14 },
  block: { marginTop: 22 },
  sayIt: { color: '#e2e8f0', fontSize: 16, lineHeight: 25 },
  footnote: { color: '#64748b', fontSize: 12.5, fontStyle: 'italic', lineHeight: 18, marginTop: 18 },
  meaning: { color: '#e2e8f0', fontSize: 18, lineHeight: 29, fontFamily: 'Playfair_Regular' },
  meaningHi: { color: '#cbd5e1', fontSize: 17, lineHeight: 28, marginTop: 20 },
  body: { color: '#e2e8f0', fontSize: 16, lineHeight: 25 },
  bodySoft: { color: '#94a3b8', fontSize: 14.5, lineHeight: 23 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 26, paddingVertical: 10, minHeight: 44 },
  sourceLbl: { color: '#94a3b8', fontSize: 13, fontWeight: '700' },
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, marginLeft: 'auto' },
  badgeTxt: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.3 },
  sourceBody: { paddingLeft: 24, gap: 6 },
  sourceText: { color: '#cbd5e1', fontSize: 13.5, lineHeight: 20 },
  sourceNote: { color: '#64748b', fontSize: 12.5, lineHeight: 19, fontStyle: 'italic' },
  practiceGrid: { gap: 10 },
  practiceCell: { backgroundColor: 'rgba(15,23,42,0.55)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(148,163,184,0.14)', padding: 16 },
  practiceNum: { color: '#f8fafc', fontSize: 30, fontFamily: 'Playfair_Bold' },
  practiceVal: { color: '#f1f5f9', fontSize: 17, fontFamily: 'Playfair_Medium', lineHeight: 26 },
  practiceLbl: { color: '#64748b', fontSize: 11.5, marginTop: 4, letterSpacing: 0.4 },
  diksha: { color: '#94a3b8', fontSize: 14, fontStyle: 'italic', lineHeight: 22, marginTop: 18 },
  bigBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 18, marginTop: 12 },
  bigBtnOutline: { backgroundColor: 'rgba(15,23,42,0.55)', borderWidth: 1 },
  bigBtnIcon: { fontSize: 22 },
  bigBtnTitle: { color: '#0b1220', fontSize: 17, fontWeight: '800' },
  bigBtnSub: { color: 'rgba(11,18,32,0.75)', fontSize: 12.5, marginTop: 2, fontWeight: '600' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10, marginTop: 28, minHeight: 44 },
  nextTxt: { fontSize: 14, fontWeight: '700' },
  reciteAsk: { color: '#cbd5e1', fontSize: 13.5, fontStyle: 'italic' },
  gradeQ: { color: '#cbd5e1', fontSize: 13, textAlign: 'center', marginBottom: 12 },
  gradeRow: { flexDirection: 'row', gap: 10 },
  gradeBtn: { flex: 1, borderWidth: 1.5, borderRadius: 14, paddingVertical: 14, alignItems: 'center', minHeight: 48 },
  gradeBtnTxt: { fontSize: 13.5, fontWeight: '700' },
  doneWrap: { alignItems: 'center', paddingTop: 30, gap: 8 },
  doneDeva: { color: '#f8fafc', fontSize: 26, fontFamily: 'Playfair_Medium', textAlign: 'center', lineHeight: 40 },
  doneLevel: { fontSize: 13, fontWeight: '800', letterSpacing: 1.5, marginTop: 8 },
  doneSub: { color: '#94a3b8', fontSize: 14.5, textAlign: 'center', marginBottom: 18 },
  primaryBtn: { borderRadius: 16, paddingVertical: 15, paddingHorizontal: 34, minHeight: 48 },
  primaryTxt: { color: '#0b1220', fontSize: 15.5, fontWeight: '800' },
  quietTxt: { color: '#94a3b8', fontSize: 13.5 },
});
