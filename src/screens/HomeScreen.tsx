// src/screens/HomeScreen.tsx
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';

import wisdomData from '../data/wisdom_core_50.json';
import eventsDataRaw from '../data/calendar/events_2025.json';

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

type EventItem = {
  date: string;
  name: string;
  faith: string;
  category: string;
  wisdom_tags?: string[];
};

const typedWisdom = wisdomData as WisdomItem[];

// Be defensive in case the JSON is wrapped like { "events": [...] }
const eventsData: EventItem[] = Array.isArray(eventsDataRaw)
  ? (eventsDataRaw as EventItem[])
  : ((eventsDataRaw as any).events ?? []);

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  // Pick the first "core" wisdom, otherwise fall back to first entry
  const coreWisdom =
    typedWisdom.find((w) => w.is_core) ?? (typedWisdom[0] as WisdomItem);

  const upcomingEvents = useMemo(() => {
    if (!eventsData || eventsData.length === 0) return [];

    const today = new Date();
    return eventsData
      .slice()
      .filter((event) => {
        const d = new Date(event.date);
        // keep today or later
        return d >= new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        );
      })
      .sort(
        (a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
      )
      .slice(0, 3);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>Dharma</Text>
          <Text style={styles.tagline}>A daily compass for the inner life</Text>
        </View>

        {/* Today's Wisdom – tappable glass card */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('WisdomDetail', { wisdom: coreWisdom })}
        >
          <BlurView intensity={40} tint="dark" style={styles.glassCard}>
            <Text style={styles.sectionLabel}>TODAY’S WISDOM</Text>

            <Text style={styles.wisdomText}>
              {coreWisdom.translation_en}
            </Text>

            <Text style={styles.wisdomMeta}>
              {coreWisdom.source} • {coreWisdom.tradition}
            </Text>

            {coreWisdom.original_transliteration ? (
              <Text style={styles.wisdomOriginal}>
                {coreWisdom.original_transliteration}
              </Text>
            ) : null}
          </BlurView>
        </TouchableOpacity>

        {/* Coming Up – events list in a glass card */}
        {upcomingEvents.length > 0 && (
          <BlurView intensity={40} tint="dark" style={[styles.glassCard, styles.eventsCard]}>
            <Text style={styles.sectionLabel}>COMING UP</Text>

            <FlatList
              scrollEnabled={false}
              data={upcomingEvents}
              keyExtractor={(item) => `${item.date}-${item.name}`}
              renderItem={({ item }) => (
                <View style={styles.eventRow}>
                  <View style={styles.eventDateBlock}>
                    <Text style={styles.eventDateText}>{item.date}</Text>
                  </View>
                  <View style={styles.eventTextBlock}>
                    <Text style={styles.eventName}>{item.name}</Text>
                    <Text style={styles.eventMeta}>
                      {item.faith} • {item.category}
                    </Text>
                  </View>
                </View>
              )}
              ItemSeparatorComponent={() => <View style={styles.eventDivider} />}
            />
          </BlurView>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617', // deep navy
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 28,
  },
  appName: {
    fontSize: 40,
    color: '#fbbf24', // saffron gold
    fontFamily: 'Playfair_Bold',
  },
  tagline: {
    marginTop: 8,
    fontSize: 16,
    color: '#e5e7eb',
    fontFamily: 'Playfair_Regular',
  },
  glassCard: {
    borderRadius: 26,
    paddingHorizontal: 22,
    paddingVertical: 22,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(191, 219, 254, 0.35)',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    overflow: 'hidden',
  },
  eventsCard: {
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#a5b4fc',
    marginBottom: 10,
    fontFamily: 'Playfair_SemiBold',
  },
  wisdomText: {
    fontSize: 22,
    lineHeight: 30,
    color: '#f9fafb',
    fontFamily: 'Playfair_Bold',
    marginBottom: 10,
  },
  wisdomMeta: {
    fontSize: 14,
    color: '#e5e7eb',
    fontFamily: 'Playfair_Regular',
    marginBottom: 6,
  },
  wisdomOriginal: {
    fontSize: 14,
    color: '#c4b5fd',
    fontFamily: 'Playfair_Regular',
  },
  eventRow: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  eventDateBlock: {
    width: 96,
    paddingRight: 12,
  },
  eventDateText: {
    fontSize: 13,
    color: '#e5e7eb',
    fontFamily: 'Playfair_Regular',
  },
  eventTextBlock: {
    flex: 1,
  },
  eventName: {
    fontSize: 16,
    color: '#f9fafb',
    fontFamily: 'Playfair_SemiBold',
    marginBottom: 2,
  },
  eventMeta: {
    fontSize: 14,
    color: '#d1d5db',
    fontFamily: 'Playfair_Regular',
  },
  eventDivider: {
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.35)',
    marginVertical: 4,
  },
});

export default HomeScreen;
