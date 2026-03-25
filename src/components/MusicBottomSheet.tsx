import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import React, { useCallback, useEffect, useRef } from 'react';
import { AppState, Dimensions, StyleSheet, Text, View } from 'react-native';
import { useMusicStore } from '../store/musicStore';
import { MusicPlayerControls } from './MusicPlayerControls';
import { TrackList } from './TrackList';

const { height } = Dimensions.get('window');
const SHEET_HEIGHT = height * 0.25; // 25% of screen height

export const MusicBottomSheet: React.FC = () => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const isBottomSheetOpen = useMusicStore((s) => s.isBottomSheetOpen);
  const setBottomSheetOpen = useMusicStore((s) => s.setBottomSheetOpen);
  const [currentIndex, setCurrentIndex] = React.useState(-1);

  // Open/close based on store state
  useEffect(() => {
    if (isBottomSheetOpen) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isBottomSheetOpen]);

  // Backdrop component
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  // Handle sheet changes
  const handleSheetChanges = useCallback((index: number) => {
    setCurrentIndex(index);
    if (index === -1) {
      setBottomSheetOpen(false);
    }
  }, [setBottomSheetOpen]);

  // Handle app state changes - close sheet when app goes to background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background') {
        bottomSheetRef.current?.close();
        setBottomSheetOpen(false);
        setCurrentIndex(-1);
      } else if (nextAppState === 'active') {
        bottomSheetRef.current?.close();
        setCurrentIndex(-1);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isBottomSheetOpen, setBottomSheetOpen]);

  return (
    <View 
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      pointerEvents={currentIndex === -1 ? 'none' : 'auto'}
    >
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={[SHEET_HEIGHT]}
        enablePanDownToClose
        enableOverDrag={false}
        backdropComponent={renderBackdrop}
        onChange={handleSheetChanges}
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.background}
        style={styles.bottomSheet}
        containerStyle={styles.container}
        animateOnMount={false}
      >
        {/* Header - Fixed */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Devotional Music</Text>
        </View>

        {/* Track List - Scrollable (direct child for scrolling to work) */}
        <TrackList />

        {/* Player Controls - Fixed at bottom */}
        <View style={styles.controlsWrapper}>
          <MusicPlayerControls />
        </View>
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // No z-index - controlled by wrapper View
  },
  bottomSheet: {
    // No z-index - controlled by wrapper View  
  },
  background: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleIndicator: {
    backgroundColor: '#fbbf24',
    width: 40,
  },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#1a1a2e',
  },
  headerText: {
    fontSize: 18,
    fontFamily: 'Playfair_SemiBold',
    color: '#fbbf24',
    textAlign: 'center',
  },
  controlsWrapper: {
    paddingHorizontal: 16,
    backgroundColor: '#1a1a2e',
    paddingBottom: 8,
  },
});
