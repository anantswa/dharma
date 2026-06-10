import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SAHARA_NEEDS } from '../data/sahara';
import { getFaithTheme } from '../data/faiths';
import { usePreferencesStore } from '../store/preferencesStore';
import { track } from '../services/analytics';

/**
 * Sahāra — the doorway for the moment of need. "What brings you today?"
 * Six gentle cards; each opens the tradition's own answer (deity + mantra +
 * breath + verses). Deliberately spare — this screen should feel like being
 * received, not like a menu.
 */
export const SaharaScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const theme = getFaithTheme(usePreferencesStore.getState().primaryTradition);

  useEffect(() => { track('sahara_open'); }, []);

  const open = (id: string) => {
    try { Haptics.selectionAsync(); } catch { /* noop */ }
    track('sahara_need', { need: id });
    navigation.navigate('SaharaDetail', { needId: id });
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#020617', '#0b1220', '#020617']} style={StyleSheet.absoluteFill} />
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={16}>
          <Ionicons name="chevron-back" size={26} color="#e2e8f0" />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.kicker, { color: theme.accent }]}>SAHĀRA · सहारा</Text>
        <Text style={styles.title}>What brings you{'\n'}today?</Text>
        <Text style={styles.sub}>Whatever it is, the tradition has met it before — and kept an answer for you.</Text>

        <View style={styles.grid}>
          {SAHARA_NEEDS.map((n, i) => (
            <Animated.View key={n.id} entering={FadeInDown.delay(80 * i).duration(450)} style={styles.cell}>
              <Pressable
                style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.97 }] }]}
                onPress={() => open(n.id)}
              >
                <Text style={styles.emoji}>{n.emoji}</Text>
                <Text style={styles.label}>{n.label}</Text>
                <Text style={[styles.labelHi, { color: theme.accent }]}>{n.labelHi}</Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  topBar: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 4 },
  scroll: { paddingHorizontal: 22, paddingBottom: 40 },
  kicker: { fontSize: 12, letterSpacing: 3, fontWeight: '800' },
  title: { fontSize: 34, color: '#f8fafc', fontFamily: 'Playfair_Bold', marginTop: 6, lineHeight: 42 },
  sub: { fontSize: 14, color: '#94a3b8', marginTop: 10, lineHeight: 21, marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cell: { width: '48%', marginBottom: 14 },
  card: {
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.16)',
    backgroundColor: 'rgba(15,23,42,0.55)',
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    minHeight: 128,
    justifyContent: 'center',
  },
  emoji: { fontSize: 30, marginBottom: 10 },
  label: { color: '#f1f5f9', fontSize: 15, fontFamily: 'Playfair_Bold', textAlign: 'center' },
  labelHi: { fontSize: 12.5, marginTop: 4, textAlign: 'center' },
});
