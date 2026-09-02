import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getFaithTheme } from '../data/faiths';
import { DhyanaTrack } from '../data/dhyana';
import { track as trackEvent } from '../services/analytics';

const fmt = (ms: number): string => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
};

/**
 * The sit itself. One voice, one lamp, no artwork and no next-up — the sit
 * ends where the track ends (autoplay-next is against canon: silence is the
 * point, not a queue). Audio keeps playing with the phone locked
 * (UIBackgroundModes audio + staysActiveInBackground), which the 25-minute
 * sleep track depends on.
 */
export const DhyanaPlayerScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const meditation: DhyanaTrack = route.params.track;
  const theme = getFaithTheme('Hindu');

  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(meditation.minutes * 60_000);
  const [finished, setFinished] = useState(false);

  const soundRef = useRef<Audio.Sound | null>(null);
  const positionRef = useRef(0);
  const durationRef = useRef(meditation.minutes * 60_000);
  const completeSentRef = useRef(false);

  const sendComplete = () => {
    if (completeSentRef.current) return;
    completeSentRef.current = true;
    trackEvent('meditation_complete', { id: meditation.id });
  };

  useEffect(() => {
    let alive = true;
    trackEvent('meditation_start', { id: meditation.id, collection: meditation.collection });

    const onStatus = (st: AVPlaybackStatus) => {
      if (!st.isLoaded) return;
      positionRef.current = st.positionMillis;
      setPosition(st.positionMillis);
      if (st.durationMillis) { durationRef.current = st.durationMillis; setDuration(st.durationMillis); }
      setPlaying(st.isPlaying);
      if (st.didJustFinish) {
        // natural end — the room goes quiet; nothing queues up next
        sendComplete();
        setFinished(true);
        setPlaying(false);
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch { /* noop */ }
      }
    };

    (async () => {
      try {
        // Scoped here (same values AudioService uses) so the lock-screen /
        // background guarantee never depends on another screen having run first.
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          interruptionModeIOS: 1,
          interruptionModeAndroid: 1,
        });
        const { sound } = await Audio.Sound.createAsync(
          { uri: meditation.url },
          { shouldPlay: true, progressUpdateIntervalMillis: 500 },
          onStatus,
        );
        if (!alive) { await sound.unloadAsync().catch(() => {}); return; }
        soundRef.current = sound;
      } catch { /* stream failed — the play button below simply stays idle */ }
    })();

    return () => {
      alive = false;
      // leaving early: ≥90% listened counts as a completed sit, else an abandon
      if (!completeSentRef.current) {
        const dur = durationRef.current;
        if (dur > 0 && positionRef.current / dur >= 0.9) {
          completeSentRef.current = true;
          trackEvent('meditation_complete', { id: meditation.id });
        } else {
          trackEvent('meditation_abandon', { id: meditation.id, position_s: Math.round(positionRef.current / 1000) });
        }
      }
      const s = soundRef.current;
      soundRef.current = null;
      if (s) { s.stopAsync().catch(() => {}); s.unloadAsync().catch(() => {}); }
    };
    // the sit is fixed for the life of the screen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePlay = async () => {
    const s = soundRef.current;
    if (!s) return;
    try {
      if (playing) { await s.pauseAsync(); return; }
      if (finished) { setFinished(false); await s.setPositionAsync(0); }
      await s.playAsync();
    } catch { /* noop */ }
  };

  const seek = async (ms: number) => {
    try { await soundRef.current?.setPositionAsync(ms); } catch { /* noop */ }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#020617', '#0b1220', '#020617']} style={StyleSheet.absoluteFill} />

      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={16}>
          <Ionicons name="chevron-back" size={26} color="#e2e8f0" />
        </Pressable>
      </View>

      {/* the room: a lamp, a name, nothing that asks for attention */}
      <View style={styles.center}>
        <Text style={[styles.kicker, { color: theme.accent }]}>{meditation.collection.toUpperCase()}</Text>
        <Text style={styles.diya}>🪔</Text>
        <Text style={styles.title}>{meditation.title}</Text>
        <Text style={styles.sanskrit}>{meditation.sanskrit}</Text>
        {meditation.sleep ? (
          <Text style={styles.sleepSub}>lying down · the voice does not return</Text>
        ) : (
          <Text style={styles.line}>{meditation.line}</Text>
        )}
        {finished && <Text style={[styles.finished, { color: theme.accent }]}>The sit is complete. 🙏</Text>}
      </View>

      <View style={styles.controls}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration || 1}
          value={position}
          onSlidingComplete={seek}
          minimumTrackTintColor={theme.accent}
          maximumTrackTintColor="rgba(148,163,184,0.25)"
          thumbTintColor={theme.accent}
        />
        <View style={styles.timeRow}>
          <Text style={styles.time}>{fmt(position)}</Text>
          {/* sleep sits don't count down at you — elapsed only */}
          {!meditation.sleep && <Text style={styles.time}>-{fmt(Math.max(0, duration - position))}</Text>}
        </View>
        <Pressable style={[styles.playBtn, { backgroundColor: theme.accent }]} onPress={togglePlay} hitSlop={10}>
          <Ionicons name={playing ? 'pause' : 'play'} size={30} color="#0b1220" style={playing ? undefined : { marginLeft: 3 }} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  topBar: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34 },
  kicker: { fontSize: 11, letterSpacing: 2.5, fontWeight: '800' },
  diya: { fontSize: 40, marginTop: 18, marginBottom: 14 },
  title: { fontSize: 27, fontFamily: 'Playfair_Bold', color: '#f8fafc', textAlign: 'center' },
  sanskrit: { fontSize: 14, color: '#94a3b8', fontStyle: 'italic', marginTop: 6 },
  line: { fontSize: 13.5, color: '#64748b', lineHeight: 20, textAlign: 'center', marginTop: 16 },
  sleepSub: { fontSize: 13.5, color: '#64748b', fontStyle: 'italic', marginTop: 16 },
  finished: { fontSize: 14.5, fontWeight: '700', marginTop: 22 },
  controls: { paddingHorizontal: 26, paddingBottom: 58, alignItems: 'center' },
  slider: { alignSelf: 'stretch', height: 36 },
  timeRow: { alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 18 },
  time: { color: '#64748b', fontSize: 12, fontWeight: '600', fontVariant: ['tabular-nums'] },
  playBtn: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center' },
});
