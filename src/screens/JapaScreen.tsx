import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { PetalShower } from '../components/PetalShower';
import { UNIVERSAL_OM } from '../data/deityMantras';
import { getFaithTheme } from '../data/faiths';
import { useDeityMantra } from '../hooks/useDeityMantra';
import { usePreferencesStore } from '../store/preferencesStore';
import { useJapaStore } from '../store/japaStore';
import { track } from '../services/analytics';

const MANTRAS_BASE =
  'https://aiwugigdrvijjeoqtpog.supabase.co/storage/v1/object/public/dharma-audio/mantras';
const MALA = 108;

/**
 * Japa — the mala counter. Tap anywhere to count a repetition; a haptic bead-tick
 * marks each one; at 108 the mala completes with petals and a lifetime mala is added.
 * The universal Om loops softly underneath (toggleable). Eyes-closed friendly:
 * the whole screen is the bead.
 */
export const JapaScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const theme = getFaithTheme(usePreferencesStore.getState().primaryTradition);
  const malas = useJapaStore((s) => s.malas);
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);
  const [chantOn, setChantOn] = useState(true);
  const [manifest, setManifest] = useState<Record<string, string>>({});
  const pulse = useSharedValue(1);

  useEffect(() => {
    useJapaStore.getState().load();
    track('japa_start');
    let alive = true;
    fetch(`${MANTRAS_BASE}/catalog.json`)
      .then((r) => r.json())
      .then((d) => { if (alive && d && typeof d === 'object') setManifest(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const omUrl = manifest[UNIVERSAL_OM.key];
  useDeityMantra(chantOn ? omUrl : undefined, chantOn);

  const ringStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const bead = async () => {
    if (done) return;
    try {
      // every 27th bead gets a deeper tick — the mala's quarter marks
      if ((count + 1) % 27 === 0) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      else Haptics.selectionAsync();
    } catch { /* noop */ }
    pulse.value = withSequence(withTiming(1.06, { duration: 90 }), withTiming(1, { duration: 160 }));
    const next = count + 1;
    setCount(next);
    if (next >= MALA) {
      setDone(true);
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch { /* noop */ }
      await useJapaStore.getState().addReps(MALA);
      await useJapaStore.getState().completeMala();
      track('japa_mala_complete');
    }
  };

  const again = () => { setCount(0); setDone(false); };

  const progress = useMemo(() => count / MALA, [count]);

  return (
    <Pressable style={styles.container} onPress={bead}>
      <LinearGradient colors={['#020617', '#0b1220', '#020617']} style={StyleSheet.absoluteFill} />
      {done && <PetalShower />}

      {/* top bar */}
      <View style={styles.top}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={16}>
          <Ionicons name="chevron-back" size={26} color="#e2e8f0" />
        </Pressable>
        <Text style={styles.lifetime}>📿 {malas} mala{malas === 1 ? '' : 's'} offered</Text>
        <Pressable
          onPress={(e) => { e.stopPropagation?.(); setChantOn((v) => !v); }}
          hitSlop={12}
        >
          <Ionicons name={chantOn ? 'volume-high' : 'volume-mute'} size={20} color={chantOn ? theme.accent : '#64748b'} />
        </Pressable>
      </View>

      {/* the bead field */}
      <View style={styles.center} pointerEvents="none">
        <Animated.Text style={[styles.om, { color: theme.accent }, ringStyle]}>ॐ</Animated.Text>
        {!done ? (
          <>
            <Text style={styles.count}>{count}</Text>
            <Text style={styles.of}>of {MALA}</Text>
            <View style={styles.barWrap}>
              <View style={[styles.barFill, { width: `${progress * 100}%`, backgroundColor: theme.accent }]} />
            </View>
            <Text style={styles.hint}>{count === 0 ? 'tap anywhere to begin your japa' : ' '}</Text>
          </>
        ) : (
          <Animated.View entering={FadeIn.duration(600)} style={{ alignItems: 'center' }}>
            <Text style={styles.doneTitle}>Mala complete</Text>
            <Text style={styles.doneSub}>108 repetitions offered. 🙏</Text>
          </Animated.View>
        )}
      </View>

      {/* bottom */}
      {done && (
        <View style={styles.bottom}>
          <Pressable style={[styles.againBtn, { backgroundColor: theme.accent }]} onPress={(e) => { e.stopPropagation?.(); again(); }}>
            <Text style={styles.againTxt}>Begin another mala</Text>
          </Pressable>
          <Pressable onPress={(e) => { e.stopPropagation?.(); navigation.goBack(); }} style={{ padding: 14 }}>
            <Text style={styles.closeTxt}>Return with the stillness</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  top: {
    paddingTop: 56, paddingHorizontal: 18, paddingBottom: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  lifetime: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  om: { fontSize: 110, opacity: 0.9, marginBottom: 8 },
  count: { color: '#f8fafc', fontSize: 64, fontFamily: 'Playfair_Bold', lineHeight: 72 },
  of: { color: '#64748b', fontSize: 14, marginTop: 2 },
  barWrap: {
    width: 220, height: 5, borderRadius: 3, backgroundColor: 'rgba(148,163,184,0.18)',
    overflow: 'hidden', marginTop: 18,
  },
  barFill: { height: '100%', borderRadius: 3 },
  hint: { color: '#64748b', fontSize: 13, fontStyle: 'italic', marginTop: 18 },
  doneTitle: { color: '#f8fafc', fontSize: 30, fontFamily: 'Playfair_Bold' },
  doneSub: { color: '#94a3b8', fontSize: 15, marginTop: 8 },
  bottom: { paddingHorizontal: 24, paddingBottom: 46, alignItems: 'center', gap: 4 },
  againBtn: { borderRadius: 16, paddingVertical: 15, paddingHorizontal: 40 },
  againTxt: { color: '#0b1220', fontSize: 15.5, fontWeight: '800' },
  closeTxt: { color: '#94a3b8', fontSize: 13.5 },
});
