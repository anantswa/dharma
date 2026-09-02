/**
 * The Darshan sheet — the full darshan card's home after the IA reorg (§4).
 *
 * Opened from the Wisdom strip on Today; share stays two taps (strip → Share).
 * Reuses DailyDarshanCard verbatim — capture rig, Save/Share, the one-time
 * post-save bell Alert, and the `darshan_card_view/save/share` events all fire
 * exactly as before (the card mounts each time the sheet opens).
 *
 * Adds the persistent quiet bell row under the card: a standing door to the
 * morning ārati bell, visible on every open until opted in. Canon-safe — it
 * never modals, never nags.
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFaithTheme } from '../data/faiths';
import { enableAratiBell } from '../services/notificationService';
import { track } from '../services/analytics';
import { usePreferencesStore } from '../store/preferencesStore';
import { DailyDarshanCard } from './DailyDarshanCard';

type Props = { visible: boolean; onClose: () => void };

export const DarshanSheet: React.FC<Props> = ({ visible, onClose }) => {
  const primary = usePreferencesStore((s) => s.primaryTradition);
  const remindersEnabled = usePreferencesStore((s) => s.remindersEnabled);
  const reminderTime = usePreferencesStore((s) => s.reminderTime);
  const theme = getFaithTheme(primary);
  const insets = useSafeAreaInsets();
  const [ringing, setRinging] = useState(false);

  const ringBell = async () => {
    if (ringing) return;
    setRinging(true);
    const time = reminderTime || '07:00';
    const ok = await enableAratiBell(time, primary);
    if (ok) track('bell_optin', { hour: parseInt(time.split(':')[0], 10), from: 'sheet_row' });
    setRinging(false);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <LinearGradient colors={['#020617', '#0b1220', '#020617']} style={StyleSheet.absoluteFill} />
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 30 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <Text style={[styles.kicker, { color: theme.accent }]}>TODAY’S DARSHAN</Text>
            <Pressable
              onPress={onClose}
              hitSlop={14}
              accessibilityRole="button"
              accessibilityLabel="Close darshan card"
            >
              <Ionicons name="close" size={26} color="#e2e8f0" />
            </Pressable>
          </View>

          <DailyDarshanCard />

          {/* the standing door — quiet, visible until the bell is ringing */}
          {!remindersEnabled && (
            <Pressable
              style={({ pressed }) => [styles.bellRow, pressed && { opacity: 0.85 }]}
              onPress={ringBell}
              disabled={ringing}
              accessibilityRole="button"
              accessibilityLabel="Receive this as the morning ārati bell"
            >
              <Text style={styles.bellEmoji}>🔔</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.bellTitle}>Receive this as the morning ārati bell</Text>
                <Text style={styles.bellSub}>A gentle notification at 7:00 am — change the time any time in You</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#64748b" />
            </Pressable>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  scroll: { paddingHorizontal: 18 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, minHeight: 48 },
  kicker: { fontSize: 12, letterSpacing: 2, fontWeight: '800' },
  bellRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: 'rgba(148,163,184,0.16)',
    backgroundColor: 'rgba(15,23,42,0.5)', borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 13, minHeight: 48,
  },
  bellEmoji: { fontSize: 20 },
  bellTitle: { color: '#f1f5f9', fontSize: 14.5, fontFamily: 'Playfair_Bold' },
  bellSub: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
});
