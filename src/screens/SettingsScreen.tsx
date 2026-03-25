import React, { useEffect, useState } from 'react';
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import {
    cancelDailyWisdomNotification,
    initializeNotifications,
    scheduleDailyWisdomNotification,
} from '../services/notificationService';
import { TraditionKey, usePreferencesStore } from '../store/preferencesStore';

const TRADITIONS: TraditionKey[] = ['Hindu', 'Sikh', 'Buddhist', 'Jain', 'Zen'];

 

// Generate hours (0-23) and minutes (0-59)
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export const SettingsScreen: React.FC = () => {
  const enabledTraditions = usePreferencesStore((s) => s.enabledTraditions);
  const toggleTradition = usePreferencesStore((s) => s.toggleTradition);
  
  const primaryTradition = usePreferencesStore((s) => s.primaryTradition);
  const remindersEnabled = usePreferencesStore((s) => s.remindersEnabled);
  const reminderTime = usePreferencesStore((s) => s.reminderTime);
  const setOnboarding = usePreferencesStore((s) => s.setOnboarding);
  const setReminderTime = usePreferencesStore((s) => s.setReminderTime);
  const toggleReminders = usePreferencesStore((s) => s.toggleReminders);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [selectedTradition, setSelectedTradition] = useState<TraditionKey>(
    primaryTradition ?? 'Sikh'
  );
  const [reminderToggle, setReminderToggle] = useState(!!remindersEnabled);
  const [selectedTime, setSelectedTime] = useState(reminderTime || '07:00');
  
  const [tempHour, setTempHour] = useState(parseInt(selectedTime.split(':')[0]));
  const [tempMinute, setTempMinute] = useState(parseInt(selectedTime.split(':')[1]));

  // Initialize notifications when settings change
  useEffect(() => {
    initializeNotifications(reminderToggle, selectedTime, selectedTradition);
  }, [reminderToggle, selectedTime, selectedTradition]);

  

  const handleTraditionChange = (trad: TraditionKey) => {
    setSelectedTradition(trad);
    setDropdownOpen(false);
    
    // Save to store
    setOnboarding({
      primaryTradition: trad,
      remindersEnabled: reminderToggle,
    });
  };

  const handleReminderToggle = async (value: boolean) => {
    setReminderToggle(value);
    toggleReminders(value);
    
    // Save to store
    setOnboarding({
      primaryTradition: selectedTradition,
      remindersEnabled: value,
    });

    // Update notifications
    if (value) {
      await scheduleDailyWisdomNotification(selectedTime, selectedTradition);
    } else {
      await cancelDailyWisdomNotification();
    }
  };

  const handleTimeConfirm = () => {
    const formattedTime = `${tempHour.toString().padStart(2, '0')}:${tempMinute.toString().padStart(2, '0')}`;
    setSelectedTime(formattedTime);
    setReminderTime(formattedTime);
    setTimePickerOpen(false);
    
    // Reschedule notification if enabled
    if (reminderToggle) {
      scheduleDailyWisdomNotification(formattedTime, selectedTradition);
    }
  };

  const openTimePicker = () => {
    const [hours, minutes] = selectedTime.split(':').map(Number);
    setTempHour(hours);
    setTempMinute(minutes);
    setTimePickerOpen(true);
  };

  const formatTime12Hour = (time24: string) => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>
        Notifications, themes, and personal practice preferences.
      </Text>

      {/* Onboarding Preferences */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Your Journey</Text>
        <Text style={styles.cardDescription}>
          Customize your primary tradition.
        </Text>

        <View style={styles.separator} />

        {/* Primary Tradition */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Primary Tradition</Text>
            <Text style={styles.rowSubtitle}>Your main spiritual path</Text>
          </View>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setDropdownOpen(true)}
            activeOpacity={0.9}
          >
            <Text style={styles.dropdownText}>{selectedTradition}</Text>
            <Text style={styles.dropdownChevron}>▾</Text>
          </TouchableOpacity>
        </View>

        

        {/* Reminders */}
        <View style={[styles.row, { marginTop: 16 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Reminders</Text>
            <Text style={styles.rowSubtitle}>Get a gentle daily nudge</Text>
          </View>
          <Switch
            value={reminderToggle}
            onValueChange={handleReminderToggle}
            trackColor={{ false: '#334155', true: '#f59e0b' }}
            thumbColor={reminderToggle ? '#fffbeb' : '#9ca3af'}
          />
        </View>

        {/* Reminder Time - only show if reminders are enabled */}
        {reminderToggle && (
          <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Reminder Time</Text>
                <Text style={styles.rowSubtitle}>When to receive daily wisdom</Text>
              </View>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={openTimePicker}
                activeOpacity={0.9}
              >
                <Text style={styles.timeButtonText}>{formatTime12Hour(selectedTime)}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Modal for Tradition Selection */}
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
                onPress={() => handleTraditionChange(t)}
              >
                <Text
                  style={[
                    styles.modalRowText,
                    t === selectedTradition && styles.modalRowTextActive,
                  ]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Time Picker Modal */}
      <Modal
        visible={timePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setTimePickerOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setTimePickerOpen(false)}
        >
          <View style={styles.timePickerCard}>
            <Text style={styles.timePickerTitle}>Select Time</Text>
            
            <View style={styles.timePickerContainer}>
              {/* Hours Picker */}
              <View style={styles.timeColumn}>
                <Text style={styles.timeColumnLabel}>Hour</Text>
                <ScrollView style={styles.timeScrollView} showsVerticalScrollIndicator={false}>
                  {HOURS.map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.timeOption,
                        tempHour === hour && styles.timeOptionActive,
                      ]}
                      onPress={() => setTempHour(hour)}
                    >
                      <Text
                        style={[
                          styles.timeOptionText,
                          tempHour === hour && styles.timeOptionTextActive,
                        ]}
                      >
                        {hour.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Text style={styles.timeSeparator}>:</Text>

              {/* Minutes Picker */}
              <View style={styles.timeColumn}>
                <Text style={styles.timeColumnLabel}>Minute</Text>
                <ScrollView style={styles.timeScrollView} showsVerticalScrollIndicator={false}>
                  {MINUTES.map((minute) => (
                    <TouchableOpacity
                      key={minute}
                      style={[
                        styles.timeOption,
                        tempMinute === minute && styles.timeOptionActive,
                      ]}
                      onPress={() => setTempMinute(minute)}
                    >
                      <Text
                        style={[
                          styles.timeOptionText,
                          tempMinute === minute && styles.timeOptionTextActive,
                        ]}
                      >
                        {minute.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Confirm Button */}
            <TouchableOpacity
              style={styles.confirmTimeButton}
              onPress={handleTimeConfirm}
              activeOpacity={0.9}
            >
              <Text style={styles.confirmTimeText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Traditions Filter */}
      <View style={[styles.card, { marginTop: 16 }]}>
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

      <Text style={styles.footerNote}>v1.0.0 — Dharma by DharmaWeave</Text>
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
  // Dropdown styles
  dropdownButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(15,23,42,0.55)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 120,
  },
  dropdownText: { color: '#f8fafc', fontSize: 15, fontFamily: 'System' },
  dropdownChevron: { color: '#94a3b8', fontSize: 16 },
  // Time button styles
  timeButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.4)',
    backgroundColor: 'rgba(251,191,36,0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  timeButtonText: { 
    color: '#fbbf24', 
    fontSize: 15, 
    fontFamily: 'System',
    fontWeight: '600',
  },
  // Modal styles
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
  
  // Time picker styles
  timePickerCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(15,23,42,0.98)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 20,
    maxHeight: 500,
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fbbf24',
    textAlign: 'center',
    marginBottom: 20,
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  timeColumn: {
    flex: 1,
    alignItems: 'center',
  },
  timeColumnLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timeScrollView: {
    maxHeight: 250,
    width: '100%',
  },
  timeOption: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 2,
    backgroundColor: 'rgba(15,23,42,0.45)',
  },
  timeOptionActive: {
    backgroundColor: 'rgba(251,191,36,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.6)',
  },
  timeOptionText: {
    fontSize: 16,
    color: '#e2e8f0',
    textAlign: 'center',
  },
  timeOptionTextActive: {
    color: '#fbbf24',
    fontWeight: '700',
  },
  timeSeparator: {
    fontSize: 32,
    color: '#fbbf24',
    fontWeight: '700',
    marginTop: 30,
  },
  confirmTimeButton: {
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: '#fbbf24',
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmTimeText: {
    color: '#020617',
    fontSize: 16,
    fontWeight: '800',
  },
});