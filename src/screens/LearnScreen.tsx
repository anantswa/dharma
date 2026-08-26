import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { COURSE_LIST } from '../data/courses';
import { masteredCount, useMasteryStore } from '../store/masteryStore';
import { getCourse } from '../data/courses';
import { getFaithTheme } from '../data/faiths';
import { usePreferencesStore } from '../store/preferencesStore';

type Props = { navigation: any };

/**
 * Learn = the "Learn by heart" course catalog, grouped by faith.
 * (The legacy Sacred Texts / Explorations / Daily Practice module system was removed —
 * the mastery courses supersede it.)
 */
export const LearnScreen: React.FC<Props> = ({ navigation }) => {
  const records = useMasteryStore((s) => s.records);
  useFocusEffect(useCallback(() => { useMasteryStore.getState().load(); }, []));

  // your own tradition leads; canonical accents from the faith system
  const primary = usePreferencesStore((s) => s.primaryTradition);
  const groupsAll = [
    { faith: 'Hindu', accent: getFaithTheme('Hindu').accent, courses: COURSE_LIST.filter((c) => c.faith === 'Hindu') },
    { faith: 'Buddhist', accent: getFaithTheme('Buddhist').accent, courses: COURSE_LIST.filter((c) => c.faith === 'Buddhist') },
  ];
  const groups = primary === 'Buddhist' ? [...groupsAll].reverse() : groupsAll;

  const Card = ({ c, accent }: { c: typeof COURSE_LIST[number]; accent: string }) => {
    const course = getCourse(c.id);
    const mastered = masteredCount(course.verses.map((v) => v.id), records as any);
    const art = course.verses[0]?.artUrl;
    return (
      <Pressable style={styles.card} onPress={() => navigation.navigate('ChalisaPath', { courseId: c.id })}>
        <LinearGradient
          colors={[`${accent}22`, `${accent}07`]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.cardGrad}
        >
          {art ? (
            <ExpoImage source={{ uri: art }} style={styles.artThumb} contentFit="cover" cachePolicy="memory-disk" />
          ) : (
            <View style={[styles.icon, { backgroundColor: `${accent}22` }]}>
              <Ionicons name="sparkles" size={24} color={accent} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{c.title}</Text>
            <Text style={styles.cardSub} numberOfLines={1}>{c.subtitle}</Text>
            <Text style={styles.cardMeta}>
              {mastered > 0 ? `${mastered}/${c.count} by heart` : `${c.count} verses`}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#475569" />
        </LinearGradient>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#020617', '#0b1220', '#020617']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* stack screen now (was a tab) — needs its own way back */}
        <Pressable onPress={() => navigation.goBack()} hitSlop={16} style={{ marginBottom: 6 }}>
          <Ionicons name="chevron-back" size={26} color="#e2e8f0" />
        </Pressable>
        <Text style={styles.title}>Learn</Text>
        <Text style={styles.headerSub}>Learn the scriptures by heart — one verse a day.</Text>

        <Pressable style={styles.card} onPress={() => navigation.navigate('JyotishHome')}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Path of the Sky · ज्योतिष  <Text style={{ color: '#fbbf24', fontSize: 11 }}>NEW</Text></Text>
            <Text style={styles.cardSub}>Vedic astrology from first principles — houses, grahas, daśās, as a game</Text>
          </View>
        </Pressable>
        {groups.map((g) => g.courses.length > 0 && (
          <View key={g.faith}>
            <Text style={[styles.section, { color: g.accent }]}>{g.faith.toUpperCase()}</Text>
            {g.courses.map((c) => <Card key={c.id} c={c} accent={g.accent} />)}
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  scroll: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 110 },
  title: { fontSize: 32, fontFamily: 'Playfair_Bold', color: '#f8fafc' },
  headerSub: { fontSize: 14, color: '#94a3b8', marginTop: 4, marginBottom: 8 },
  section: { fontSize: 12, letterSpacing: 1.5, fontWeight: '800', marginTop: 22, marginBottom: 12 },
  card: { borderRadius: 18, overflow: 'hidden', marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  cardGrad: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  icon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  artThumb: { width: 50, height: 50, borderRadius: 14, backgroundColor: 'rgba(15,23,42,0.6)' },
  cardTitle: { fontSize: 17, fontFamily: 'Playfair_Bold', color: '#f1f5f9' },
  cardSub: { fontSize: 12.5, color: '#94a3b8', marginTop: 2 },
  cardMeta: { fontSize: 12, color: '#64748b', marginTop: 6 },
});
