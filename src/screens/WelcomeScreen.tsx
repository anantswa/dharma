// src/screens/WelcomeScreen.tsx
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { usePreferencesStore } from '../store/preferencesStore';
import {
  FaithKey,
  PRIMARY_FAITHS,
  SECONDARY_FAITHS,
  getFaithTheme,
} from '../data/faiths';

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  // ✅ Avoid returning an object from Zustand selector (prevents getSnapshot infinite loop)
  const primaryTradition = usePreferencesStore((s) => s.primaryTradition);
  const savedRemindersEnabled = usePreferencesStore((s) => s.remindersEnabled);
  const setOnboarding = usePreferencesStore((s) => s.setOnboarding);

  const [tradition, setTradition] = useState<FaithKey>(
    (primaryTradition as FaithKey) ?? 'Hindu',
  );
  const [remindersEnabled, setRemindersEnabled] = useState(!!savedRemindersEnabled);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const theme = getFaithTheme(tradition);

  const onNext = () => {
    setOnboarding({
      primaryTradition: tradition,
      remindersEnabled,
    });
    navigation.replace('MainTabs');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#020617', 'rgba(2,6,23,0.85)', '#020617']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.accent }]}>Begin your Dharma journey</Text>
        <Text style={styles.subtitle}>Choose your path — the temple, calendar, and teachings shape around it.</Text>

        <Text style={[styles.sectionLabel, { color: theme.accent }]}>CHOOSE YOUR PATH</Text>

        {/* Primary faith cards */}
        {PRIMARY_FAITHS.map((key) => {
          const t = getFaithTheme(key);
          const selected = key === tradition;
          return (
            <TouchableOpacity
              key={key}
              activeOpacity={0.9}
              onPress={() => setTradition(key)}
              style={[
                styles.faithCard,
                selected && { borderColor: t.accent, backgroundColor: t.accentSoft },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.faithName, selected && { color: t.accent }]}>{t.label}</Text>
                <Text style={styles.faithBlurb}>{t.blurb}</Text>
              </View>
              <Text style={[styles.faithGreeting, selected && { color: t.accent }]}>{t.greeting}</Text>
            </TouchableOpacity>
          );
        })}

        {/* More traditions — only when there are any to surface */}
        {SECONDARY_FAITHS.length > 0 && (
        <TouchableOpacity onPress={() => setDropdownOpen(true)} activeOpacity={0.8}>
          <Text style={styles.moreLink}>
            {SECONDARY_FAITHS.includes(tradition) ? `More: ${tradition} ▾` : 'More traditions ▾'}
          </Text>
        </TouchableOpacity>
        )}

        <Modal
          visible={dropdownOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setDropdownOpen(false)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setDropdownOpen(false)}>
            <View style={styles.modalCard}>
              {SECONDARY_FAITHS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={styles.modalRow}
                  onPress={() => {
                    setTradition(t);
                    setDropdownOpen(false);
                  }}
                >
                  <Text style={[styles.modalRowText, t === tradition && styles.modalRowTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>

        {/* Reminders */}
        <View style={styles.reminderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.reminderTitle}>Daily reminder</Text>
            <Text style={styles.reminderSubtitle}>A gentle nudge to visit the temple.</Text>
          </View>
          <Switch value={remindersEnabled} onValueChange={setRemindersEnabled} />
        </View>

        {/* Next */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onNext}
          style={[styles.nextButton, { backgroundColor: theme.accent }]}
        >
          <Text style={styles.nextText}>Enter the temple</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  content: { flex: 1, paddingTop: 80, paddingHorizontal: 20, paddingBottom: 28 },
  title: { fontSize: 30, color: '#fbbf24', fontFamily: 'Playfair_Bold' },
  subtitle: { marginTop: 10, fontSize: 15, color: '#cbd5e1', opacity: 0.9 },

  sectionLabel: {
    marginTop: 26,
    fontSize: 12,
    letterSpacing: 1.5,
    color: '#fbbf24',
    fontFamily: 'Playfair_SemiBold',
  },

  dropdownButton: {
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(15,23,42,0.55)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: { color: '#f8fafc', fontSize: 16, fontFamily: 'System' },
  dropdownChevron: { color: '#94a3b8', fontSize: 18 },

  faithCard: {
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(15,23,42,0.55)',
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  faithName: { color: '#f8fafc', fontSize: 18, fontFamily: 'Playfair_SemiBold' },
  faithBlurb: { color: '#94a3b8', fontSize: 12.5, marginTop: 4, paddingRight: 10 },
  faithGreeting: { color: '#cbd5e1', fontSize: 12, fontStyle: 'italic', maxWidth: 96, textAlign: 'right' },
  moreLink: { color: '#94a3b8', fontSize: 13, marginTop: 14, alignSelf: 'flex-start' },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(15,23,42,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  modalRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  modalRowText: { color: '#e2e8f0', fontSize: 16 },
  modalRowTextActive: { color: '#fbbf24', fontWeight: '700' },

  reminderRow: {
    marginTop: 26,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(15,23,42,0.45)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reminderTitle: { color: '#f8fafc', fontSize: 16, fontWeight: '700' },
  reminderSubtitle: { marginTop: 4, color: '#94a3b8', fontSize: 13 },

  nextButton: {
    marginTop: 'auto',
    borderRadius: 18,
    backgroundColor: '#fbbf24',
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextText: { color: '#020617', fontSize: 16, fontWeight: '800' },
 
});
