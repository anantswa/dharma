import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

/**
 * The single on/off control for the temple's deity-mantra. No track selection —
 * just "let the mantra play." When on, it shows the syllables currently chanting
 * (which crossfade as you swipe between deities).
 */
type Props = {
  on: boolean;
  onToggle: () => void;
  accent: string;
  /** Devanagari of the chant currently playing (caption above the button). */
  caption?: string;
};

export const DeityMantraToggle: React.FC<Props> = ({ on, onToggle, accent, caption }) => (
  <View style={styles.wrap} pointerEvents="box-none">
    {on && !!caption && (
      <View style={[styles.captionPill, { borderColor: `${accent}66` }]}>
        <Text style={[styles.caption, { color: accent }]} numberOfLines={1}>{caption}</Text>
      </View>
    )}
    <Pressable
      style={[styles.button, on && { borderColor: accent, shadowOpacity: 0.6 }]}
      onPress={onToggle}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="switch"
      accessibilityLabel="Play the deity's mantra"
      accessibilityState={{ checked: on }}
    >
      <Ionicons name={on ? 'musical-notes' : 'musical-note-outline'} size={24} color={accent} />
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  wrap: { position: 'absolute', bottom: 100, right: 20, alignItems: 'center', zIndex: 10 },
  captionPill: {
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(15,23,42,0.92)',
    maxWidth: 220,
  },
  caption: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(15,23,42,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(251,191,36,0.45)',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
});
