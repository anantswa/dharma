import { Ionicons } from '@expo/vector-icons';
import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DEVOTIONAL_TRACKS } from '../data/devotionalTracks';
import { AudioService } from '../services/audioService';
import { useMusicStore } from '../store/musicStore';

export const TrackList: React.FC = () => {
  const currentTrackId = useMusicStore((s) => s.currentTrackId);
  const isPlaying = useMusicStore((s) => s.isPlaying);

  const handleTrackPress = async (trackId: string) => {
    setTimeout(async () => {
      try {
        const track = DEVOTIONAL_TRACKS.find((t) => t.id === trackId);
        if (!track) return;

        // Toggle play/pause if same track
        if (currentTrackId === trackId) {
          if (isPlaying) {
            await AudioService.pause();
          } else {
            await AudioService.resume();
          }
        } else {
          // Switch to different track
          await AudioService.loadAndPlay(track);
        }
      } catch (error) {
        console.error('Error handling track press:', error);
      }
    }, 0);
  };

  const renderTrack = ({ item }: { item: typeof DEVOTIONAL_TRACKS[0] }) => {
    const isCurrentTrack = item.id === currentTrackId;
    const showPlaying = isCurrentTrack && isPlaying;

    return (
      <Pressable
        style={[styles.trackItem, isCurrentTrack && styles.trackItemActive]}
        onPress={() => handleTrackPress(item.id)}
      >
        <View style={styles.trackInfo}>
          <Text style={[styles.trackTitle, isCurrentTrack && styles.trackTitleActive]}>
            {item.title}
          </Text>
          <Text style={styles.trackSubtitle}>{item.subtitle}</Text>
        </View>

        <Ionicons
          name={showPlaying ? 'pause-circle' : 'play-circle'}
          size={32}
          color={isCurrentTrack ? '#fbbf24' : '#888'}
        />
      </Pressable>
    );
  };

  return (
    <BottomSheetFlatList
      data={DEVOTIONAL_TRACKS}
      renderItem={renderTrack}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={true}
      style={styles.list}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  trackItemActive: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  trackInfo: {
    flex: 1,
    marginRight: 12,
  },
  trackTitle: {
    fontSize: 15,
    fontFamily: 'Playfair_Medium',
    color: '#fff',
    marginBottom: 2,
  },
  trackTitleActive: {
    color: '#fbbf24',
  },
  trackSubtitle: {
    fontSize: 12,
    color: '#aaa',
    fontFamily: 'Playfair_Regular',
  },
});
