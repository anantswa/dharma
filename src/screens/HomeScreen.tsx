import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  Dimensions,
  FlatList,
  Image,
  InteractionManager,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AartiPlate } from '../components/AartiPlate';
import { FloatingMusicButton } from '../components/FloatingMusicButton';
import { Deity, FINAL_DEITIES } from '../data/deityImages';
import { AudioService } from '../services/audioService';
import { ShankhService } from '../services/shankhService';
import { useDataStore } from '../store/dataStore';
import { isTraditionEnabled, usePreferencesStore } from '../store/preferencesStore';

const { width, height } = Dimensions.get('window');

// 🔵 APP THEME COLOR
const THEME_COLOR = '#0f172a';

// Use dynamically loaded deities
const DEITIES = FINAL_DEITIES;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isShankhPlaying, setIsShankhPlaying] = useState(false);
  const wisdom = useDataStore((s) => s.wisdom);
  const primaryTradition = usePreferencesStore((s) => s.primaryTradition);
  const enabledTraditions = usePreferencesStore((s) => s.enabledTraditions);

  // Today's wisdom — same rotation logic as old Dashboard
  const todaysWisdom = useMemo(() => {
    if (!wisdom.length) return null;
    const dayOfYear = Math.floor(
      (new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
    );
    if (primaryTradition) {
      const filtered = wisdom.filter((w) => w.tradition?.toLowerCase() === primaryTradition.toLowerCase());
      if (filtered.length) return filtered[dayOfYear % filtered.length];
    }
    const filtered = wisdom.filter((w) => isTraditionEnabled(w.tradition, enabledTraditions));
    return filtered.length ? filtered[dayOfYear % filtered.length] : wisdom[0];
  }, [wisdom, primaryTradition, enabledTraditions]);

  // Initialize audio service on mount
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      AudioService.initialize();
      setIsReady(true);
    });

    return () => {
      task.cancel();
      ShankhService.stop();
    };
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        AudioService.pauseForBackground();
        ShankhService.pause();
        setIsShankhPlaying(false);
      }
    });
    return () => sub.remove();
  }, []);

  const toggleShankhLoop = async () => {
    try {
      if (isShankhPlaying) {
        await ShankhService.pause();
        setIsShankhPlaying(false);
      } else {
        const started = await ShankhService.playLoop();
        setIsShankhPlaying(started);
      }
    } catch (error) {
      console.error('Error toggling Shankh loop:', error);
      setIsShankhPlaying(false);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index ?? 0;
      setActiveIndex(newIndex);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // 🎨 RENDER FUNCTION (Maximized Deities)
  const renderDeity = ({ item }: { item: Deity }) => (
    <View style={styles.cardContainer}>
      {/* 1. Background */}
      <View style={styles.backgroundLayer} />

      {/* 2. Safe Zone (Maximized) */}
      <View style={styles.safeZone}>
        <Image 
          source={item.image} 
          style={styles.deityImage}
          resizeMode="contain"
        />
      </View>
    </View>
  );

  return (
    <>
      <View style={styles.container}>
        <StatusBar hidden={true} backgroundColor={THEME_COLOR} />
        
        {/* BOTTOM LAYER: Carousel */}
        <FlatList
          data={DEITIES}
          renderItem={renderDeity}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          decelerationRate="fast"
          disableIntervalMomentum={true}
          scrollEventThrottle={32}
          bounces={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={2}
          windowSize={3}
          initialNumToRender={1}
          style={styles.carousel}
          getItemLayout={(data, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
        />

        {/* MIDDLE LAYER: Temple Frame */}
        <View style={styles.templeFrame} pointerEvents="box-none">
          <Image
            source={require('../../assets/images/temple/temple_screen.png')}
            style={{ width, height }}
            resizeMode="stretch"
            pointerEvents="none" 
          />
        </View>

        {/* TOP LAYER: UI Elements */}
        <View style={styles.topLayer} pointerEvents="box-none">
          {/* Today's Wisdom — subtle overlay at top */}
          {todaysWisdom && (
            <Pressable
              style={styles.wisdomOverlay}
              onPress={() => navigation.navigate('WisdomDetail', { wisdom: todaysWisdom })}
            >
              <Text style={styles.wisdomOverlayLabel}>TODAY'S WISDOM</Text>
              <Text style={styles.wisdomOverlayText} numberOfLines={2}>
                {todaysWisdom.translation_en || todaysWisdom.short_form || ''}
              </Text>
              <Text style={styles.wisdomOverlaySource}>
                {todaysWisdom.source_text || ''} {'\u2022'} {todaysWisdom.tradition}
              </Text>
            </Pressable>
          )}

          {/* Pagination */}
          <View style={styles.paginationContainer} pointerEvents="none">
            {DEITIES.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  activeIndex === index && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>

          {/* Aarti Plate */}
          <AartiPlate />

          {/* Shankh Loop Button (Left) */}
          <Pressable
            style={styles.shankhButton}
            onPress={toggleShankhLoop}
            accessibilityRole="button"
            accessibilityLabel="Play Shankh Om and Bells"
            accessibilityState={{ selected: isShankhPlaying }}
          >
            <View style={[styles.shankhDot, isShankhPlaying && styles.shankhDotActive]} />
          </Pressable>
        </View>
      </View>

      {/* Music Selection Button (Right) */}
      <FloatingMusicButton />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLOR,
  },
  carousel: {
    flex: 1,
  },
  cardContainer: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: THEME_COLOR,
  },
  safeZone: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deityImage: {
    width: '100%',
    height: '100%',
  },
  templeFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    zIndex: 10,
  },
  topLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    zIndex: 20,
  },
  wisdomOverlay: {
    position: 'absolute',
    top: 52,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(2, 6, 23, 0.75)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
    zIndex: 25,
  },
  wisdomOverlayLabel: {
    fontSize: 10,
    color: '#fbbf24',
    letterSpacing: 1.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  wisdomOverlayText: {
    fontSize: 15,
    color: '#f1f5f9',
    fontFamily: 'Playfair_Medium',
    lineHeight: 22,
    marginBottom: 6,
  },
  wisdomOverlaySource: {
    fontSize: 11,
    color: '#64748b',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 20,
    backgroundColor: '#fbbf24',
    opacity: 0.8,
  },
  // 🟢 UPDATED: Aligned to bottom: 100 to match Music Button
  shankhButton: {
    position: 'absolute',
    left: 20,
    bottom: 100, // Matches FloatingMusicButton height
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shankhDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.7)',
  },
  shankhDotActive: {
    backgroundColor: '#fbbf24',
    borderColor: '#fff',
    shadowColor: '#fbbf24',
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
});