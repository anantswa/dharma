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

// IMPORTANT: must match your store's TraditionKey exactly
const TRADITIONS = ['Sikh', 'Jain', 'Hindu', 'Buddhist', 'Zen'] as const;
type TraditionKey = (typeof TRADITIONS)[number];

 

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  // ✅ Avoid returning an object from Zustand selector (prevents getSnapshot infinite loop)
  const primaryTradition = usePreferencesStore((s) => s.primaryTradition);
  const savedRemindersEnabled = usePreferencesStore((s) => s.remindersEnabled);
  const setOnboarding = usePreferencesStore((s) => s.setOnboarding);

  const [tradition, setTradition] = useState<TraditionKey>(
    (primaryTradition as TraditionKey) ?? 'Sikh',
  );
  const [remindersEnabled, setRemindersEnabled] = useState(!!savedRemindersEnabled);

  const [dropdownOpen, setDropdownOpen] = useState(false);

  

  const onNext = () => {
    setOnboarding({
      primaryTradition: tradition,
      remindersEnabled,
    });

    // Go to main app (Tabs)
    navigation.replace('MainTabs');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#020617', 'rgba(2,6,23,0.85)', '#020617']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <Text style={styles.title}>Begin your Dharma journey</Text>
        <Text style={styles.subtitle}>Tailor your experience in a few taps.</Text>

        {/* Tradition dropdown */}
        <Text style={styles.sectionLabel}>CHOOSE YOUR PATH</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setDropdownOpen(true)}
          activeOpacity={0.9}
        >
          <Text style={styles.dropdownText}>{tradition}</Text>
          <Text style={styles.dropdownChevron}>▾</Text>
        </TouchableOpacity>

        <Modal
          visible={dropdownOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setDropdownOpen(false)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setDropdownOpen(false)}
          >
            <View style={styles.modalCard}>
              {TRADITIONS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={styles.modalRow}
                  onPress={() => {
                    setTradition(t);
                    setDropdownOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalRowText,
                      t === tradition && styles.modalRowTextActive,
                    ]}
                  >
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
            <Text style={styles.reminderTitle}>Reminders</Text>
            <Text style={styles.reminderSubtitle}>Get a gentle daily nudge.</Text>
          </View>
          <Switch value={remindersEnabled} onValueChange={setRemindersEnabled} />
        </View>

        {/* Next */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onNext}
          disabled={false}
          style={[styles.nextButton]}
        >
          <Text style={styles.nextText}>Next</Text>
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
