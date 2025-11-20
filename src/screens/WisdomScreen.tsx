// src/screens/WisdomScreen.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';

import wisdomData from '../data/wisdom_core_50.json';

type WisdomItem = {
  id: string;
  tradition: string;
  lineage?: string;
  original_transliteration: string;
  translation_en: string;
  source: string;
  theme?: string;
  is_core?: boolean;
};

const typedWisdom = wisdomData as WisdomItem[];

const TRADITION_FILTERS = ['All', 'Hindu', 'Sikh', 'Buddhist', 'Jain', 'Zen'];

const getBackgroundForTradition = (tradition: string) => {
  const t = tradition.toLowerCase();

  // These paths expect your images at assets/images/quotes/...
  if (t.includes('sikh')) {
    return require('../../assets/images/quotes/quotes_bg_03.png');
  }
  if (t.includes('buddh')) {
    return require('../../assets/images/quotes/quotes_bg_05.png');
  }
  if (t.includes('jain')) {
    return require('../../assets/images/quotes/quotes_bg_07.png');
  }
  if (t.includes('zen')) {
    return require('../../assets/images/quotes/quotes_bg_10.png');
  }
  // default (Hindu / Vedanta / other)
  return require('../../assets/images/quotes/quotes_bg_01.png');
};

export const WisdomScreen: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const navigation = useNavigation<any>();

  const filteredWisdom = useMemo(() => {
    if (selectedFilter === 'All') return typedWisdom;

    const key = selectedFilter.toLowerCase();
    return typedWisdom.filter((w) =>
      w.tradition.toLowerCase().includes(key)
    );
  }, [selectedFilter]);

  const renderChip = (label: string) => {
    const active = selectedFilter === label;
    return (
      <TouchableOpacity
        key={label}
        onPress={() => setSelectedFilter(label)}
        activeOpacity={0.8}
        style={[
          styles.chip,
          active && styles.chipActive,
        ]}
      >
        <Text style={[styles.chipText, active && styles.chipTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: WisdomItem }) => {
    const bgSource = getBackgroundForTradition(item.tradition);

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('WisdomDetail', { wisdom: item })}
      >
        <ImageBackground
          source={bgSource}
          style={styles.cardBackground}
          imageStyle={styles.cardImage}
        >
          <View style={styles.cardOverlay} />

          <BlurView intensity={45} tint="dark" style={styles.cardGlass}>
            <Text style={styles.cardTradition}>
              {item.tradition.toUpperCase()}
              {item.lineage ? ` • ${item.lineage}` : ''}
            </Text>

            <Text style={styles.cardTranslation}>
              {item.translation_en}
            </Text>

            <Text style={styles.cardSource}>— {item.source}</Text>

            {item.theme ? (
              <Text style={styles.cardTheme}>{item.theme}</Text>
            ) : null}
          </BlurView>
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Wisdom Library</Text>
        <Text style={styles.screenSubtitle}>
          Browse core verses across traditions.
        </Text>
      </View>

      {/* Filter chips */}
      <View style={styles.chipRowWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {TRADITION_FILTERS.map(renderChip)}
        </ScrollView>
      </View>

      <FlatList
        data={filteredWisdom}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    paddingTop: 56,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  screenTitle: {
    fontSize: 28,
    color: '#fbbf24',
    fontFamily: 'Playfair_Bold',
  },
  screenSubtitle: {
    marginTop: 6,
    fontSize: 15,
    color: '#e5e7eb',
    fontFamily: 'Playfair_Regular',
  },
  chipRowWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  chipRow: {
    alignItems: 'center',
    paddingRight: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.6)',
    marginRight: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
  },
  chipActive: {
    backgroundColor: 'rgba(251, 191, 36, 0.18)',
    borderColor: 'rgba(251, 191, 36, 0.85)',
  },
  chipText: {
    fontSize: 13,
    color: '#e5e7eb',
    fontFamily: 'Playfair_Regular',
  },
  chipTextActive: {
    color: '#fef3c7',
    fontFamily: 'Playfair_SemiBold',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  cardBackground: {
    marginBottom: 18,
  },
  cardImage: {
    borderRadius: 24,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3, 7, 18, 0.45)',
    borderRadius: 24,
  },
  cardGlass: {
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: 'rgba(191, 219, 254, 0.45)',
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
  },
  cardTradition: {
    fontSize: 13,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: '#a5b4fc',
    marginBottom: 8,
    fontFamily: 'Playfair_SemiBold',
  },
  cardTranslation: {
    fontSize: 18,
    lineHeight: 26,
    color: '#f9fafb',
    fontFamily: 'Playfair_Bold',
    marginBottom: 10,
  },
  cardSource: {
    fontSize: 14,
    color: '#e5e7eb',
    fontFamily: 'Playfair_Regular',
    marginBottom: 4,
  },
  cardTheme: {
    fontSize: 13,
    color: '#fbbf24',
    fontFamily: 'Playfair_SemiBold',
  },
});

export default WisdomScreen;
