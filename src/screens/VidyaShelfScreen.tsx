import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFaithTheme } from '../data/faiths';
import { bilingualName, buildShelves, deityName, isLearned, lessonArt, VidyaShelfRow } from '../data/vidya/shelves';
import type { MantraLesson } from '../data/vidya/types';
import { track } from '../services/analytics';
import { LEVEL_LABEL, levelForBox, useMasteryStore } from '../store/masteryStore';
import { usePreferencesStore } from '../store/preferencesStore';
import { useVidyaStore } from '../store/vidyaStore';

const CLASS_LABEL: Record<MantraLesson['class'], string> = {
  bija: 'seed syllable', mula: 'root mantra', vedic: 'Vedic', opener: 'opening verse', buddhist: 'Buddhist', nama: 'name-japa',
};

/**
 * Mantra Vidyā — the shelf (§2). Rendered from the loaded catalog: Start Here,
 * the bīja shelf as marquee (a map of connections — seed → who it calls),
 * Your Deity ordered by iṣṭa, then the rest; empty shelves simply do not
 * appear. A quiet "words you know" ring in the header — a count, not a goad.
 */
export const VidyaShelfScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const primary = usePreferencesStore((s) => s.primaryTradition);
  const ista = usePreferencesStore((s) => s.ista);
  const enabled = usePreferencesStore((s) => s.enabledTraditions);
  const lessons = useVidyaStore((s) => s.lessons);
  const records = useMasteryStore((s) => s.records);
  const theme = getFaithTheme(primary);

  useEffect(() => { track('vidya_shelf_open'); }, []);
  useFocusEffect(useCallback(() => {
    useMasteryStore.getState().load();
    useVidyaStore.getState().load();
  }, []));

  const shelves = useMemo(() => buildShelves(lessons, primary, ista, enabled), [lessons, primary, ista, enabled]);

  // words you know: every word on a card that is at least "Familiar" (box ≥ 2)
  const { known, total, learned } = useMemo(() => {
    let known = 0, total = 0, learned = 0;
    for (const l of lessons) {
      total += l.words.length;
      if ((records[l.id]?.box ?? -1) >= 2) known += l.words.length;
      if (isLearned(records[l.id])) learned += 1;
    }
    return { known, total, learned };
  }, [lessons, records]);

  const open = (l: MantraLesson) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch { /* noop */ }
    navigation.navigate('VidyaLesson', { id: l.id, from: 'shelf' });
  };

  const renderRow = (l: MantraLesson, accent: string) => {
    const art = lessonArt(l);
    const level = levelForBox(records[l.id]?.box);
    const done = isLearned(records[l.id]);
    return (
      <Pressable key={l.id} style={styles.card} onPress={() => open(l)}>
        <LinearGradient colors={[`${accent}1c`, `${accent}06`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardGrad}>
          {art ? (
            <ExpoImage source={art} style={styles.thumb} contentFit="cover" contentPosition={{ top: '10%' }} cachePolicy="memory-disk" />
          ) : (
            <View style={[styles.thumb, styles.thumbFallback]}><Text style={styles.thumbDeva}>{l.sanskrit.slice(0, 2)}</Text></View>
          )}
          {done && (
            <View style={[styles.doneBadge, { backgroundColor: accent }]} accessibilityLabel="Learned">
              <Ionicons name="checkmark" size={13} color="#0b1220" />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{bilingualName(l)}</Text>
            <Text style={styles.cardBang} numberOfLines={2}>{l.titleEn}</Text>
            <Text style={styles.cardMeta}>
              {CLASS_LABEL[l.class] ?? l.class}
              {level !== 'new' ? `  ·  ${LEVEL_LABEL[level]}` : ''}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#475569" />
        </LinearGradient>
      </Pressable>
    );
  };

  /** The bīja shelf: a map of connections — the seed, large, and who it calls. */
  const renderMarquee = (shelf: VidyaShelfRow, accent: string) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.marqueeRow}>
      {shelf.lessons.map((l) => {
        const who = deityName(l.deityId);
        const level = levelForBox(records[l.id]?.box);
        const done = isLearned(records[l.id]);
        return (
          <Pressable key={l.id} style={[styles.seedTile, { borderColor: done ? accent : `${accent}55` }]} onPress={() => open(l)}>
            <LinearGradient colors={['#1a1640', '#0b1220']} style={StyleSheet.absoluteFill} />
            {done && (
              <View style={[styles.seedDone, { backgroundColor: accent }]} accessibilityLabel="Learned">
                <Ionicons name="checkmark" size={12} color="#0b1220" />
              </View>
            )}
            <Text style={[styles.seedDeva, { color: accent }]}>{l.sanskrit}</Text>
            <Text style={styles.seedIast}>{l.transliteration}</Text>
            <View style={styles.seedArrowRow}>
              <Ionicons name="arrow-forward" size={13} color="#94a3b8" />
              <Text style={styles.seedWho} numberOfLines={1}>{who ?? l.titleHi}</Text>
            </View>
            {level !== 'new' && !done && <Text style={[styles.seedLevel, { color: accent }]}>{LEVEL_LABEL[level]}</Text>}
          </Pressable>
        );
      })}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#020617', '#0b1220', '#020617']} style={StyleSheet.absoluteFill} />
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={16} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={26} color="#e2e8f0" />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.kicker, { color: theme.accent }]}>MANTRA VIDYĀ</Text>
            <Text style={styles.title}>Learn the mantras</Text>
            <Text style={styles.sub}>The words you already say — and what they mean.</Text>
            <Text style={[styles.progress, { color: theme.accent }]}>
              {learned === 0 ? 'Pass a card’s test and it gets its mark here.' : `${learned} of ${lessons.length} learned`}
            </Text>
          </View>
          {/* words-you-know ring — a count, quietly; word-level SRS is v2 */}
          <View style={[styles.ring, { borderColor: `${theme.accent}66` }]}>
            <Text style={styles.ringNum}>{known}</Text>
            <Text style={styles.ringOf}>/ {total}</Text>
            <Text style={styles.ringLbl}>words</Text>
          </View>
        </View>

        {shelves.map((s) => {
          const accent = s.key === 'buddhist' || s.key === 'buddhist_practice' ? getFaithTheme('Buddhist').accent : getFaithTheme('Hindu').accent;
          return (
            <View key={s.key}>
              <Text style={[styles.section, { color: accent }]}>{s.title.toUpperCase()}</Text>
              <Text style={styles.sectionSub}>{s.subtitle}</Text>
              {s.marquee ? renderMarquee(s, accent) : s.lessons.map((l) => renderRow(l, accent))}
            </View>
          );
        })}

        {shelves.length === 0 && (
          <Text style={styles.empty}>No lessons here yet — the shelf fills as Batch 1 lands.</Text>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  topBar: { paddingHorizontal: 16, paddingBottom: 4 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 6 },
  kicker: { fontSize: 12, letterSpacing: 3, fontWeight: '800' },
  title: { fontSize: 30, color: '#f8fafc', fontFamily: 'Playfair_Bold', marginTop: 4 },
  sub: { fontSize: 13.5, color: '#94a3b8', marginTop: 6, lineHeight: 19 },
  progress: { fontSize: 12, fontWeight: '700', marginTop: 8, letterSpacing: 0.3 },
  doneBadge: { position: 'absolute', left: 52, top: 10, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#0b1220' },
  seedDone: { position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  ring: { width: 74, height: 74, borderRadius: 37, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15,23,42,0.6)' },
  ringNum: { color: '#f8fafc', fontSize: 18, fontWeight: '800', lineHeight: 20 },
  ringOf: { color: '#94a3b8', fontSize: 10.5, fontWeight: '700' },
  ringLbl: { color: '#64748b', fontSize: 9.5, letterSpacing: 0.5, marginTop: 1 },
  section: { fontSize: 12, letterSpacing: 1.5, fontWeight: '800', marginTop: 24 },
  sectionSub: { color: '#64748b', fontSize: 12.5, fontStyle: 'italic', marginTop: 2, marginBottom: 12 },
  card: { borderRadius: 18, overflow: 'hidden', marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  cardGrad: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 },
  thumb: { width: 54, height: 54, borderRadius: 14, backgroundColor: 'rgba(15,23,42,0.6)' },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  thumbDeva: { color: '#f8fafc', fontSize: 22, fontFamily: 'Playfair_Medium' },
  cardTitle: { fontSize: 17, fontFamily: 'Playfair_Bold', color: '#f1f5f9' },
  cardBang: { fontSize: 13, color: '#cbd5e1', marginTop: 3, lineHeight: 18 },
  cardMeta: { fontSize: 11.5, color: '#64748b', marginTop: 5 },
  marqueeRow: { gap: 10, paddingRight: 8 },
  seedTile: { width: 138, height: 150, borderRadius: 20, borderWidth: 1, overflow: 'hidden', padding: 14, justifyContent: 'flex-end' },
  seedDeva: { fontSize: 42, fontFamily: 'Playfair_Bold', lineHeight: 56 },
  seedIast: { color: '#cbd5e1', fontSize: 13, fontStyle: 'italic' },
  seedArrowRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  seedWho: { flex: 1, color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  seedLevel: { position: 'absolute', top: 10, right: 12, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  empty: { color: '#64748b', fontSize: 14, fontStyle: 'italic', marginTop: 30, textAlign: 'center' },
});
