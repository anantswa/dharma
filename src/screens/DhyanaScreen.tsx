import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getFaithTheme } from '../data/faiths';
import { BUNDLED_DHYANA_TRACKS, DhyanaTrack, fetchDhyanaTracks } from '../data/dhyana';

/**
 * Dhyāna — a meditation room in the Mandir. Five guided sits, everything free,
 * no streaks and no locks: a room you enter, not a program you keep up with.
 * The catalog streams from the CDN with the bundled copy as fallback, so the
 * room opens offline too.
 */
export const DhyanaScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const theme = getFaithTheme('Hindu');
  const [tracks, setTracks] = useState<DhyanaTrack[]>(BUNDLED_DHYANA_TRACKS);

  useEffect(() => {
    let alive = true;
    fetchDhyanaTracks().then((t) => { if (alive) setTracks(t); });
    return () => { alive = false; };
  }, []);

  const open = (t: DhyanaTrack) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch { /* noop */ }
    navigation.navigate('DhyanaPlayer', { track: t });
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#020617', '#0b1220', '#020617']} style={StyleSheet.absoluteFill} />
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={16}><Ionicons name="chevron-back" size={26} color="#e2e8f0" /></Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.kicker, { color: theme.accent }]}>DHYĀNA</Text>
        <Text style={styles.title}>The Meditation Room</Text>
        <Text style={styles.sub}>Sit down. A voice will keep you company, then leave you in the quiet.</Text>

        {tracks.map((t) => (
          <Pressable key={t.id} style={styles.card} onPress={() => open(t)}>
            <LinearGradient
              colors={[`${theme.accent}18`, `${theme.accent}05`]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.cardGrad}
            >
              <View style={styles.rowTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.trackTitle}>{t.title}</Text>
                  <Text style={styles.trackSanskrit}>{t.sanskrit}</Text>
                </View>
                <View style={styles.rightCol}>
                  <View style={[styles.chip, { backgroundColor: `${theme.accent}1c` }]}>
                    <Text style={[styles.chipTxt, { color: theme.accent }]}>{t.collection}</Text>
                  </View>
                  <Text style={styles.minutes}>{t.minutes} min{t.sleep ? ' · sleep' : ''}</Text>
                </View>
              </View>
              <Text style={styles.line}>{t.line}</Text>
            </LinearGradient>
          </Pressable>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  topBar: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 4 },
  scroll: { paddingHorizontal: 18, paddingBottom: 40 },
  kicker: { fontSize: 12, letterSpacing: 3, fontWeight: '800' },
  title: { fontSize: 32, color: '#f8fafc', fontFamily: 'Playfair_Bold', marginTop: 4 },
  sub: { fontSize: 13.5, color: '#94a3b8', marginTop: 6, marginBottom: 18, lineHeight: 19 },
  card: { borderRadius: 18, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  cardGrad: { padding: 16 },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  trackTitle: { fontSize: 17.5, fontFamily: 'Playfair_Bold', color: '#f1f5f9' },
  trackSanskrit: { fontSize: 12.5, color: '#94a3b8', marginTop: 3, fontStyle: 'italic' },
  rightCol: { alignItems: 'flex-end', gap: 6 },
  chip: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  chipTxt: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.5 },
  minutes: { fontSize: 11.5, color: '#64748b', fontWeight: '700' },
  line: { fontSize: 13, color: '#94a3b8', lineHeight: 19, marginTop: 10 },
});
