// src/screens/SettingsScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const SettingsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>
        Notifications, themes, and personal practice preferences.
      </Text>
      <Text style={styles.placeholder}>
        v0.1 — Coming soon. Next step: reminder times, “traditions to surface”, and backup/restore.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  title: {
    fontSize: 28,
    color: '#fbbf24',
    fontFamily: 'Playfair_Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#e5e7eb',
    fontFamily: 'Playfair_Regular',
    marginBottom: 24,
  },
  placeholder: {
    fontSize: 14,
    color: '#9ca3af',
    fontFamily: 'Playfair_Regular',
    lineHeight: 20,
  },
});
