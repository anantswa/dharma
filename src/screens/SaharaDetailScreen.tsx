import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { getSaharaNeed, saharaArtUrl } from '../data/sahara';
import { getFaithTheme } from '../data/faiths';
import { resolveChant } from '../data/deityMantras';
import { useDeityMantra } from '../hooks/useDeityMantra';
import { usePreferencesStore } from '../store/preferencesStore';
import { track } from '../services/analytics';

const MANTRAS_BASE =
  'https://aiwugigdrvijjeoqtpog.supabase.co/storage/v1/object/public/dharma-audio/mantras';

const BREATH_SEC = 4; // in 4s, out 4s — matches the practice instructions

/** Softly expanding/contracting circle — breathe with it. */
const BreathingGuide: React.FC<{ accent: string }> = ({ accent }) => {
  const scale = useSharedValue(1);
  const [phase, setPhase] = useState<'in' | 'out'>('in');

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.45, { duration: BREATH_SEC * 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0, { duration: BREATH_SEC * 1000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
    const t = setInterval(() => setPhase((p) => (p === 'in' ? 'out' : 'in')), BREATH_SEC * 1000);
    return () => clearInterval(t);
  }, [scale]);

  const ring = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={styles.breathWrap}>
      <View style={styles.breathBox}>
        <Animated.View style={[styles.breathRing, { borderColor: accent, shadowColor: accent }, ring]} />
        <View style={[styles.breathCore, { backgroundColor: accent }]} />
      </View>
      <Text style={styles.breathLabel}>{phase === 'in' ? 'breathe in…' : 'breathe out…'}</Text>
    </View>
  );
};

/** The experience for one need — deity, mantra (with soft chant), breath, verses. */
export const SaharaDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const need = getSaharaNeed(route.params?.needId);
  const theme = getFaithTheme(usePreferencesStore.getState().primaryTradition);
  const meaningLang = usePreferencesStore((s) => s.meaningLang);

  // Soft chant — same live manifest + resolver as the temple.
  const [manifest, setManifest] = useState<Record<string, string>>({});
  const [chantOn, setChantOn] = useState(true);
  useEffect(() => {
    let alive = true;
    fetch(`${MANTRAS_BASE}/catalog.json`)
      .then((r) => r.json())
      .then((d) => { if (alive && d && typeof d === 'object') setManifest(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  const chant = useMemo(() => resolveChant(need.deityName, manifest), [need.deityName, manifest]);
  useDeityMantra(chantOn ? chant?.url : undefined, chantOn);

  useEffect(() => { track('sahara_detail', { need: need.id }); }, [need.id]);

  const mantra = chant?.mantra;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#020617', '#0b1220', '#020617']} style={StyleSheet.absoluteFill} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
        {/* deity header */}
        <View style={styles.hero}>
          <ExpoImage
            source={{ uri: saharaArtUrl(need.artSlug) }}
            style={StyleSheet.absoluteFill as any}
            contentFit="cover"
            contentPosition={{ top: '7%' }}
            transition={400}
          />
          <LinearGradient
            colors={['rgba(2,6,23,0.25)', 'rgba(2,6,23,0.0)', 'rgba(2,6,23,0.65)', '#020617']}
            locations={[0, 0.25, 0.75, 1]}
            style={StyleSheet.absoluteFill}
          />
          <Pressable style={styles.back} onPress={() => navigation.goBack()} hitSlop={16}>
            <Ionicons name="chevron-back" size={24} color="#f8fafc" />
          </Pressable>
          <View style={styles.heroInner}>
            <Text style={styles.heroEmoji}>{need.emoji}</Text>
            <Text style={styles.heroTitle}>{need.label}</Text>
            <Text style={styles.heroBridge}>{need.bridge}</Text>
          </View>
        </View>

        <View style={styles.body}>
          {/* mantra card */}
          {mantra && (
            <Animated.View entering={FadeInDown.delay(100).duration(500)}>
              <View style={[styles.card, { borderColor: theme.accentSoft }]}>
                <View style={styles.cardHead}>
                  <Text style={[styles.cardKicker, { color: theme.accent }]}>THE MANTRA</Text>
                  <Pressable
                    onPress={() => { try { Haptics.selectionAsync(); } catch { /* noop */ } setChantOn((v) => !v); }}
                    hitSlop={10}
                    style={[styles.chantBtn, chantOn && { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}
                  >
                    <Ionicons name={chantOn ? 'volume-high' : 'volume-mute'} size={15} color={chantOn ? theme.accent : '#64748b'} />
                    <Text style={[styles.chantTxt, { color: chantOn ? theme.accent : '#64748b' }]}>
                      {chantOn ? 'chanting' : 'silent'}
                    </Text>
                  </Pressable>
                </View>
                <Text style={styles.mantraDeva}>{mantra.deva}</Text>
                <Text style={styles.mantraTrans}>{mantra.trans}</Text>
                <Text style={styles.mantraSource}>{mantra.source}</Text>
              </View>
            </Animated.View>
          )}

          {/* breath practice */}
          <Animated.View entering={FadeInDown.delay(220).duration(500)}>
            <View style={[styles.card, { borderColor: theme.accentSoft }]}>
              <Text style={[styles.cardKicker, { color: theme.accent }]}>THE PRACTICE · {need.practice.title.toUpperCase()}</Text>
              <BreathingGuide accent={theme.accent} />
              {need.practice.steps.map((s, i) => (
                <View key={i} style={styles.stepRow}>
                  <Text style={[styles.stepNum, { color: theme.accent }]}>{i + 1}</Text>
                  <Text style={styles.stepTxt}>{s}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* verses */}
          {need.verses.map((v, i) => (
            <Animated.View key={i} entering={FadeInDown.delay(340 + i * 120).duration(500)}>
              <View style={[styles.card, { borderColor: theme.accentSoft }]}>
                <Text style={[styles.cardKicker, { color: theme.accent }]}>{i === 0 ? 'THE WORD' : 'AND THIS'}</Text>
                <Text style={styles.verseDeva}>{v.deva}</Text>
                <Text style={styles.verseMeaning}>{meaningLang === 'en' ? v.en : v.hi}</Text>
                <Text style={styles.verseSource}>— {v.source}</Text>
              </View>
            </Animated.View>
          ))}

          {/* closing */}
          <Animated.View entering={FadeInDown.delay(620).duration(600)}>
            <Text style={[styles.closing, { color: theme.accent }]}>{need.closing}</Text>
            <Pressable
              style={[styles.done, { backgroundColor: theme.accent }]}
              onPress={() => {
                try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch { /* noop */ }
                track('sahara_complete', { need: need.id });
                navigation.goBack();
              }}
            >
              <Text style={styles.doneTxt}>🪔  Carry it with you</Text>
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  hero: { height: 380, justifyContent: 'flex-end' },
  back: {
    position: 'absolute', top: 54, left: 14, zIndex: 5,
    width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(2,6,23,0.55)',
  },
  heroInner: { padding: 22, paddingBottom: 14 },
  heroEmoji: { fontSize: 28, marginBottom: 6 },
  heroTitle: { color: '#f8fafc', fontSize: 30, fontFamily: 'Playfair_Bold' },
  heroBridge: { color: '#cbd5e1', fontSize: 14, lineHeight: 21, marginTop: 8 },
  body: { paddingHorizontal: 20 },
  card: {
    borderWidth: 1, borderRadius: 20, padding: 18,
    backgroundColor: 'rgba(15,23,42,0.55)', marginBottom: 14,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardKicker: { fontSize: 10.5, letterSpacing: 1.8, fontWeight: '800', marginBottom: 12 },
  chantBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderColor: 'rgba(148,163,184,0.25)', borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 5, marginTop: -6,
  },
  chantTxt: { fontSize: 11.5, fontWeight: '700' },
  mantraDeva: { color: '#f8fafc', fontSize: 26, fontFamily: 'Playfair_Medium', lineHeight: 40 },
  mantraTrans: { color: '#94a3b8', fontSize: 14, fontStyle: 'italic', marginTop: 8 },
  mantraSource: { color: '#64748b', fontSize: 12, marginTop: 10 },
  breathWrap: { alignItems: 'center', marginVertical: 10 },
  breathBox: { width: 130, height: 130, alignItems: 'center', justifyContent: 'center' },
  breathRing: {
    position: 'absolute', width: 80, height: 80, borderRadius: 40, borderWidth: 1.5,
    opacity: 0.85, shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 0 },
  },
  breathCore: { width: 14, height: 14, borderRadius: 7, opacity: 0.9 },
  breathLabel: { color: '#94a3b8', fontSize: 13, fontStyle: 'italic', marginTop: 6, marginBottom: 12 },
  stepRow: { flexDirection: 'row', gap: 12, marginBottom: 10, alignItems: 'flex-start' },
  stepNum: { fontSize: 14, fontWeight: '800', width: 14, lineHeight: 21 },
  stepTxt: { color: '#cbd5e1', fontSize: 14, lineHeight: 21, flex: 1 },
  verseDeva: { color: '#f1f5f9', fontSize: 18, fontFamily: 'Playfair_Medium', lineHeight: 30 },
  verseMeaning: { color: '#cbd5e1', fontSize: 14.5, lineHeight: 22, marginTop: 12 },
  verseSource: { color: '#64748b', fontSize: 12, marginTop: 10 },
  closing: { fontSize: 18, fontFamily: 'Playfair_Bold', textAlign: 'center', marginVertical: 22, lineHeight: 27, paddingHorizontal: 14 },
  done: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  doneTxt: { color: '#0b1220', fontSize: 15.5, fontWeight: '800' },
});
