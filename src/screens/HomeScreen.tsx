import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, StatusBar, ImageBackground, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; // Import Gradient
import { useNavigation } from '@react-navigation/native';

import wisdomData from '../data/wisdom_core_50.json';
import eventsDataRaw from '../data/calendar/events_2025.json';
import { usePreferencesStore, isTraditionEnabled } from '../store/preferencesStore';

// --- Types ---
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

type EventItem = {
  id: string;
  date: string;
  title: string;
  faith: string;
  type: string;
};

const { width, height } = Dimensions.get('window');

// --- Data Logic ---
const eventsData: EventItem[] = Array.isArray(eventsDataRaw)
  ? (eventsDataRaw as EventItem[])
  : ((eventsDataRaw as { events?: EventItem[] }).events ?? []);

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const enabledTraditions = usePreferencesStore((state) => state.enabledTraditions);

  // --- Pick Background ---
  // You can randomize this later: `splash_0${Math.floor(Math.random() * 7) + 1}.jpg`
  const bgImage = require('../../assets/images/splash/splash_01.jpg'); 

  const coreWisdom = useMemo(() => {
    const all = (wisdomData as WisdomItem[]).filter((w) => w.is_core);
    const filtered = all.filter((w) => isTraditionEnabled(w.tradition));
    if (!filtered.length) return all[0];
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    return filtered[dayOfYear % filtered.length];
  }, [enabledTraditions]);

  const upcomingEvents = useMemo(() => {
    if (!eventsData || !eventsData.length) return [] as EventItem[];
    const today = new Date();
    today.setHours(0,0,0,0);

    return eventsData
      .filter((event) => {
        const d = new Date(event.date);
        if (d < today) return false;
        if (event.faith && !isTraditionEnabled(event.faith)) return false;
        return true;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  }, [enabledTraditions]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* 1. Background Image */}
      <ImageBackground source={bgImage} style={styles.bg} resizeMode="cover">
        
        {/* 2. Gradient Overlay (Essential for text readability) */}
        <LinearGradient 
          colors={['rgba(2,6,23,0.3)', 'rgba(2,6,23,0.95)']} 
          locations={[0, 0.7]}
          style={styles.gradient}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerBlock}>
              <Text style={styles.appTitle}>Dharma</Text>
              <Text style={styles.appSubtitle}>
                A daily compass for the inner life
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate('WisdomDetail', { wisdom: coreWisdom })}
              style={styles.cardWrapper}
            >
              {/* Added blur for glass effect on the card */}
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>TODAY’S WISDOM</Text>
                <Text style={styles.wisdomText}>{coreWisdom.translation_en}</Text>
                <Text style={styles.wisdomMeta}>{coreWisdom.source} • {coreWisdom.tradition}</Text>
                <Text style={styles.wisdomOriginal}>{coreWisdom.original_transliteration}</Text>
              </View>
            </TouchableOpacity>

            <View style={[styles.cardWrapper, { marginTop: 24 }]}>
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>COMING UP</Text>
                {upcomingEvents.length === 0 ? (
                  <Text style={[styles.emptyText, { marginTop: 12 }]}>No upcoming events.</Text>
                ) : (
                  <FlatList
                    data={upcomingEvents}
                    keyExtractor={(item) => item.id || item.date + item.title}
                    renderItem={({ item }) => (
                      <View style={styles.eventRow}>
                        <View style={styles.eventDateCol}>
                          <Text style={styles.eventDate}>{formatDate(item.date)}</Text>
                        </View>
                        <View style={styles.eventTextCol}>
                          <Text style={styles.eventTitle}>{item.name || item.title}</Text>
                          <Text style={styles.eventMeta}>{item.faith} • {item.type || item.category}</Text>
                        </View>
                      </View>
                    )}
                    scrollEnabled={false}
                    ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                    contentContainerStyle={{ marginTop: 12 }}
                  />
                )}
              </View>
            </View>
          </ScrollView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  bg: { flex: 1, width, height },
  gradient: { flex: 1 },
  scrollContent: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 100 },
  headerBlock: { marginBottom: 26 },
  appTitle: { fontSize: 36, color: '#fbbf24', fontFamily: 'Playfair_Bold' },
  appSubtitle: { marginTop: 6, fontSize: 16, color: '#e2e8f0', fontFamily: 'Playfair_Regular', opacity: 0.9 },
  cardWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 23, 42, 0.6)', // More transparent to show background
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  card: { padding: 24 },
  sectionLabel: { fontSize: 12, color: '#fbbf24', letterSpacing: 1.5, marginBottom: 16, fontFamily: 'Playfair_SemiBold' },
  wisdomText: { fontSize: 22, lineHeight: 32, color: '#f8fafc', fontFamily: 'Playfair_Medium', marginBottom: 16 },
  wisdomMeta: { fontSize: 14, color: '#94a3b8', marginBottom: 8 },
  wisdomOriginal: { fontSize: 14, color: '#64748b', fontStyle: 'italic' },
  eventRow: { flexDirection: 'row' },
  eventDateCol: { width: 90 },
  eventDate: { fontSize: 14, color: '#cbd5e1', fontFamily: 'Playfair_Regular' },
  eventTextCol: { flex: 1 },
  eventTitle: { fontSize: 16, color: '#f1f5f9', fontFamily: 'Playfair_SemiBold', marginBottom: 4 },
  eventMeta: { fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  emptyText: { color: '#64748b', fontSize: 14, fontStyle: 'italic' },
});