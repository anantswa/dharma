import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { MantraLesson } from '../../data/vidya/types';
import { useVidyaPlayer, VidyaPlayer, VidyaTrackKind } from '../../services/vidyaPlayer';

const fmt = (ms: number): string => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
};

const TRACKS: { kind: VidyaTrackKind; label: string }[] = [
  { kind: 'slow', label: 'Slow' },
  { kind: 'natural', label: 'Natural' },
  { kind: 'sung', label: 'Sung' },
];

type Props = { lesson: MantraLesson; accent: string; bottomInset: number };

/**
 * The pinned mini-player — modelled on MiniMusicPlayer.tsx: progress hairline,
 * track picker (slow / natural / sung — sung greyed when the lesson has no
 * loop or master), a scrubber whose label shows the current word, play/pause.
 * Present on lesson screens 1–7; the recall screen hides it.
 */
export const VidyaMiniPlayer: React.FC<Props> = ({ lesson, accent, bottomInset }) => {
  const isPlaying = useVidyaPlayer((s) => s.isPlaying);
  const loading = useVidyaPlayer((s) => s.loading);
  const kind = useVidyaPlayer((s) => s.kind);
  const position = useVidyaPlayer((s) => s.position);
  const duration = useVidyaPlayer((s) => s.duration);
  const wordIndex = useVidyaPlayer((s) => s.wordIndex);
  const sungUrl = useVidyaPlayer((s) => s.sungUrl);

  const word = wordIndex >= 0 ? lesson.words[wordIndex] : undefined;
  const label = word ? `${word.iast} — ${word.glossEn}` : lesson.titleHi;

  return (
    <View style={[styles.container, { paddingBottom: bottomInset + 8 }]}>
      <View style={styles.hairline}>
        <View style={[styles.hairlineFill, { width: `${duration > 0 ? Math.min(100, (position / duration) * 100) : 0}%`, backgroundColor: accent }]} />
      </View>

      <View style={styles.pickerRow}>
        {TRACKS.map((t) => {
          const enabled = t.kind !== 'sung' || !!sungUrl;
          const active = kind === t.kind;
          return (
            <Pressable
              key={t.kind}
              disabled={!enabled}
              onPress={() => VidyaPlayer.selectTrack(t.kind)}
              style={[styles.chip, active && { borderColor: accent, backgroundColor: `${accent}1f` }, !enabled && styles.chipOff]}
              accessibilityRole="button"
              accessibilityState={{ selected: active, disabled: !enabled }}
            >
              <Text style={[styles.chipTxt, active && { color: accent }, !enabled && styles.chipTxtOff]}>{t.label}</Text>
            </Pressable>
          );
        })}
        <Text style={styles.time}>{fmt(position)} / {fmt(duration)}</Text>
      </View>

      <View style={styles.row}>
        <Pressable
          style={[styles.playBtn, { backgroundColor: accent }]}
          onPress={() => VidyaPlayer.toggle()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
        >
          {loading ? (
            <ActivityIndicator color="#0b1220" />
          ) : (
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color="#0b1220" style={isPlaying ? undefined : { marginLeft: 2 }} />
          )}
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, word && { color: accent }]} numberOfLines={1}>{label}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration || 1}
            value={Math.min(position, duration || 1)}
            onSlidingComplete={(v) => VidyaPlayer.seek(v)}
            minimumTrackTintColor={accent}
            maximumTrackTintColor="rgba(148,163,184,0.25)"
            thumbTintColor={accent}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(11,18,32,0.98)',
    borderTopWidth: 1, borderTopColor: 'rgba(251,191,36,0.22)',
    paddingHorizontal: 14, paddingTop: 6,
    zIndex: 200, elevation: 200,
  },
  hairline: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: 'rgba(255,255,255,0.08)' },
  hairlineFill: { height: '100%' },
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: 'rgba(148,163,184,0.25)', paddingHorizontal: 11, paddingVertical: 4, minHeight: 28, justifyContent: 'center' },
  chipOff: { opacity: 0.35 },
  chipTxt: { color: '#94a3b8', fontSize: 11.5, fontWeight: '700' },
  chipTxtOff: { color: '#64748b' },
  time: { marginLeft: 'auto', color: '#64748b', fontSize: 11, fontWeight: '600', fontVariant: ['tabular-nums'] },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  playBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  label: { color: '#cbd5e1', fontSize: 12.5, fontFamily: 'Playfair_Medium', marginLeft: 4 },
  slider: { alignSelf: 'stretch', height: 30, marginTop: -2 },
});
