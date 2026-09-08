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
import { ImageQuiz } from '../components/vidya/ImageQuiz';
import { Interlinear } from '../components/vidya/Interlinear';
import { MulaBuilder } from '../components/vidya/MulaBuilder';
import { SeedEar } from '../components/vidya/SeedEar';
import { SeedMatch } from '../components/vidya/SeedMatch';
import { VidyaMiniPlayer } from '../components/vidya/VidyaMiniPlayer';
import { WordSheet } from '../components/vidya/WordSheet';
import { getFaithTheme } from '../data/faiths';
import { toCourseVerse } from '../data/vidya';
import { buildMulaTarget, buildSeedPairs } from '../data/vidya/seeds';
import { bilingualName, deityName, lessonArt } from '../data/vidya/shelves';
import { playLearnedDing } from '../services/vidyaDing';
import type { MantraLesson, MantraWord } from '../data/vidya/types';
import { track } from '../services/analytics';
import { VidyaPlayer } from '../services/vidyaPlayer';
import { Grade, LEVEL_LABEL, levelForBox, useMasteryStore } from '../store/masteryStore';
import { usePreferencesStore } from '../store/preferencesStore';
import { useVidyaStore } from '../store/vidyaStore';

/** v2: five screens — meaning first · word by word · the whole meaning · recall · japa (last). */
const PAGES = 5;
const WORDS = 1;
const MEANING = 2;
const RECALL = 3;
const PLAYER_H = 96; // clearance under each page for the pinned bar

const CONFIDENCE_LABEL: Record<MantraLesson['source']['confidence'], string> = {
  located: 'located',
  'located (tantric text, dated)': 'located · tantric text, dated',
  traditional: 'traditional',
  'traditional (modern commentary)': 'traditional · modern commentary',
  contested: 'contested',
};

/** One recall step; a card runs its steps in order and takes the worst grade. */
type RecallStep = 'quiz' | 'ear' | 'match' | 'mula' | 'verse' | 'cloze';
const WORST: Record<Grade, number> = { forgot: 0, okay: 1, knew: 2 };

/**
 * Mantra Vidyā — one card, five screens (v2, the founder's TestFlight verdict):
 *   1 MEANING FIRST — the card's image, the bang line, then WHAT THE TEXT SAYS
 *     as a plain English block (founder: "the most useful English — first"),
 *     the Hindi meaning, then the Sanskrit and its roman form.
 *   2 word by word (tap → the word's own clip) · 3 the whole meaning + what the
 *     text / tradition say + "where this comes from" · 4 RECALL (the visual
 *     quiz, then the seed widgets; grades the SRS) · 5 the Japa hand-off.
 * ONE audio track — the sung one — auto-plays on arrival in the pinned bar;
 * the bar hides on recall, and on cards with no sung track. No practice
 * screen: no who / when / how / counts anywhere (hard stop).
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

  const [page, setPage] = useState(0);
  const [sheetWord, setSheetWord] = useState<MantraWord | null>(null);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [recited, setRecited] = useState(false);
  const [result, setResult] = useState<Grade | null>(null);
  /** Recall: the steps for this visit and how far along we are. */
  const [steps, setSteps] = useState<RecallStep[]>([]);
  const [stepIdx, setStepIdx] = useState(0);
  const pagerRef = useRef<ScrollView>(null);
  const gradedRef = useRef(false);
  const stepGradesRef = useRef<Grade[]>([]);

  const accent = getFaithTheme(lesson?.tradition === 'Buddhist' ? 'Buddhist' : 'Hindu').accent;

  const pageRef = useRef(0);
  useEffect(() => {
    if (!lesson) return;
    track('vidya_lesson_start', { id: lesson.id, from });
    track('vidya_screen', { id: lesson.id, n: 1 });
    useMasteryStore.getState().load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id]);

  // The player is bound while this card has focus: the sung track auto-plays
  // on arrival (screen 1); navigation away — Japa, another lesson, back —
  // stops it, so no lesson audio leaks under the temple.
  useFocusEffect(useCallback(() => {
    if (!lesson) return undefined;
    VidyaPlayer.attach(lesson, autoPlay && pageRef.current !== RECALL);
    return () => { VidyaPlayer.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id]));

  /** The recall steps for this visit, staged by Leitner box (frozen on entry). */
  const planRecall = (l: MantraLesson): RecallStep[] => {
    const box = useMasteryStore.getState().records[l.id]?.box;
    const stage = box === undefined || box <= 1 ? 0 : box <= 3 ? 1 : 2;
    const out: RecallStep[] = [];
    const hasQuiz = !!l.quiz?.length;
    if (hasQuiz) out.push('quiz'); // the visual quiz leads on every card
    if (l.class === 'bija') {
      const pairs = buildSeedPairs(l, lessons).slice(0, 4);
      if (stage === 2 && buildMulaTarget(l, lessons)) out.push('mula');
      else if (stage >= 1 && pairs.length >= 2) out.push('match');
      else if (!hasQuiz && l.audio.sung) out.push('ear');
      else if (!hasQuiz && pairs.length >= 2) out.push('match');
    } else if (!hasQuiz) {
      out.push(stage === 0 ? 'verse' : 'cloze');
    }
    return out.length ? out : ['cloze'];
  };

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
      if (!result && steps.length === 0) { setSteps(planRecall(lesson)); setStepIdx(0); stepGradesRef.current = []; }
      VidyaPlayer.pause(); // no listening during recall
    }
  };
  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    onPage(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const openWord = (w: MantraWord) => {
    try { Haptics.selectionAsync(); } catch { /* noop */ }
    track('vidya_word_tap', { id: lesson?.id, word: w.iast, clip: !!w.audioUrl });
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
    if (g === 'knew') {
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch { /* noop */ }
      playLearnedDing(); // the mark lands on the shelf; the ding marks the moment
    }
    track('vidya_recall', { id: lesson.id, grade: g });
    track('vidya_lesson_complete', { id: lesson.id });
    setResult(g);
  };

  /** A step finished: move on, or grade the whole run with its worst step. */
  const onStep = (g: Grade) => {
    stepGradesRef.current = [...stepGradesRef.current, g];
    if (stepIdx + 1 < steps.length) { setStepIdx(stepIdx + 1); return; }
    const worst = stepGradesRef.current.reduce((a, b) => (WORST[b] < WORST[a] ? b : a), 'knew' as Grade);
    grade(worst);
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
  const hasTrack = !!lesson.audio.sung;
  const pageContent = { paddingBottom: (hasTrack ? PLAYER_H : 24) + insets.bottom };

  /* ── screen 4: recall — the visual quiz first, then the seed widgets ──── */
  const renderRecall = () => {
    if (result) {
      const level = levelForBox(useMasteryStore.getState().records[lesson.id]?.box);
      return (
        <View style={styles.doneWrap}>
          <Text style={styles.doneDeva}>{lesson.sanskrit}</Text>
          <Text style={[styles.doneLevel, { color: accent }]}>{LEVEL_LABEL[level]}</Text>
          {result === 'knew' && (
            <View style={[styles.doneMark, { backgroundColor: accent }]}>
              <Ionicons name="checkmark" size={26} color="#0b1220" />
            </View>
          )}
          <Text style={styles.doneSub}>
            {result === 'knew' ? 'Learned — it carries its mark on the shelf now.' : result === 'okay' ? 'Nearly there — it comes round again soon.' : 'It comes round again tomorrow.'}
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
    const step = steps[stepIdx];
    if (!step) return null;
    switch (step) {
      case 'quiz':
        return <ImageQuiz key={`quiz:${lesson.id}`} items={lesson.quiz ?? []} accent={accent} onResult={onStep} />;
      case 'mula': {
        const mula = buildMulaTarget(lesson, lessons);
        if (!mula) return <SeedMatch pairs={buildSeedPairs(lesson, lessons).slice(0, 4)} accent={accent} onResult={onStep} />;
        return <MulaBuilder target={mula.target} distractors={mula.distractors} prompt={`Build the mūla mantra for ${mula.deityName}`} accent={accent} onResult={onStep} />;
      }
      case 'match':
        return <SeedMatch pairs={buildSeedPairs(lesson, lessons).slice(0, 4)} accent={accent} onResult={onStep} />;
      case 'ear':
        return <SeedEar lesson={lesson} pool={lessons} accent={accent} onResult={onStep} />;
      case 'verse': {
        const pool = lessons.filter((l) => l.class !== 'bija').map(toCourseVerse);
        return <VerseQuiz verse={toCourseVerse(lesson)} pool={pool} accent={accent} onResult={(ok) => onStep(ok ? 'knew' : 'forgot')} />;
      }
      case 'cloze': {
        const box = records[lesson.id]?.box;
        const deep = box !== undefined && box > 3;
        return (
          <View style={{ gap: 18 }}>
            <ClozeRecall sanskrit={lesson.sanskrit} accent={accent} revealed={revealed} onReveal={() => setRevealed(true)} />
            {revealed && deep && !recited && (
              <>
                <Text style={styles.reciteAsk}>Recite from memory to seal it by heart</Text>
                <ReciteRecorder accent={accent} label="Recite from memory" onRecorded={() => setRecited(true)} />
              </>
            )}
            {revealed && (!deep || recited) && (
              <View>
                <Text style={styles.gradeQ}>How well did you know it?</Text>
                <View style={styles.gradeRow}>
                  {([['forgot', 'Still learning'], ['okay', 'Nearly there'], ['knew', 'I knew it']] as [Grade, string][]).map(([g, label], i) => (
                    <Pressable key={g} style={[styles.gradeBtn, { borderColor: `${accent}${['45', '80', 'ff'][i]}`, backgroundColor: `${accent}${['14', '2e', '55'][i]}` }]} onPress={() => onStep(g)}>
                      <Text style={[styles.gradeBtnTxt, { color: i === 2 ? '#0b1220' : accent }]}>{label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>
        );
      }
    }
  };

  const next = (label: string, to = page + 1) => (
    <Pressable style={[styles.nextBtn, { borderColor: `${accent}66` }]} onPress={() => goTo(to)} hitSlop={8}>
      <Text style={[styles.nextTxt, { color: accent }]}>{label}</Text>
      <Ionicons name="arrow-forward" size={16} color={accent} />
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#020617', '#0b1220', '#020617']} style={StyleSheet.absoluteFill} />

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
        <Text style={styles.topTitle} numberOfLines={1}>{bilingualName(lesson)}</Text>
      </View>

      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        style={{ flex: 1 }}
      >
        {/* 1 · MEANING FIRST — image · bang · Hindi meaning · Sanskrit · roman */}
        <ScrollView style={{ width }} contentContainerStyle={[styles.page, pageContent]} showsVerticalScrollIndicator={false}>
          {art && (
            <ExpoImage source={art} style={styles.hero} contentFit="cover" contentPosition={{ top: '0%' }} transition={400} cachePolicy="memory-disk" />
          )}
          {who && <Text style={[styles.kicker, { color: accent, marginTop: art ? 18 : 0 }]}>{who.toUpperCase()}</Text>}
          <Text style={styles.bang}>{lesson.titleEn}</Text>
          {/* the English that matters, first: what the text itself says — plain block, not bold */}
          {!!lesson.significance?.textSays && <Text style={styles.textSaysLead}>{lesson.significance.textSays}</Text>}
          {!!lesson.meaningHi && <Text style={styles.meaningHiLead}>{lesson.meaningHi}</Text>}
          <Text style={[styles.sanskrit, isSeed && styles.sanskritSeed, { marginTop: 22 }]}>{lesson.sanskrit}</Text>
          <Text style={styles.iastSoft}>{lesson.transliteration}</Text>
          <View style={styles.btnRow}>
            {next(isSeed ? 'Sound by sound' : 'Word by word', WORDS)}
            <Pressable style={[styles.nextBtn, styles.testBtn, { backgroundColor: accent }]} onPress={() => goTo(RECALL)} hitSlop={8} accessibilityRole="button">
              <Text style={[styles.nextTxt, { color: '#0b1220' }]}>Test yourself</Text>
              <Ionicons name="sparkles" size={15} color="#0b1220" />
            </Pressable>
          </View>
        </ScrollView>

        {/* 2 · Word by word — interlinear; tap → the word's own clip + the sheet */}
        <ScrollView style={{ width }} contentContainerStyle={[styles.page, pageContent]} showsVerticalScrollIndicator={false}>
          <Text style={[styles.kicker, { color: accent }]}>{isSeed ? 'SOUND BY SOUND' : 'WORD BY WORD'}</Text>
          {words.length ? (
            <Interlinear words={words} accent={accent} onPress={openWord} />
          ) : (
            <Text style={styles.footnote}>Word glosses are on their way for this card.</Text>
          )}
          <Text style={[styles.footnote, { marginTop: 14 }]}>tap a word to hear it alone and read more</Text>
          {!!lesson.sayItLike && (
            <View style={styles.block}>
              <Text style={[styles.kickerSm, { color: accent }]}>SAY IT LIKE</Text>
              <Text style={styles.sayIt}>{lesson.sayItLike}</Text>
            </View>
          )}
          {lesson.class === 'vedic' && (
            <Text style={styles.footnote}>Taught here without Vedic accents (svara); traditional recitation adds them.</Text>
          )}
          {next('The whole meaning', MEANING)}
        </ScrollView>

        {/* 3 · The whole meaning — long form, what the text / tradition say, the honesty layer collapsed */}
        <ScrollView style={{ width }} contentContainerStyle={[styles.page, pageContent]} showsVerticalScrollIndicator={false}>
          <Text style={[styles.kicker, { color: accent }]}>THE WHOLE MEANING</Text>
          <Text style={styles.meaning}>{lesson.meaningEn}</Text>
          <Text style={[styles.kicker, { color: accent, marginTop: 26 }]}>WHAT TRADITION SAYS</Text>
          <Text style={styles.body}>{lesson.significance?.traditionSays}</Text>
          {!!lesson.significance?.weDoNotClaim && (
            <>
              <Text style={[styles.kicker, { color: '#94a3b8', marginTop: 22 }]}>WHAT WE DON’T CLAIM</Text>
              <Text style={styles.bodySoft}>{lesson.significance.weDoNotClaim}</Text>
            </>
          )}

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
          {next('Test yourself', RECALL)}
        </ScrollView>

        {/* 4 · Recall — the player is hidden here */}
        <ScrollView style={{ width }} contentContainerStyle={[styles.page, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
          <Text style={[styles.kicker, { color: accent }]}>RECALL</Text>
          {page === RECALL && renderRecall()}
        </ScrollView>

        {/* 5 · Japa hand-off */}
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
              <Text style={[styles.bigBtnTitle, { color: '#f8fafc' }]}>Test yourself</Text>
              <Text style={[styles.bigBtnSub, { color: '#94a3b8' }]}>a short check — it schedules the next visit</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={accent} />
          </Pressable>
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
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 6 },
  dots: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(148,163,184,0.35)' },
  topTitle: { flex: 1, textAlign: 'right', color: '#94a3b8', fontSize: 13, fontFamily: 'Playfair_Medium' },
  missing: { color: '#94a3b8', fontSize: 15, textAlign: 'center', marginTop: 60, paddingHorizontal: 30 },
  page: { paddingHorizontal: 22, paddingTop: 14 },
  hero: { width: '100%', aspectRatio: 4 / 3, borderRadius: 22, backgroundColor: '#0b1220' },
  kicker: { fontSize: 11, letterSpacing: 2, fontWeight: '800', marginBottom: 12 },
  kickerSm: { fontSize: 10.5, letterSpacing: 1.5, fontWeight: '800', marginBottom: 6 },
  bang: { color: '#f8fafc', fontSize: 30, fontFamily: 'Playfair_Bold', lineHeight: 40 },
  textSaysLead: { color: '#e2e8f0', fontSize: 17, lineHeight: 27, marginTop: 14 },
  meaningHiLead: { color: '#cbd5e1', fontSize: 17.5, lineHeight: 29, marginTop: 16 },
  doneMark: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  sanskrit: { color: '#f8fafc', fontSize: 24, fontFamily: 'Playfair_Medium', lineHeight: 38, marginBottom: 6 },
  sanskritSeed: { fontSize: 72, lineHeight: 100 },
  iastSoft: { color: '#94a3b8', fontSize: 14.5, fontStyle: 'italic', lineHeight: 22 },
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
  testBtn: { borderWidth: 0 },
  block: { marginTop: 22 },
  sayIt: { color: '#e2e8f0', fontSize: 16, lineHeight: 25 },
  footnote: { color: '#64748b', fontSize: 12.5, fontStyle: 'italic', lineHeight: 18, marginTop: 18 },
  meaning: { color: '#e2e8f0', fontSize: 18, lineHeight: 29, fontFamily: 'Playfair_Regular' },
  body: { color: '#e2e8f0', fontSize: 16, lineHeight: 25 },
  bodySoft: { color: '#94a3b8', fontSize: 14.5, lineHeight: 23 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 26, paddingVertical: 10, minHeight: 44 },
  sourceLbl: { color: '#94a3b8', fontSize: 13, fontWeight: '700' },
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, marginLeft: 'auto' },
  badgeTxt: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.3 },
  sourceBody: { paddingLeft: 24, gap: 6 },
  sourceText: { color: '#cbd5e1', fontSize: 13.5, lineHeight: 20 },
  sourceNote: { color: '#64748b', fontSize: 12.5, lineHeight: 19, fontStyle: 'italic' },
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
