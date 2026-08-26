/**
 * Path of the Sky — module home. The nine gates as a vertical journey, the
 * learner's own sky as a live card up top once birth details are set.
 */
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { JYOTISH_UNITS, getUnit } from '../data/jyotish/units';
import { useJyotishStore, isUnitUnlocked, localDay } from '../store/jyotishStore';
import { SIGNS, SIGNS_DEV, NAKSHATRAS, NAK_LORDS } from '../services/jyotishEngine';
import { track } from '../services/analytics';

const GOLD = '#fbbf24';

/** One-line hooks for locked gates — the road ahead should look worth walking. */
const TEASERS: Record<number, string> = {
  3: 'Where in a life does each graha land? The 12 houses…',
  4: 'The aha that flips everything: no planet is good for everyone',
  5: 'The Moon\'s 27 mansions — and the pattern hiding in 27 = 9×3',
  6: 'Compute the timetable of your own life, by hand, once',
  7: 'Saturn as weather: reading the slow fronts crossing your chart',
  8: 'Spot the royal patterns hiding in any chart',
  9: 'Cast a full chart and read it, start to finish',
};

export function JyotishHomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { birth, progress, getChart } = useJyotishStore();
  const chart = getChart();
  const unitIds = JYOTISH_UNITS.map((u) => u.id);

  React.useEffect(() => { track('jyotish_open'); }, []);

  const totalCorrect = Object.values(progress).reduce((a, p) => a + p.correct, 0);
  const gatesPassed = JYOTISH_UNITS.filter((u) => progress[u.id]?.trialPassed).length;
  const lastReviewDay = useJyotishStore((st) => st.lastReviewDay);
  const reviewStreak = useJyotishStore((st) => st.reviewStreak);
  const anyCompleted = JYOTISH_UNITS.some((u) => progress[u.id]?.completed);
  const reviewDoneToday = lastReviewDay === localDay(new Date());
  // where the learner should go next
  const current = JYOTISH_UNITS.find((u) => !u.locked && !progress[u.id]?.trialPassed && isUnitUnlocked(u.n, progress, unitIds));
  const curP = current ? progress[current.id] : undefined;
  const continueLabel = current
    ? curP?.completed
      ? `Face the Gate ${current.n} Trial`
      : curP?.cardIndex
        ? `Continue Gate ${current.n} · ${current.cards.length - curP.cardIndex} cards left`
        : `Begin Gate ${current.n} — ${current.title}`
    : null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: 60 }}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}><Text style={styles.backTxt}>‹</Text></Pressable>
        <Text style={styles.kicker}>JYOTISH · ज्योतिष</Text>
        <Text style={styles.title}>Path of the Sky</Text>
        <Text style={styles.sub}>Learn to read a birth chart from first principles — as a game, honestly.</Text>

        {/* Own-sky card */}
        <Pressable
          style={[styles.skyCard, !chart && styles.skyCardEmpty]}
          onPress={() => navigation.navigate('JyotishBirth')}
        >
          {chart ? (
            <>
              <Text style={styles.skyKicker}>YOUR SKY · {birth?.placeLabel}</Text>
              <Text style={styles.skyMain}>
                Moon in {SIGNS[chart.grahas[1].sign]} <Text style={styles.dev}>{SIGNS_DEV[chart.grahas[1].sign]}</Text>
              </Text>
              <Text style={styles.skyLine}>
                Nakshatra {NAKSHATRAS[chart.moonNakshatra]} · pada {chart.moonPada} · lord {NAK_LORDS[chart.moonNakshatra % 9]}
              </Text>
              <Text style={styles.skyLine}>Lagna {SIGNS[chart.ascSign]} rising · first daśā {chart.firstDashaLord}</Text>
              <Text style={styles.skyEdit}>Lessons ahead will speak of this sky · tap to edit</Text>
            </>
          ) : (
            <>
              <Text style={styles.skyKicker}>THE KEY TO EVERYTHING</Text>
              <Text style={styles.skyMain}>Add your birth details</Text>
              <Text style={styles.skyLine}>
                Every lesson then teaches with YOUR chart — your Moon, your lagna, your daśā. Stored only on this phone. Never uploaded, never in analytics.
              </Text>
            </>
          )}
        </Pressable>

        {/* Continue + Daily Review */}
        {continueLabel && current && (
          <Pressable style={styles.continueCta} onPress={() => navigation.navigate('JyotishLesson', { unitId: current.id })}>
            <Text style={styles.continueTxt}>{continueLabel} →</Text>
          </Pressable>
        )}
        {anyCompleted && (
          <Pressable
            style={[styles.reviewCard, reviewDoneToday && { opacity: 0.65 }]}
            disabled={reviewDoneToday}
            onPress={() => navigation.navigate('JyotishLesson', { review: true })}
          >
            <Text style={styles.reviewGlyph}>{reviewDoneToday ? '🌟' : '🌘'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.reviewTitle}>{reviewDoneToday ? 'Sky reviewed today' : 'Daily Sky Review'}</Text>
              <Text style={styles.reviewSub}>
                {reviewDoneToday ? `streak ${reviewStreak} 🔥 · return tomorrow` : '6 quick truths from your passed gates — keep them bright'}
              </Text>
            </View>
            {!reviewDoneToday && <Text style={{ color: GOLD, fontSize: 16 }}>›</Text>}
          </Pressable>
        )}

        {/* Journey stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}><Text style={styles.statN}>{gatesPassed}/9</Text><Text style={styles.statL}>gates</Text></View>
          <View style={styles.stat}><Text style={styles.statN}>{totalCorrect}</Text><Text style={styles.statL}>truths held</Text></View>
        </View>

        {/* The gates */}
        {JYOTISH_UNITS.map((u, i) => {
          const p = progress[u.id];
          const unlocked = !u.locked && isUnitUnlocked(u.n, progress, unitIds);
          const comingSoon = u.locked;
          const state = p?.trialPassed ? 'passed' : p?.completed ? 'trial' : unlocked ? 'open' : 'locked';
          return (
            <Pressable
              key={u.id}
              disabled={comingSoon || !unlocked}
              onPress={() => navigation.navigate('JyotishLesson', { unitId: u.id })}
              style={[styles.gate, state === 'passed' && styles.gatePassed, (comingSoon || !unlocked) && styles.gateLocked]}
            >
              <View style={styles.gateGlyphWrap}>
                <Text style={styles.gateGlyph}>{comingSoon || !unlocked ? '🔒' : u.glyph}</Text>
                {i < JYOTISH_UNITS.length - 1 && <View style={styles.thread} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.gateN}>GATE {u.n}</Text>
                <Text style={[styles.gateTitle, (comingSoon || !unlocked) && { color: '#64748b' }]}>
                  {u.title} <Text style={styles.dev}>{u.titleHi}</Text>
                </Text>
                <Text style={styles.gateTag}>{comingSoon ? TEASERS[u.n] ?? u.tagline : u.tagline}</Text>
              </View>
              <Text style={styles.gateState}>
                {state === 'passed' ? '★' : state === 'trial' ? 'trial' : state === 'open' ? '›' : ''}
              </Text>
            </Pressable>
          );
        })}

        <Text style={styles.footer}>
          Computed fact, classical craft, and interpretation are marked apart in every lesson.{'\n'}
          Leave more curious, less superstitious.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  back: { paddingHorizontal: 20, marginBottom: 2, width: 60 },
  backTxt: { color: '#94a3b8', fontSize: 30 },
  kicker: { color: GOLD, fontSize: 12, letterSpacing: 2, paddingHorizontal: 20 },
  title: { fontSize: 32, fontFamily: 'Playfair_Bold', color: '#f8fafc', paddingHorizontal: 20, marginTop: 2 },
  sub: { fontSize: 13.5, color: '#94a3b8', paddingHorizontal: 20, marginTop: 4, marginBottom: 14 },
  skyCard: {
    marginHorizontal: 16, borderRadius: 16, padding: 16, backgroundColor: '#0f1a33',
    borderWidth: 1, borderColor: 'rgba(251,191,36,.35)',
  },
  skyCardEmpty: { backgroundColor: '#0b1220', borderStyle: 'dashed' },
  skyKicker: { color: GOLD, fontSize: 10.5, letterSpacing: 1.6, marginBottom: 6 },
  skyMain: { color: '#f8fafc', fontSize: 20, fontFamily: 'Playfair_Bold' },
  skyLine: { color: '#cbd5e1', fontSize: 12.5, marginTop: 4, lineHeight: 18 },
  skyEdit: { color: '#64748b', fontSize: 11, marginTop: 8 },
  dev: { color: GOLD },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 12, marginBottom: 16 },
  stat: { flex: 1, backgroundColor: '#0b1220', borderRadius: 12, padding: 10, alignItems: 'center' },
  statN: { color: '#f8fafc', fontSize: 18, fontFamily: 'Playfair_Bold' },
  statL: { color: '#64748b', fontSize: 11, marginTop: 1 },
  gate: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 16, marginBottom: 4, padding: 12, borderRadius: 14,
    backgroundColor: '#0b1220', borderWidth: 1, borderColor: 'rgba(148,163,184,.12)',
  },
  gatePassed: { borderColor: 'rgba(251,191,36,.45)' },
  gateLocked: { opacity: 0.55 },
  gateGlyphWrap: { alignItems: 'center', width: 40 },
  gateGlyph: { fontSize: 24, color: GOLD },
  thread: { position: 'absolute', top: 34, width: 1, height: 22, backgroundColor: 'rgba(251,191,36,.25)' },
  gateN: { color: '#64748b', fontSize: 10, letterSpacing: 1.4 },
  gateTitle: { color: '#f1f5f9', fontSize: 16, fontFamily: 'Playfair_Bold', marginTop: 1 },
  gateTag: { color: '#94a3b8', fontSize: 12, marginTop: 1 },
  gateState: { color: GOLD, fontSize: 15 },
  continueCta: { marginHorizontal: 16, marginTop: 12, backgroundColor: GOLD, borderRadius: 14, paddingVertical: 14 },
  continueTxt: { color: '#0b1220', fontSize: 15.5, fontWeight: '700', textAlign: 'center' },
  reviewCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginTop: 10, backgroundColor: '#0f1a33', borderRadius: 14, padding: 13, borderWidth: 1, borderColor: 'rgba(148,163,184,.2)' },
  reviewGlyph: { fontSize: 22 },
  reviewTitle: { color: '#f1f5f9', fontSize: 14.5, fontFamily: 'Playfair_Bold' },
  reviewSub: { color: '#94a3b8', fontSize: 11.5, marginTop: 1 },
  footer: { color: '#475569', fontSize: 11.5, textAlign: 'center', marginTop: 22, lineHeight: 17 },
});
