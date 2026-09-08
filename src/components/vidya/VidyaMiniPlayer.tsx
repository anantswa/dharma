import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { MantraLesson } from '../../data/vidya/types';
import { useVidyaPlayer, VidyaPlayer } from '../../services/vidyaPlayer';

const fmt = (ms: number): string => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
};

type Props = { lesson: MantraLesson; accent: string; bottomInset: number };

/**
 * The pinned mini-player — modelled on MiniMusicPlayer.tsx: progress hairline,
 * play/pause, a scrubber. v2: ONE track (the sung one), so no picker; the bar
 * renders nothing at all when the card has no sung track.
 */
export const VidyaMiniPlayer: React.FC<Props> = ({ lesson, accent, bottomInset }) => {
  const hasTrack = useVidyaPlayer((s) => s.hasTrack);
  const isPlaying = useVidyaPlayer((s) => s.isPlaying);
  const loading = useVidyaPlayer((s) => s.loading);
  const position = useVidyaPlayer((s) => s.position);
  const duration = useVidyaPlayer((s) => s.duration);

  if (!hasTrack) return null;

  return (
    <View style={[styles.container, { paddingBottom: bottomInset + 8 }]}>
      <View style={styles.hairline}>
        <View style={[styles.hairlineFill, { width: `${duration > 0 ? Math.min(100, (position / duration) * 100) : 0}%`, backgroundColor: accent }]} />
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
          <View style={styles.labelRow}>
            <Text style={styles.label} numberOfLines={1}>{lesson.titleHi}</Text>
            <Text style={styles.time}>{fmt(position)} / {fmt(duration)}</Text>
          </View>
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
    paddingHorizontal: 14, paddingTop: 10,
    zIndex: 200, elevation: 200,
  },
  hairline: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: 'rgba(255,255,255,0.08)' },
  hairlineFill: { height: '100%' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  playBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 4 },
  label: { flex: 1, color: '#cbd5e1', fontSize: 12.5, fontFamily: 'Playfair_Medium' },
  time: { color: '#64748b', fontSize: 11, fontWeight: '600', fontVariant: ['tabular-nums'] },
  slider: { alignSelf: 'stretch', height: 30, marginTop: -2 },
});
