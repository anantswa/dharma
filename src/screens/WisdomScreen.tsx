import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, ImageBackground, Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePreferencesStore, isTraditionEnabled } from '../store/preferencesStore';
import wisdomDataRaw from '../data/wisdom_core_50.json';

type WisdomItem = {
  id: string;
  tradition: string;
  lineage?: string;
  original_transliteration: string;
  translation_en: string;
  source: string;
  theme: string;
  is_core: boolean;
};

const TRADITIONS = ['All', 'Hindu', 'Sikh', 'Buddhist', 'Jain', 'Zen'] as const;
const { width } = Dimensions.get('window');

// --- THE NEW IMAGE LOGIC ---
const getBackgroundForTradition = (tradition: string) => {
  const t = tradition.toLowerCase();

  // 1. Check COMMUNITY folder (Specific identities)
  if (t.includes('sikh')) return require('../../assets/images/community/community_sikh.jpg');
  if (t.includes('jain')) return require('../../assets/images/community/community_jain.jpg');
  if (t.includes('gujarati')) return require('../../assets/images/community/community_gujarati.jpg');
  if (t.includes('himachal')) return require('../../assets/images/community/community_himachal.jpg');

  // 2. Check QUOTES folder (Thematic matches)
  // Assuming you might add specific quote backgrounds later, we use your existing one for now
  if (t.includes('zen') || t.includes('buddh')) {
     return require('../../assets/images/quotes/quotes_bg_01.jpg'); 
  }

  // 3. Default to SPLASH folder (The "Base" screens)
  // We can rotate these or pick a specific one for Hindu/General
  return require('../../assets/images/splash/splash_01.jpg'); 
};

export const WisdomScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const enabledTraditions = usePreferencesStore((s) => s.enabledTraditions);
  const [activeFilter, setActiveFilter] = useState<(typeof TRADITIONS)[number]>('All');
  const wisdomData = wisdomDataRaw as WisdomItem[];

  const filteredData = useMemo(() => {
    let base = wisdomData.filter((item) => isTraditionEnabled(item.tradition));
    if (activeFilter === 'All') return base;
    return base.filter((item) =>
      item.tradition.toLowerCase().includes(activeFilter.toLowerCase()),
    );
  }, [wisdomData, activeFilter, enabledTraditions]);

  const renderChip = (label: (typeof TRADITIONS)[number]) => {
    const isActive = activeFilter === label;
    return (
      <TouchableOpacity
        key={label}
        onPress={() => setActiveFilter(label)}
        style={[styles.chip, isActive && styles.chipActive]}
      >
        <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: WisdomItem }) => {
    const bgSource = getBackgroundForTradition(item.tradition);

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate('WisdomDetail', { wisdom: item })}
        style={styles.cardWrapper}
      >
        <ImageBackground source={bgSource} style={styles.cardBg} resizeMode="cover">
          <View style={styles.cardOverlay} />
          <View style={styles.cardInner}>
            <Text style={styles.traditionLabel}>
              {item.tradition.toUpperCase()}
              {item.lineage ? ` • ${item.lineage.toUpperCase()}` : ''}
            </Text>
            {item.original_transliteration ? (
              <Text style={styles.originalText} numberOfLines={2}>{item.original_transliteration}</Text>
            ) : null}
            <Text style={styles.translationText} numberOfLines={3}>{item.translation_en}</Text>
            <Text style={styles.sourceText}>— {item.source}</Text>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wisdom Library</Text>
      <Text style={styles.subtitle}>Browse timeless teachings.</Text>
      <View style={{ height: 50 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {TRADITIONS.map(renderChip)}
        </ScrollView>
      </View>
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617', paddingTop: 60 },
  title: { fontSize: 28, color: '#fbbf24', fontFamily: 'Playfair_Bold', marginBottom: 4, paddingHorizontal: 20 },
  subtitle: { fontSize: 15, color: '#94a3b8', fontFamily: 'System', marginBottom: 16, paddingHorizontal: 20 },
  chipRow: { paddingHorizontal: 20, alignItems: 'center' },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.4)', marginRight: 8, backgroundColor: 'rgba(15, 23, 42, 0.8)' },
  chipActive: { backgroundColor: 'rgba(251, 191, 36, 0.15)', borderColor: '#fbbf24' },
  chipText: { fontSize: 14, color: '#cbd5e1' },
  chipTextActive: { color: '#fbbf24', fontWeight: '600' },
  listContent: { paddingTop: 10, paddingBottom: 100, paddingHorizontal: 20 },
  cardWrapper: { marginBottom: 20, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  cardBg: { width: '100%' },
  cardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2, 6, 23, 0.7)' },
  cardInner: { padding: 24 },
  traditionLabel: { fontSize: 12, color: '#fbbf24', letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Playfair_SemiBold', marginBottom: 12 },
  originalText: { fontSize: 16, color: '#94a3b8', fontFamily: 'Playfair_Regular', fontStyle: 'italic', marginBottom: 12, lineHeight: 24 },
  translationText: { fontSize: 18, lineHeight: 28, color: '#f8fafc', fontFamily: 'Playfair_Medium', marginBottom: 12 },
  sourceText: { fontSize: 14, color: '#cbd5e1', fontFamily: 'System', marginBottom: 8 },
});