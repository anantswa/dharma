import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

type FestivalDetailProps = {
  route: {
    params: {
      festival: {
        date: string;
        name: string;
        faith: string;
        category: string;
        description?: string;
      };
    };
  };
};

export const FestivalDetailScreen: React.FC<FestivalDetailProps> = ({ route }) => {
  const navigation = useNavigation();
  const { festival } = route.params;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Placeholder content - will be replaced with actual festival data later
  const getPlaceholderContent = () => {
    return `${festival.name} is a significant observance in the ${festival.faith} tradition. This festival holds deep spiritual and cultural importance, celebrated with devotion and reverence by millions.

The origins of this sacred day trace back centuries, rooted in ancient scriptures and timeless traditions. Devotees observe this occasion through prayer, meditation, and various rituals that connect them to the divine.

Throughout history, this festival has been a time for families and communities to come together, sharing in the collective spiritual energy and reinforcing bonds of faith and unity.

The celebration often includes special prayers, sacred readings, charitable acts, and traditional observances that have been passed down through generations. These practices serve to deepen one's spiritual connection and remind practitioners of core spiritual values.

As we honor this sacred occasion, we are reminded of the eternal wisdom and the timeless teachings that continue to guide and inspire seekers on their spiritual journey.`;
  };

  const getContent = () => {
    // Use the description from the festival data if available, otherwise use placeholder
    if (festival.description) {
      return festival.description;
    }
    return getPlaceholderContent();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#020617', '#0f172a', '#1e293b']}
        style={styles.gradient}
      >
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fbbf24" />
          </TouchableOpacity>
          <Text style={styles.headerCategory}>{festival.category}</Text>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Festival Title */}
          <View style={styles.titleSection}>
            <Text style={styles.festivalName}>{festival.name}</Text>
            <Text style={styles.festivalDate}>{formatDate(festival.date)}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{festival.faith}</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Content Section */}
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>About This Festival</Text>
            <Text style={styles.description}>{getContent()}</Text>
          </View>

          {/* Show note only if using placeholder content */}
          {!festival.description && (
            <View style={styles.noteSection}>
              <Ionicons name="information-circle-outline" size={20} color="#64748b" />
              <Text style={styles.noteText}>
                Detailed festival information will be added soon.
              </Text>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerCategory: {
    fontSize: 14,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontFamily: 'System',
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  titleSection: {
    marginBottom: 32,
  },
  festivalName: {
    fontSize: 36,
    color: '#fbbf24',
    fontFamily: 'Playfair_Bold',
    lineHeight: 44,
    marginBottom: 12,
  },
  festivalDate: {
    fontSize: 16,
    color: '#cbd5e1',
    fontFamily: 'Playfair_Regular',
    marginBottom: 16,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  badgeText: {
    fontSize: 12,
    color: '#fbbf24',
    fontFamily: 'System',
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 32,
  },
  contentSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#e2e8f0',
    fontFamily: 'Playfair_Bold',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#cbd5e1',
    fontFamily: 'System',
    lineHeight: 26,
    opacity: 0.9,
  },
  noteSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
    marginTop: 16,
  },
  noteText: {
    fontSize: 13,
    color: '#64748b',
    fontFamily: 'System',
    marginLeft: 10,
    flex: 1,
    fontStyle: 'italic',
  },
});
