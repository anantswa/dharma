// src/screens/WisdomDetailScreen.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';

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

type RouteParams = {
  wisdom: WisdomItem;
};

const getBackgroundForTradition = (tradition: string) => {
  const t = tradition.toLowerCase();

  if (t.includes('sikh')) {
    return require('../../assets/wisdom/quotes_bg_03.png');
  }
  if (t.includes('buddh')) {
    return require('../../assets/wisdom/quotes_bg_05.png');
  }
  if (t.includes('jain')) {
    return require('../../assets/wisdom/quotes_bg_07.png');
  }
  if (t.includes('zen')) {
    return require('../../assets/wisdom/quotes_bg_10.png');
  }
  // default: Hindu / Vedanta / general
  return require('../../assets/wisdom/quotes_bg_01.png');
};

export const WisdomDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { wisdom } = route.params as RouteParams;

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const bgSource = getBackgroundForTradition(wisdom.tradition);

  return (
    <View style={styles.container}>
      <ImageBackground source={bgSource} style={styles.bgImage}>
        <View style={styles.overlay} />

        {/* Close button */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.closePill}
          >
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>

        {/* Glass card with verse */}
        <Animated.View style={[styles.glassWrapper, { opacity: fadeAnim }]}>
          <BlurView intensity={80} tint="dark" style={styles.glassCard}>
            <Text style={styles.traditionLabel}>
              {wisdom.tradition}
              {wisdom.lineage ? ` • ${wisdom.lineage}` : ''}
            </Text>

            <Text style={styles.originalText}>
              {wisdom.original_transliteration}
            </Text>

            <Text style={styles.translationText}>
              {wisdom.translation_en}
            </Text>

            <Text style={styles.sourceText}>— {wisdom.source}</Text>

            {wisdom.theme ? (
              <Text style={styles.themeText}>{wisdom.theme}</Text>
            ) : null}
          </BlurView>
        </Animated.View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  bgImage: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3, 7, 18, 0.55)',
  },
  topBar: {
    paddingTop: 54,
    paddingHorizontal: 20,
    alignItems: 'flex-start',
  },
  closePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.6)',
  },
  closeText: {
    color: '#e5e7eb',
    fontSize: 13,
    fontFamily: 'Playfair_Regular',
  },
  glassWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingBottom: 80,
  },
  glassCard: {
    borderRadius: 26,
    paddingHorizontal: 22,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: 'rgba(191, 219, 254, 0.6)',
    backgroundColor: 'rgba(15, 23, 42, 0.83)',
  },
  traditionLabel: {
    fontSize: 13,
    color: '#a5b4fc',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 10,
    fontFamily: 'Playfair_SemiBold',
  },
  originalText: {
    fontSize: 15,
    color: '#e5e7eb',
    fontFamily: 'Playfair_Regular',
    marginBottom: 16,
  },
  translationText: {
    fontSize: 18,
    lineHeight: 26,
    color: '#f9fafb',
    fontFamily: 'Playfair_Bold',
    marginBottom: 16,
  },
  sourceText: {
    fontSize: 14,
    color: '#d1d5db',
    fontFamily: 'Playfair_Regular',
    marginBottom: 4,
  },
  themeText: {
    fontSize: 13,
    color: '#fbbf24',
    fontFamily: 'Playfair_SemiBold',
  },
});
