import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DEVOTIONAL_TRACKS } from '../data/devotionalTracks';
import { AudioService } from '../services/audioService';
import { useMusicStore } from '../store/musicStore';

// Format milliseconds to MM:SS
const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const MiniMusicPlayer: React.FC = () => {
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const currentTrackId = useMusicStore((s) => s.currentTrackId);
  const currentPosition = useMusicStore((s) => s.currentPosition);
  const duration = useMusicStore((s) => s.duration);
  const setBottomSheetOpen = useMusicStore((s) => s.setBottomSheetOpen);

  const currentTrack = DEVOTIONAL_TRACKS.find((t) => t.id === currentTrackId);

  const handlePlayPause = async () => {
    if (isPlaying) {
      await AudioService.pause();
    } else {
      await AudioService.resume();
    }
  };

  const handleSeek = async (value: number) => {
    await AudioService.seek(value);
  };

  // Don't show if no track is loaded
  if (!currentTrack) {
    return null;
  }

  return (
    <Pressable 
      style={styles.container}
      onPress={() => setBottomSheetOpen(true)}
    >
      {/* Progress Bar - Full Width Background */}
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBar, 
            { width: `${duration > 0 ? (currentPosition / duration) * 100 : 0}%` }
          ]} 
        />
      </View>

      {/* Content Row */}
      <View style={styles.contentRow}>
        {/* Track Info */}
        <View style={styles.trackInfo}>
          <Text style={styles.trackTitle} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={styles.trackTime}>
            {formatTime(currentPosition)} / {formatTime(duration)}
          </Text>
        </View>

        {/* Slider for Seek */}
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration || 1}
          value={currentPosition}
          onSlidingComplete={handleSeek}
          minimumTrackTintColor="#fbbf24"
          maximumTrackTintColor="rgba(255,255,255,0.2)"
          thumbTintColor="#fbbf24"
        />

        {/* Play/Pause Button */}
        <Pressable style={styles.playButton} onPress={handlePlayPause}>
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={24}
            color="#fff"
          />
        </Pressable>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80, // Above the tab bar (60 height + 16 bottom + 4 padding)
    left: 0,
    right: 0,
    backgroundColor: '#1a1a2e',
    borderTopWidth: 1,
    borderTopColor: 'rgba(251, 191, 36, 0.3)',
    zIndex: 200,
    elevation: 200,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fbbf24',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  trackInfo: {
    flex: 0,
    marginRight: 8,
    minWidth: 100,
  },
  trackTitle: {
    fontSize: 13,
    fontFamily: 'Playfair_Medium',
    color: '#fff',
    marginBottom: 2,
  },
  trackTime: {
    fontSize: 10,
    color: '#aaa',
    fontFamily: 'Playfair_Regular',
  },
  slider: {
    flex: 1,
    marginHorizontal: 8,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF9933',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
