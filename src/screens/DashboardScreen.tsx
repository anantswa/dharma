import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import {
    Dimensions,
    FlatList,
    ImageBackground,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import eventsDataRaw from '../data/calendar/events_2025.json';
let eventsData2027Raw: any = {};
try { eventsData2027Raw = require('../data/calendar/events_2027.json'); } catch (e) { /* 2027 data not yet available */ }
import wisdomData from '../data/wisdom_core_50.json';
import { isTraditionEnabled, usePreferencesStore } from '../store/preferencesStore';

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
  id?: string;
  date: string;
  name: string;
  faith: string;
  category: string;
};

const { width, height } = Dimensions.get('window');

// --- Data Logic ---
const eventsData: EventItem[] = [
  ...((eventsDataRaw as any).events_2025 || []),
  ...((eventsDataRaw as any).events_2026 || []),
  ...((eventsData2027Raw as any).events_2027 || [])
];

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const enabledTraditions = usePreferencesStore((state) => state.enabledTraditions);
  const primaryTradition = usePreferencesStore((state) => state.primaryTradition);

  const bgImage = require('../../assets/images/splash/splash_01.jpg'); 

  const coreWisdom = useMemo(() => {
    const all = (wisdomData as WisdomItem[]).filter((w) => w.is_core);
    
    // First priority: Show wisdom from user's primary tradition
    if (primaryTradition) {
      const primaryFiltered = all.filter((w) => w.tradition === primaryTradition);
      if (primaryFiltered.length > 0) {
        const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
        return primaryFiltered[dayOfYear % primaryFiltered.length];
      }
    }
    
    // Fallback: Use enabled traditions
    if (!enabledTraditions) return all[0];
    const filtered = all.filter((w) => isTraditionEnabled(w.tradition, enabledTraditions));
    if (!filtered.length) return all[0];
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    return filtered[dayOfYear % filtered.length];
  }, [enabledTraditions, primaryTradition]);

  const upcomingEvents = useMemo(() => {
    if (!eventsData || !eventsData.length) return [] as EventItem[];
    // Safety check: if enabledTraditions is undefined during initial load, show all
    if (!enabledTraditions) return [];
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Show events in the next 7 days only
    const oneWeekFromNow = new Date(today);
    oneWeekFromNow.setDate(today.getDate() + 7);

    return eventsData
      .filter((event) => {
        const d = new Date(event.date);
        // Only show events between today and 7 days from now
        if (d < today || d > oneWeekFromNow) return false;
        // Filter by enabled traditions
        if (event.faith && !isTraditionEnabled(event.faith, enabledTraditions)) return false;
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
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>TODAY'S WISDOM</Text>
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
                    keyExtractor={(item) => item.id || item.date + item.name}
                    renderItem={({ item }) => (
                      <View style={styles.eventRow}>
                        <View style={styles.eventDateCol}>
                          <Text style={styles.eventDate}>{formatDate(item.date)}</Text>
                        </View>
                        <View style={styles.eventTextCol}>
                          <Text style={styles.eventTitle}>{item.name}</Text>
                          <Text style={styles.eventMeta}>{item.faith} • {item.category}</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
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
