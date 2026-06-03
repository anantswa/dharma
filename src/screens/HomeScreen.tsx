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
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AartiPlate } from '../components/AartiPlate';
import { DeityCard } from '../components/DeityCard';
import { FloatingMusicButton } from '../components/FloatingMusicButton';
import { Deity } from '../data/deityImages';
import { deitiesForFaith, getFaithTheme } from '../data/faiths';
import { AudioService } from '../services/audioService';
import { ShankhService } from '../services/shankhService';
import { useDataStore } from '../store/dataStore';
import { isTraditionEnabled, usePreferencesStore } from '../store/preferencesStore';
import { useStreakStore } from '../store/streakStore';

const { width, height } = Dimensions.get('window');

// 🔵 APP THEME COLOR
const THEME_COLOR = '#0f172a';

const safeHaptic = (fn: () => void) => {
  try { fn(); } catch { /* haptics unavailable (e.g. web) */ }
};

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isShankhPlaying, setIsShankhPlaying] = useState(false);
  const wisdom = useDataStore((s) => s.wisdom);
  const primaryTradition = usePreferencesStore((s) => s.primaryTradition);
  const enabledTraditions = usePreferencesStore((s) => s.enabledTraditions);

  // Faith identity — drives the darshan figure set + accent colour.
  const theme = useMemo(() => getFaithTheme(primaryTradition), [primaryTradition]);
  const deities = useMemo(() => deitiesForFaith(primaryTradition), [primaryTradition]);

  // Daily streak ("Prasad") — the habit engine.
  const currentStreak = useStreakStore((s) => s.currentStreak);
  useEffect(() => {
    useStreakStore.getState().load().then(() => useStreakStore.getState().recordVisit());
  }, []);

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
    safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
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

  // Parallax scroll position shared with each DeityCard.
  const scrollX = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index ?? 0;
      setActiveIndex((prev) => {
        if (prev !== newIndex) {
          safeHaptic(() => Haptics.selectionAsync()); // gentle tick on each darshan
        }
        return newIndex;
      });
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // 🎨 RENDER FUNCTION — parallax deity card
  const renderDeity = ({ item, index }: { item: Deity; index: number }) => (
    <DeityCard item={item} index={index} scrollX={scrollX} />
  );

  return (
    <>
      <View style={styles.container}>
        <StatusBar hidden={true} backgroundColor={THEME_COLOR} />
        
        {/* BOTTOM LAYER: Carousel (Reanimated parallax) */}
        <Animated.FlatList
          data={deities}
          renderItem={renderDeity}
          keyExtractor={(item: Deity) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={scrollHandler}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          decelerationRate="fast"
          disableIntervalMomentum={true}
          scrollEventThrottle={16}
          bounces={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={2}
          windowSize={3}
          initialNumToRender={1}
          style={styles.carousel}
          getItemLayout={(_data: any, index: number) => ({
            length: width,
            offset: width * index,
            index,
          })}
        />

        {/* MIDDLE LAYER: Temple Frame */}
        <View style={styles.templeFrame} pointerEvents="none">
          <Image
            source={require('../../assets/images/temple/temple_screen.png')}
            style={{ width, height }}
            resizeMode="stretch"
          />
        </View>

        {/* TOP LAYER: UI Elements */}
        <View style={styles.topLayer} pointerEvents="box-none">
          {/* Today's Wisdom — subtle overlay at top */}
          {todaysWisdom && (
            <Pressable
              style={[styles.wisdomOverlay, { borderColor: theme.accentSoft }]}
              onPress={() => navigation.navigate('WisdomDetail', { wisdom: todaysWisdom })}
            >
              <View style={styles.wisdomHeaderRow}>
                <Text style={[styles.wisdomOverlayLabel, { color: theme.accent }]}>
                  TODAY'S PRASAD
                </Text>
                {currentStreak > 0 && (
                  <View style={[styles.streakChip, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
                    <Text style={[styles.streakChipText, { color: theme.accent }]}>
                      {'\ud83d\udd25'} {currentStreak} day{currentStreak === 1 ? '' : 's'}
                    </Text>
                  </View>
                )}
              </View>
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
            {deities.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  activeIndex === index && styles.paginationDotActive,
                  activeIndex === index && { backgroundColor: theme.accent },
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
            <View style={[styles.shankhDot, isShankhPlaying && styles.shankhDotActive, isShankhPlaying && { backgroundColor: theme.accent }]} />
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
  wisdomHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  wisdomOverlayLabel: {
    fontSize: 10,
    color: '#fbbf24',
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  streakChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  streakChipText: {
    fontSize: 11,
    fontWeight: '700',
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