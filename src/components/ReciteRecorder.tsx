import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type State = 'idle' | 'recording' | 'recorded';

/**
 * Recite-and-hear-yourself. The first half of the "magic moment": you say the verse
 * aloud, then play it back to self-check against Kuber. Pure client (expo-av) — works
 * in Expo Go today. Pronunciation *scoring* is the planned server fast-follow.
 */
export const ReciteRecorder: React.FC<{ accent: string }> = ({ accent }) => {
  const [state, setState] = useState<State>('idle');
  const recRef = useRef<Audio.Recording | null>(null);
  const uriRef = useRef<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => () => {
    recRef.current?.stopAndUnloadAsync().catch(() => {});
    soundRef.current?.unloadAsync().catch(() => {});
  }, []);

  const start = async () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) return;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recRef.current = recording;
      setState('recording');
    } catch { setState('idle'); }
  };

  const stop = async () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    try {
      await recRef.current?.stopAndUnloadAsync();
      uriRef.current = recRef.current?.getURI() ?? null;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      setState(uriRef.current ? 'recorded' : 'idle');
    } catch { setState('idle'); }
  };

  const playback = async () => {
    if (!uriRef.current) return;
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    try {
      await soundRef.current?.unloadAsync();
      const { sound } = await Audio.Sound.createAsync({ uri: uriRef.current }, { shouldPlay: true });
      soundRef.current = sound;
    } catch {}
  };

  if (state === 'recording') {
    return (
      <Pressable style={[styles.btn, { borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.12)' }]} onPress={stop}>
        <View style={styles.recDot} />
        <Text style={[styles.txt, { color: '#f87171' }]}>Recording… tap to stop</Text>
      </Pressable>
    );
  }
  if (state === 'recorded') {
    return (
      <View style={styles.row}>
        <Pressable style={[styles.btn, { borderColor: accent, flex: 1 }]} onPress={playback}>
          <Ionicons name="play" size={16} color={accent} />
          <Text style={[styles.txt, { color: accent }]}>Hear yourself</Text>
        </Pressable>
        <Pressable style={[styles.iconBtn, { borderColor: accent }]} onPress={start}>
          <Ionicons name="refresh" size={16} color={accent} />
        </Pressable>
      </View>
    );
  }
  return (
    <Pressable style={[styles.btn, { borderColor: accent }]} onPress={start}>
      <Ionicons name="mic" size={16} color={accent} />
      <Text style={[styles.txt, { color: accent }]}>Recite it aloud</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 999, paddingVertical: 11, paddingHorizontal: 16 },
  iconBtn: { width: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 999 },
  txt: { fontSize: 14, fontWeight: '600' },
  recDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#ef4444' },
});
