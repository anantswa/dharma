/**
 * The lesson player — a deck of story cards and game beats, then the Gate
 * Trial (timed flash round). One thumb, one card at a time, instant feedback,
 * jñāna awarded through the app's existing score system.
 */
import React, { useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, Vibration, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Card, FlashItem } from '../data/jyotish/types';
import { getUnit, JYOTISH_UNITS } from '../data/jyotish/units';
import { useJyotishStore } from '../store/jyotishStore';
import { useScoreStore } from '../store/scoreStore';
import { useStreakStore } from '../store/streakStore';
import { SIGNS, SIGNS_DEV, NAKSHATRAS, NAK_LORDS, DASHA_YEARS } from '../services/jyotishEngine';
import { track } from '../services/analytics';
import * as Haptics from 'expo-haptics';
import { Image as ExpoImage } from 'expo-image';

/** Unbiased Fisher–Yates; reshuffles once if the order came out identical. */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  if (a.length > 2 && a.every((v, i) => v === arr[i])) return shuffle(arr);
  return a;
}

const celebrate = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

const GOLD = '#fbbf24';
const GREEN = '#4ade80';
const RED = '#f87171';
const TRUTH_LABEL: Record<string, [string, string]> = {
  computed: ['COMPUTED FACT', '#46b7c6'],
  classical: ['CLASSICAL CRAFT', GOLD],
  interpretation: ['INTERPRETATION', '#c084fc'],
};

/* ── the 12-spoke wheel (pure Views, no SVG dep) ─────────────────────── */
function Wheel({ onPick, picked, answer }: { onPick: (i: number) => void; picked: number | null; answer: number }) {
  const R = 128;
  return (
    <View style={{ width: R * 2 + 44, height: R * 2 + 44, alignSelf: 'center', marginVertical: 10 }}>
      <View style={wheelStyles.hub}><Text style={{ color: GOLD, fontSize: 22 }}>☸</Text></View>
      {Array.from({ length: 12 }, (_, i) => {
        // Mesha at 9 o'clock, counter-clockwise — the traditional wheel direction.
        const ang = Math.PI - (i * Math.PI * 2) / 12;
        const x = R + 22 + Math.cos(ang) * R - 21;
        const y = R + 22 - Math.sin(ang) * R - 21;
        const isPick = picked === i;
        const good = picked !== null && i === answer;
        const bad = isPick && picked !== answer;
        return (
          <Pressable
            key={i}
            disabled={picked !== null}
            onPress={() => onPick(i)}
            style={[wheelStyles.seg, { left: x, top: y },
              good && { backgroundColor: 'rgba(74,222,128,.25)', borderColor: GREEN },
              bad && { backgroundColor: 'rgba(248,113,113,.25)', borderColor: RED }]}
          >
            <Text style={wheelStyles.segDev}>{SIGNS_DEV[i]}</Text>
            <Text style={wheelStyles.segN}>{i + 1}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
const wheelStyles = StyleSheet.create({
  hub: { position: 'absolute', left: '50%', top: '50%', marginLeft: -20, marginTop: -20, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f1a33' },
  seg: { position: 'absolute', width: 42, height: 42, borderRadius: 21, backgroundColor: '#0b1220', borderWidth: 1, borderColor: 'rgba(148,163,184,.25)', alignItems: 'center', justifyContent: 'center' },
  segDev: { color: '#e2e8f0', fontSize: 12 },
  segN: { color: '#475569', fontSize: 8 },
});


/* ── match-pairs game ────────────────────────────────────────────────── */
function MatchGame({ pairs, onDone }: { pairs: [string, string][]; onDone: (mistakes: number) => void }) {
  const rights = useMemo(() => shuffle(pairs.map((p) => p[1])), []);
  const [sel, setSel] = useState<string | null>(null);
  const [solved, setSolved] = useState<Record<string, boolean>>({});
  const [flash, setFlash] = useState<string | null>(null);
  const mistakes = useRef(0);
  const pick = (side: 'L' | 'R', v: string) => {
    if (side === 'L') { setSel(v); return; }
    if (!sel) return;
    const pair = pairs.find((p) => p[0] === sel);
    if (pair && pair[1] === v) {
      const next = { ...solved, [sel]: true };
      setSolved(next); setSel(null);
      if (Object.keys(next).length === pairs.length) setTimeout(() => onDone(mistakes.current), 350);
    } else {
      mistakes.current += 1; Vibration.vibrate(50);
      setFlash(v); setTimeout(() => setFlash(null), 350); setSel(null);
    }
  };
  return (
    <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
      <View style={{ flex: 1, gap: 8 }}>
        {pairs.map(([l]) => (
          <Pressable key={l} disabled={!!solved[l]} onPress={() => pick('L', l)}
            style={[styles.matchChip, sel === l && styles.matchSel, solved[l] && styles.matchSolved]}>
            <Text style={[styles.matchTxt, solved[l] && { color: GREEN }]}>{l}</Text>
          </Pressable>
        ))}
      </View>
      <View style={{ flex: 1.4, gap: 8 }}>
        {rights.map((r) => {
          const done = pairs.some(([l, rr]) => rr === r && solved[l]);
          return (
            <Pressable key={r} disabled={done} onPress={() => pick('R', r)}
              style={[styles.matchChip, done && styles.matchSolved, flash === r && styles.matchWrong]}>
              <Text style={[styles.matchTxt, done && { color: GREEN }]}>{r}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/* ── personalized card renderer ──────────────────────────────────────── */
function PersonalBody({ template, fallback }: { template: string; fallback: string }) {
  const chart = useJyotishStore((s) => s.getChart());
  if (!chart) return <Text style={styles.storyText}>{fallback}</Text>;
  const moon = chart.grahas[1];
  const lord = NAK_LORDS[chart.moonNakshatra % 9];
  const lines: Record<string, string> = {
    'moon-sign': `YOUR Moon lives in ${SIGNS[moon.sign]} (${SIGNS_DEV[moon.sign]}), at ${moon.degInSign.toFixed(1)}° of the sign. In jyotish, when someone asks "your rāśi," this is the honest answer — the sky your mind was tuned to at first breath.`,
    'moon-nakshatra': `YOUR Moon stood in ${NAKSHATRAS[chart.moonNakshatra]}, pada ${chart.moonPada}. Its lord is ${lord} — which means your life's very first daśā ran under ${lord}, for up to ${DASHA_YEARS[lord]} years. When we reach Gate 6, you'll compute that timetable yourself.`,
    'lagna': `YOUR lagna — the sign rising on the eastern horizon at your birth — is ${SIGNS[chart.ascSign]} (${SIGNS_DEV[chart.ascSign]}). The whole chart hangs from this anchor.`,
    'first-dasha': `From your Moon's nakshatra, your first daśā lord was ${chart.firstDashaLord}.`,
    'graha-spread': `Your nine grahas spread across the wheel: ${chart.grahas.map((g) => `${g.graha} in ${SIGNS[g.sign]}`).join(' · ')}.`,
  };
  return (
    <>
      <Text style={styles.personalBadge}>YOUR SKY · computed on this phone</Text>
      <Text style={styles.storyText}>{lines[template] ?? fallback}</Text>
    </>
  );
}

/* ── Gate Trial ──────────────────────────────────────────────────────── */
function Trial({ unitId, onDone }: { unitId: string; onDone: (score: number, passed: boolean) => void }) {
  const unit = getUnit(unitId)!;
  // Fresh item order AND fresh choice positions every attempt — a retry must
  // certify recall, not position memory (rotation-3 blocker).
  const items = useMemo(() => shuffle(unit.trial.items).map((q) => {
    const order = shuffle(q.choices.map((_, ci) => ci));
    return { prompt: q.prompt, choices: order.map((ci) => q.choices[ci]), answer: order.indexOf(q.answer) };
  }), []);
  const [i, setI] = useState(-1);           // -1 = intro
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(unit.trial.seconds);
  const [picked, setPicked] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const finish = (s: number) => {
    if (timer.current) clearInterval(timer.current);
    onDone(s, s >= unit.trial.passCount);
  };
  const start = () => {
    setI(0);
    timer.current = setInterval(() => setLeft((l) => {
      if (l <= 1) { finish(scoreRef.current); return 0; }
      return l - 1;
    }), 1000);
  };
  const scoreRef = useRef(0);
  React.useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);
  const recordItem = useJyotishStore((s) => s.recordItem);
  const pick = (q: FlashItem, c: number) => {
    if (picked !== null) return;
    setPicked(c);
    const ok = c === q.answer;
    recordItem(q.prompt, ok);
    if (ok) { scoreRef.current += 1; setScore((s) => s + 1); } else Vibration.vibrate(60);
    setTimeout(() => {
      setPicked(null);
      if (i + 1 >= items.length) finish(scoreRef.current);
      else setI(i + 1);
    }, ok ? 350 : 900);
  };

  if (i === -1) {
    return (
      <View style={styles.trialWrap}>
        <Text style={styles.trialGlyph}>⚔️</Text>
        <Text style={styles.trialTitle}>The Gate Trial</Text>
        <Text style={styles.storyText}>{unit.trial.intro}</Text>
        <Text style={styles.trialMeta}>{unit.trial.items.length} questions · {unit.trial.seconds}s · pass at {unit.trial.passCount}</Text>
        <Pressable style={styles.cta} onPress={start}><Text style={styles.ctaTxt}>Face the gate</Text></Pressable>
      </View>
    );
  }
  const q = items[i];
  return (
    <View style={styles.trialWrap}>
      <View style={styles.trialHud}>
        <Text style={[styles.trialMeta, left <= 10 && { color: RED }]}>⏳ {left}s</Text>
        <Text style={styles.trialMeta}>{score} ✓ · {i + 1}/{items.length}</Text>
      </View>
      <Text style={styles.quizPrompt}>{q.prompt}</Text>
      {q.choices.map((c, ci) => {
        const good = picked !== null && ci === q.answer;
        const bad = picked === ci && ci !== q.answer;
        return (
          <Pressable key={ci} disabled={picked !== null} onPress={() => pick(q, ci)}
            style={[styles.choice, good && styles.choiceGood, bad && styles.choiceBad]}>
            <Text style={styles.choiceTxt}>{c}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}


/* ── Daily Sky Review — spaced recall over everything passed ─────────── */
function Review({ onDone }: { onDone: (score: number, total: number) => void }) {
  const progress = useJyotishStore((s) => s.progress);
  const missed = useJyotishStore((s) => s.missed);
  const recordItem = useJyotishStore((s) => s.recordItem);
  const items = useMemo(() => {
    const pool: { prompt: string; choices: string[]; answer: number; why?: string }[] = [];
    for (const u of JYOTISH_UNITS) {
      if (!progress[u.id]?.completed) continue;
      u.cards.forEach((c) => { if (c.kind === 'quiz') pool.push(c); });
      u.trial.items.forEach((q) => pool.push(q));
    }
    // Spaced-repetition lean: previously missed items come first, then the rest
    // shuffled — a miss keeps returning until it is cleared.
    const missedPool = shuffle(pool.filter((q) => missed[q.prompt]));
    const freshPool = shuffle(pool.filter((q) => !missed[q.prompt]));
    return [...missedPool, ...freshPool].slice(0, 6);
  }, []);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  if (!items.length) return null;
  const q = items[i];
  const next = () => {
    setPicked(null);
    if (i + 1 >= items.length) onDone(score, items.length); else setI(i + 1);
  };
  return (
    <ScrollView contentContainerStyle={styles.cardWrap}>
      <Text style={styles.quizKicker}>DAILY SKY REVIEW · {i + 1}/{items.length}</Text>
      <Text style={styles.quizPrompt}>{q.prompt}</Text>
      {q.choices.map((c, ci) => {
        const good = picked !== null && ci === q.answer;
        const bad = picked === ci && ci !== q.answer;
        return (
          <Pressable key={ci} disabled={picked !== null}
            onPress={() => { setPicked(ci); recordItem(q.prompt, ci === q.answer); if (ci === q.answer) setScore((x) => x + 1); else Vibration.vibrate(50); }}
            style={[styles.choice, good && styles.choiceGood, bad && styles.choiceBad]}>
            <Text style={styles.choiceTxt}>{c}</Text>
          </Pressable>
        );
      })}
      {picked !== null && (
        <>
          {!!q.why && <Text style={[styles.why, { color: picked === q.answer ? GREEN : RED }]}><Text style={styles.whyBody}>{q.why}</Text></Text>}
          <Pressable style={styles.cta} onPress={next}><Text style={styles.ctaTxt}>{i + 1 >= items.length ? 'Finish' : 'Next'}</Text></Pressable>
        </>
      )}
    </ScrollView>
  );
}


/* ── celebration burst — a glyph that lands with a spring and a glow ─── */
function BurstGlyph({ glyph, burst }: { glyph: string; burst: boolean }) {
  const scale = useRef(new Animated.Value(burst ? 0.2 : 1)).current;
  const glow = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    if (!burst) return;
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 3, tension: 120, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);
  return (
    <View style={{ alignItems: 'center' }}>
      <Animated.View style={{
        position: 'absolute', top: -14, width: 90, height: 90, borderRadius: 45,
        backgroundColor: GOLD, opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.28] }),
        transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.6] }) }],
      }} />
      <Animated.Text style={[styles.trialGlyph, { transform: [{ scale }] }]}>{glyph}</Animated.Text>
    </View>
  );
}

/* ── main player ─────────────────────────────────────────────────────── */
export function JyotishLessonScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { unitId, review } = route.params;
  const unit = getUnit(unitId ?? 'sky-wheel')!;
  const store = useJyotishStore();
  const award = useScoreStore((s) => s.award);
  const recordVisit = useStreakStore((s) => s.recordVisit);
  const startAt = useMemo(() => {
    const p = store.progressFor(unit.id);
    return p.completed ? 0 : Math.min(p.cardIndex, unit.cards.length - 1);
  }, []);
  /** True until this deck's first completion — jnana is not farmable on re-walks. */
  const firstWalk = useMemo(() => !store.progressFor(unit.id).completed, []);
  const [idx, setIdx] = useState(startAt);
  const [phase, setPhase] = useState<'deck' | 'trial' | 'result' | 'review' | 'reviewDone'>(review ? 'review' : 'deck');
  const [reviewScore, setReviewScore] = useState<{ score: number; total: number } | null>(null);
  const recordReview = useJyotishStore((s) => s.recordReview);
  const reviewStreak = useJyotishStore((s) => s.reviewStreak);
  const [picked, setPicked] = useState<number | null>(null);
  const [trialResult, setTrialResult] = useState<{ score: number; passed: boolean } | null>(null);
  const fade = useRef(new Animated.Value(1)).current;

  React.useEffect(() => { track('jyotish_lesson_open', { unit: review ? 'review' : unit.id }); recordVisit(); }, []);

  const card: Card | undefined = unit.cards[idx];
  const advance = () => {
    const next = idx + 1;
    setPicked(null);
    if (next >= unit.cards.length) {
      const firstTime = !store.progressFor(unit.id).completed;
      store.completeDeck(unit.id);
      if (firstTime) award(10, 1, undefined);
      track('jyotish_deck_complete', { unit: unit.id });
      setPhase('trial');
      return;
    }
    Animated.sequence([
      Animated.timing(fade, { toValue: 0, duration: 90, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();
    setIdx(next);
    store.saveCardIndex(unit.id, next);
  };

  const answer = (correct: boolean, prompt?: string) => {
    store.recordAnswer(unit.id, correct);
    if (prompt) useJyotishStore.getState().recordItem(prompt, correct);
    if (correct && firstWalk) award(2, 0, true);
    if (correct) celebrate(); else Vibration.vibrate(60);
    track('jyotish_answer', { unit: unit.id, correct });
  };

  const onTrialDone = (score: number, passed: boolean) => {
    store.recordTrial(unit.id, score, passed);
    if (passed) { award(25, 3, undefined); celebrate(); setTimeout(celebrate, 250); }
    track('jyotish_trial', { unit: unit.id, score, passed });
    setTrialResult({ score, passed });
    setPhase('result');
  };

  const progressPct = phase === 'deck' ? (idx / unit.cards.length) : 1;

  return (
    <View style={styles.container}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => navigation.goBack()}><Text style={styles.close}>✕</Text></Pressable>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(4, progressPct * 100)}%` }]} /></View>
        <Text style={styles.hudTxt}>{unit.glyph} {unit.n}</Text>
      </View>

      {phase === 'review' && (
        <Review onDone={(score, total) => {
          recordReview();
          if (score >= total - 1) celebrate();
          award(score, score >= total - 1 ? 1 : 0, undefined);
          track('jyotish_review', { score, total });
          setReviewScore({ score, total });
          setPhase('reviewDone');
        }} />
      )}

      {phase === 'reviewDone' && reviewScore && (
        <View style={styles.trialWrap}>
          <Text style={styles.trialGlyph}>{reviewScore.score >= reviewScore.total - 1 ? '🌟' : '🌗'}</Text>
          <Text style={styles.trialTitle}>Sky held: {reviewScore.score}/{reviewScore.total}</Text>
          <Text style={styles.storyText}>
            {reviewScore.score >= reviewScore.total - 1
              ? 'The wheel stays bright in you. Come back tomorrow — held truths fade without turning.'
              : 'Some truths slipped. They\'ll return in tomorrow\'s review — that\'s how holding works.'}
          </Text>
          <Text style={styles.awardTxt}>review streak: {reviewStreak} 🔥 · +{reviewScore.score} jñāna</Text>
          <Pressable style={styles.cta} onPress={() => navigation.goBack()}><Text style={styles.ctaTxt}>Return to the path</Text></Pressable>
        </View>
      )}

      {phase === 'trial' && <Trial unitId={unit.id} onDone={onTrialDone} />}

      {phase === 'result' && trialResult && (
        <View style={styles.trialWrap}>
          <BurstGlyph glyph={trialResult.passed ? '🪔' : '🌘'} burst={trialResult.passed} />
          <Text style={styles.trialTitle}>{trialResult.passed ? 'The gate opens' : 'The gate holds'}</Text>
          <Text style={styles.storyText}>
            {trialResult.score} of {unit.trial.items.length} truths held.{' '}
            {trialResult.passed
              ? unit.n < 2 ? 'Gate Two — the Nine Grahas — is unlocked.' : 'The next gate on the path is unlocked.'
              : `Hold ${unit.trial.passCount} to pass. The deck is yours to walk again — the wheel rewards returns.`}
          </Text>
          {trialResult.passed && <Text style={styles.awardTxt}>+25 jñāna · +3 diyas</Text>}
          <Pressable style={styles.cta} onPress={() => (trialResult.passed ? navigation.goBack() : (setPhase('trial'), setTrialResult(null)))}>
            <Text style={styles.ctaTxt}>{trialResult.passed ? 'Return to the path' : 'Try the trial again'}</Text>
          </Pressable>
          {!trialResult.passed && (
            <Pressable onPress={() => { setPhase('deck'); setIdx(0); }}>
              <Text style={styles.replay}>Re-walk the lessons first</Text>
            </Pressable>
          )}
        </View>
      )}

      {phase === 'deck' && card && (
        <Animated.View style={{ flex: 1, opacity: fade }}>
          <ScrollView contentContainerStyle={styles.cardWrap} showsVerticalScrollIndicator={false}>
            {card.kind === 'story' && (
              <>
                {card.art && (
                  <ExpoImage source={{ uri: card.art }} style={styles.storyArt}
                    contentFit="cover" transition={300} cachePolicy="memory-disk" />
                )}
                {!card.art && card.bigGlyph && <Text style={styles.bigGlyph}>{card.bigGlyph}</Text>}
                {card.truth && (
                  <Text style={[styles.truth, { color: TRUTH_LABEL[card.truth][1] }]}>{TRUTH_LABEL[card.truth][0]}</Text>
                )}
                {card.title && <Text style={styles.storyTitle}>{card.title}</Text>}
                <Text style={styles.storyText}>{card.text}</Text>
                <Pressable style={styles.cta} onPress={advance}><Text style={styles.ctaTxt}>Continue</Text></Pressable>
              </>
            )}

            {card.kind === 'personal' && (
              <>
                <Text style={styles.bigGlyph}>🌌</Text>
                <PersonalBody template={card.template} fallback={card.fallback} />
                <Pressable style={styles.cta} onPress={advance}><Text style={styles.ctaTxt}>Continue</Text></Pressable>
              </>
            )}

            {card.kind === 'quiz' && (
              <>
                <Text style={styles.quizKicker}>HOLD THE TRUTH</Text>
                <Text style={styles.quizPrompt}>{card.prompt}</Text>
                {card.choices.map((c, ci) => {
                  const good = picked !== null && ci === card.answer;
                  const bad = picked === ci && ci !== card.answer;
                  return (
                    <Pressable key={ci} disabled={picked !== null}
                      onPress={() => { setPicked(ci); answer(ci === card.answer, card.prompt); }}
                      style={[styles.choice, good && styles.choiceGood, bad && styles.choiceBad]}>
                      <Text style={styles.choiceTxt}>{c}</Text>
                    </Pressable>
                  );
                })}
                {picked !== null && (
                  <>
                    <Text style={[styles.why, { color: picked === card.answer ? GREEN : RED }]}>
                      {picked === card.answer ? '✓ Held. ' : '✗ Not this time. '}
                      <Text style={styles.whyBody}>{card.why}</Text>
                    </Text>
                    <Pressable style={styles.cta} onPress={advance}><Text style={styles.ctaTxt}>Continue</Text></Pressable>
                  </>
                )}
              </>
            )}

            {card.kind === 'match' && (
              <>
                <Text style={styles.quizKicker}>MATCH THE PAIRS</Text>
                <Text style={styles.quizPrompt}>{card.prompt}</Text>
                <MatchGame
                  key={idx}
                  pairs={card.pairs}
                  onDone={(mistakes) => { answer(mistakes === 0); setPicked(mistakes); }}
                />
                {picked !== null && (
                  <>
                    <Text style={[styles.why, { color: picked === 0 ? GREEN : GOLD }]}>
                      {picked === 0 ? '✓ Seated clean. ' : `Seated — after ${picked} slip${picked === 1 ? '' : 's'}. `}
                      <Text style={styles.whyBody}>{card.why}</Text>
                    </Text>
                    <Pressable style={styles.cta} onPress={advance}><Text style={styles.ctaTxt}>Continue</Text></Pressable>
                  </>
                )}
              </>
            )}

            {card.kind === 'wheel' && (
              <>
                <Text style={styles.quizKicker}>ON THE WHEEL</Text>
                <Text style={styles.quizPrompt}>{card.prompt}</Text>
                <Wheel answer={card.answerSign} picked={picked}
                  onPick={(i) => { setPicked(i); answer(i === card.answerSign, card.prompt); }} />
                {picked !== null && (
                  <>
                    <Text style={[styles.why, { color: picked === card.answerSign ? GREEN : RED }]}>
                      {picked === card.answerSign ? '✓ ' : '✗ '}
                      <Text style={styles.whyBody}>{card.why}</Text>
                    </Text>
                    <Pressable style={styles.cta} onPress={advance}><Text style={styles.ctaTxt}>Continue</Text></Pressable>
                  </>
                )}
              </>
            )}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  close: { color: '#94a3b8', fontSize: 20, padding: 4 },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#0f172a' },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: GOLD },
  hudTxt: { color: '#94a3b8', fontSize: 13 },
  cardWrap: { padding: 24, paddingTop: 30, paddingBottom: 60, flexGrow: 1, justifyContent: 'center' },
  storyArt: { width: '100%', aspectRatio: 16 / 11, borderRadius: 16, marginBottom: 16,
    backgroundColor: '#0f172a' },
  bigGlyph: { fontSize: 56, textAlign: 'center', color: GOLD, marginBottom: 14 },
  truth: { fontSize: 10.5, letterSpacing: 1.6, textAlign: 'center', marginBottom: 10 },
  storyTitle: { fontSize: 24, fontFamily: 'Playfair_Bold', color: '#f8fafc', textAlign: 'center', marginBottom: 12 },
  storyText: { fontSize: 16.5, lineHeight: 26, color: '#e2e8f0', textAlign: 'center' },
  personalBadge: { color: GOLD, fontSize: 10.5, letterSpacing: 1.6, textAlign: 'center', marginBottom: 10 },
  quizKicker: { color: GOLD, fontSize: 11, letterSpacing: 2, textAlign: 'center', marginBottom: 10 },
  quizPrompt: { fontSize: 19, fontFamily: 'Playfair_Bold', color: '#f8fafc', textAlign: 'center', marginBottom: 18, lineHeight: 27 },
  choice: { backgroundColor: '#0b1220', borderWidth: 1, borderColor: 'rgba(148,163,184,.25)', borderRadius: 14, padding: 15, marginBottom: 10 },
  choiceGood: { borderColor: GREEN, backgroundColor: 'rgba(74,222,128,.12)' },
  choiceBad: { borderColor: RED, backgroundColor: 'rgba(248,113,113,.12)' },
  choiceTxt: { color: '#e2e8f0', fontSize: 15.5, textAlign: 'center' },
  why: { marginTop: 8, fontSize: 13.5, textAlign: 'center', lineHeight: 20 },
  whyBody: { color: '#cbd5e1' },
  cta: { backgroundColor: GOLD, borderRadius: 14, paddingVertical: 14, marginTop: 22, alignSelf: 'stretch' },
  ctaTxt: { color: '#0b1220', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  trialWrap: { flex: 1, padding: 24, justifyContent: 'center' },
  trialGlyph: { fontSize: 52, textAlign: 'center', marginBottom: 10 },
  trialTitle: { fontSize: 26, fontFamily: 'Playfair_Bold', color: '#f8fafc', textAlign: 'center', marginBottom: 10 },
  trialMeta: { color: '#94a3b8', fontSize: 13, textAlign: 'center', marginTop: 10 },
  trialHud: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  awardTxt: { color: GOLD, textAlign: 'center', marginTop: 12, fontSize: 14 },
  replay: { color: '#94a3b8', textAlign: 'center', marginTop: 16, fontSize: 13.5, textDecorationLine: 'underline' },
  matchChip: { backgroundColor: '#0b1220', borderWidth: 1, borderColor: 'rgba(148,163,184,.25)', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 10, minHeight: 48, justifyContent: 'center' },
  matchSel: { borderColor: GOLD, backgroundColor: 'rgba(251,191,36,.12)' },
  matchSolved: { borderColor: 'rgba(74,222,128,.5)', opacity: 0.75 },
  matchWrong: { borderColor: RED, backgroundColor: 'rgba(248,113,113,.15)' },
  matchTxt: { color: '#e2e8f0', fontSize: 13.5, textAlign: 'center' },
});
