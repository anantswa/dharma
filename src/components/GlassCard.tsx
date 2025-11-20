// src/components/GlassCard.tsx
import React, { ReactNode } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
};

export const GlassCard: React.FC<Props> = ({ children, style }) => {
  return (
    <BlurView intensity={70} tint="dark" style={[styles.glass, style]}>
      {children}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  glass: {
    borderRadius: 26,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    backgroundColor: 'rgba(15,23,42,0.45)', // more translucent
    overflow: 'hidden',
  },
});

