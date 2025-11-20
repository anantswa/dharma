import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { usePreferencesStore, TraditionKey } from '../store/preferencesStore';

const TRADITIONS: TraditionKey[] = ['Hindu', 'Sikh', 'Buddhist', 'Jain', 'Zen'];

export const SettingsScreen: React.FC = () => {
  const enabledTraditions = usePreferencesStore((s) => s.enabledTraditions);
  // Fixed: Now pulling the correct function name from the store
  const toggleTradition = usePreferencesStore((s) => s.toggleTradition);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>
        Notifications, themes, and personal practice preferences.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Traditions to Surface</Text>
        <Text style={styles.cardDescription}>
          Choose which lineages you’d like to see in your Home and Library.
        </Text>

        <View style={styles.separator} />

        {TRADITIONS.map((trad) => (
          <View key={trad} style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>{trad}</Text>
              <Text style={styles.rowSubtitle}>Included in daily feed</Text>
            </View>

            <Switch
              value={enabledTraditions[trad]}
              onValueChange={() => toggleTradition(trad)}
              trackColor={{ false: '#334155', true: '#f59e0b' }} // Saffron-ish active color
              thumbColor={enabledTraditions[trad] ? '#fffbeb' : '#9ca3af'}
            />
          </View>
        ))}
      </View>

      <Text style={styles.footerNote}>v0.1 — More settings coming soon.</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 60, // Adjusted for safe area
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    color: '#fbbf24',
    fontFamily: 'Playfair_Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#e5e7eb',
    fontFamily: 'System',
    marginBottom: 32,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.5)', // Semi-transparent card
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardLabel: {
    fontSize: 12,
    color: '#fbbf24',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontFamily: 'Playfair_SemiBold',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: '#cbd5e1',
    fontFamily: 'System',
    marginBottom: 16,
    lineHeight: 20,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
  },
  row: {
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowTitle: {
    fontSize: 17,
    color: '#f9fafb',
    fontFamily: 'System',
    fontWeight: '500',
  },
  rowSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  footerNote: {
    marginTop: 32,
    textAlign: 'center',
    fontSize: 12,
    color: '#64748b',
  },
});