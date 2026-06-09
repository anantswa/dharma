import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getFaithTheme } from '../data/faiths';
import { ACHIEVEMENTS, useAchievementsStore } from '../store/achievementsStore';
import { usePreferencesStore } from '../store/preferencesStore';

/** The Siddhis gallery — milestones earned on the path, shown as a gentle honor roll. */
export const AchievementsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const theme = getFaithTheme(usePreferencesStore.getState().primaryTradition);
  const unlocked = useAchievementsStore((s) => s.unlocked);
  const [, force] = useState(0);

  // Re-derive on focus so newly-crossed thresholds appear immediately.
  useFocusEffect(useCallback(() => {
    useAchievementsStore.getState().load().then(() => {
      useAchievementsStore.getState().evaluate();
      force((n) => n + 1);
    });
  }, []));

  const earned = ACHIEVEMENTS.filter((a) => unlocked[a.id]).length;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#020617', '#0b1220', '#020617']} style={StyleSheet.absoluteFill} />
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={16}>
          <Ionicons name="chevron-back" size={26} color="#e2e8f0" />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.kicker, { color: theme.accent }]}>YOUR PATH</Text>
        <Text style={styles.title}>Siddhis</Text>
        <Text style={styles.sub}>Milestones on the path — each earned once, and kept.</Text>

        <View style={[styles.countCard, { borderColor: theme.accentSoft }]}>
          <Text style={[styles.countNum, { color: theme.accent }]}>{earned}</Text>
          <Text style={styles.countLbl}>of {ACHIEVEMENTS.length} attained</Text>
        </View>

        <View style={styles.grid}>
          {ACHIEVEMENTS.map((a) => {
            const got = !!unlocked[a.id];
            return (
              <View
                key={a.id}
                style={[
                  styles.tile,
                  got ? { borderColor: theme.accent, backgroundColor: theme.accentSoft } : styles.tileLocked,
                ]}
              >
                <Text style={[styles.tileIcon, !got && styles.lockedIcon]}>{got ? a.icon : '🔒'}</Text>
                <Text style={[styles.tileTitle, got && { color: '#f8fafc' }]} numberOfLines={2}>{a.title}</Text>
                <Text style={styles.tileDesc} numberOfLines={3}>{a.desc}</Text>
                {got && <Text style={[styles.tileDate, { color: theme.accent }]}>attained {unlocked[a.id]}</Text>}
              </View>
            );
          })}
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  topBar: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 4 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  kicker: { fontSize: 12, letterSpacing: 3, fontWeight: '800' },
  title: { fontSize: 30, color: '#f8fafc', fontFamily: 'Playfair_Bold', marginTop: 4 },
  sub: { fontSize: 13.5, color: '#94a3b8', marginTop: 6, marginBottom: 18 },
  countCard: { borderWidth: 1, borderRadius: 18, padding: 18, backgroundColor: 'rgba(15,23,42,0.5)', marginBottom: 20, alignItems: 'center' },
  countNum: { fontSize: 40, fontFamily: 'Playfair_Bold' },
  countLbl: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tile: { width: '48%', borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 12, minHeight: 132 },
  tileLocked: { borderColor: 'rgba(148,163,184,0.12)', backgroundColor: 'rgba(15,23,42,0.4)' },
  tileIcon: { fontSize: 30, marginBottom: 8 },
  lockedIcon: { opacity: 0.5 },
  tileTitle: { color: '#94a3b8', fontSize: 15, fontFamily: 'Playfair_Bold' },
  tileDesc: { color: '#94a3b8', fontSize: 12, lineHeight: 17, marginTop: 4 },
  tileDate: { fontSize: 10.5, fontWeight: '700', marginTop: 8, letterSpacing: 0.5 },
});
