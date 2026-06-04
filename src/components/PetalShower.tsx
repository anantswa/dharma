import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const PETALS = ['🌸', '🌼', '🪷', '🌺'];

/**
 * पुष्प वृष्टि — a one-shot flower-petal shower. Far more on-brand than confetti:
 * blessings rain down when you learn a verse by heart. Pure Reanimated (Expo-Go safe).
 */
const Petal: React.FC<{ index: number }> = ({ index }) => {
  const t = useSharedValue(0);
  // Deterministic-ish spread from the index (no reliance on a single RNG seed).
  const startX = ((index * 53) % 100) / 100 * width;
  const drift = (((index * 31) % 80) - 40);
  const delay = (index % 8) * 120;
  const dur = 2600 + ((index * 37) % 1400);
  const emoji = PETALS[index % PETALS.length];
  const size = 18 + ((index * 7) % 14);

  useEffect(() => {
    t.value = withDelay(delay, withTiming(1, { duration: dur, easing: Easing.linear }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: -60 + t.value * (height + 120) },
      { translateX: t.value * drift },
      { rotate: `${t.value * 360 * (index % 2 ? 1 : -1)}deg` },
    ],
    opacity: t.value < 0.85 ? 1 : (1 - t.value) / 0.15,
  }));

  return (
    <Animated.View style={[{ position: 'absolute', left: startX, top: 0 }, style]}>
      <Text style={{ fontSize: size }}>{emoji}</Text>
    </Animated.View>
  );
};

export const PetalShower: React.FC<{ count?: number }> = ({ count = 22 }) => (
  <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    {Array.from({ length: count }).map((_, i) => (
      <Petal key={i} index={i} />
    ))}
  </View>
);
