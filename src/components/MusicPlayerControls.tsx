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

export const MusicPlayerControls: React.FC = () => {
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const currentTrackId = useMusicStore((s) => s.currentTrackId);
  const currentPosition = useMusicStore((s) => s.currentPosition);
  const duration = useMusicStore((s) => s.duration);

  const currentTrack = DEVOTIONAL_TRACKS.find((t) => t.id === currentTrackId);

  const handlePlayPause = () => {
    // Non-blocking - execute asynchronously
    setTimeout(async () => {
      try {
        if (isPlaying) {
          await AudioService.pause();
        } else {
          if (currentTrack) {
            await AudioService.resume();
          }
        }
      } catch (error) {
        console.error('Error toggling playback:', error);
      }
    }, 0);
  };

  const handleSeek = (value: number) => {
    // Non-blocking seek
    setTimeout(async () => {
      try {
        await AudioService.seek(value);
      } catch (error) {
        console.error('Error seeking:', error);
      }
    }, 0);
  };

  if (!currentTrack) {
    return (
      <View style={styles.container}>
        <Text style={styles.noTrackText}>Select a track to begin</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Seek Bar */}
      <View style={styles.seekContainer}>
        <Text style={styles.timeText}>{formatTime(currentPosition)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration || 1}
          value={currentPosition}
          onSlidingComplete={handleSeek}
          minimumTrackTintColor="#fbbf24"
          maximumTrackTintColor="#444"
          thumbTintColor="#fbbf24"
        />
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>

      {/* Play/Pause Button */}
      <Pressable style={styles.playButton} onPress={handlePlayPause}>
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={32}
          color="#fff"
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#1a1a2e',
  },
  seekContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  slider: {
    flex: 1,
    marginHorizontal: 8,
  },
  timeText: {
    fontSize: 11,
    color: '#aaa',
    fontFamily: 'Playfair_Regular',
    minWidth: 40,
    textAlign: 'center',
  },
  playButton: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF9933',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF9933',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  noTrackText: {
    fontSize: 13,
    color: '#888',
    fontFamily: 'Playfair_Regular',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
