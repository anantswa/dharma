import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle
} from 'react-native-reanimated';
import { useMusicStore } from '../store/musicStore';
// 1. New Imports to enable Auto-Play
import { DEVOTIONAL_TRACKS } from '../data/devotionalTracks';
import { AudioService } from '../services/audioService';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// 🎵 The Track to Auto-Play (Must match title in devotionalTracks.ts exactly)
const AUTO_PLAY_TRACK_TITLE = 'Shankh Om and Bells';

export const FloatingMusicButton: React.FC = () => {
  // Store State
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const setBottomSheetOpen = useMusicStore((s) => s.setBottomSheetOpen);
  
  // Store Setters (Required to update UI immediately)
  const setIsPlaying = useMusicStore((s) => s.setIsPlaying);
  const setCurrentTrack = useMusicStore((s) => s.setCurrentTrack);

  const lastPressTime = useRef(0);

  // Simplified glow - no infinite animations
  const glowStyle = useAnimatedStyle(() => {
    return {
      shadowOpacity: isPlaying ? 0.6 : 0.3,
    };
  });

  const handlePress = async () => {
    // Debounce - prevent rapid taps
    const now = Date.now();
    if (now - lastPressTime.current < 300) {
      return;
    }
    lastPressTime.current = now;
    
    // 1. Always open the menu (Existing behavior)
    setBottomSheetOpen(true);

    // 2. 🚀 AUTO-PLAY LOGIC (The New Feature)
    // If music is NOT playing, start "Shankh Om and Bells" immediately
    if (!isPlaying) {
      try {
        const signatureTrack = DEVOTIONAL_TRACKS.find(t => t.title === AUTO_PLAY_TRACK_TITLE);
        
        if (signatureTrack) {
          console.log('🎵 Auto-playing signature track:', signatureTrack.title);
          
          // A. Play the audio
          await AudioService.play(signatureTrack);
          
          // B. Update the App State (so icons turn yellow immediately)
          setIsPlaying(true);
          setCurrentTrack(signatureTrack);
        }
      } catch (error) {
        console.error('Auto-play failed:', error);
      }
    }
  };

  return (
    <AnimatedPressable
      style={[styles.button, glowStyle]}
      onPress={handlePress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons
        name={isPlaying ? 'musical-notes' : 'musical-note-outline'}
        size={26}
        color="#fbbf24"
      />
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 100, // Lowered position
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(15, 23, 42, 0.95)', // Dark theme matching tab bar
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.6)', // Golden border
    shadowColor: '#fbbf24',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 10,
  },
});