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

import { useDataStore } from '../store/dataStore';
import { isTraditionEnabled, usePreferencesStore } from '../store/preferencesStore';
import type { WisdomEntry, FestivalEntry } from '../types/supabase';

const { width, height } = Dimensions.get('window');

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const enabledTraditions = usePreferencesStore((state) => state.enabledTraditions);
  const primaryTradition = usePreferencesStore((state) => state.primaryTradition);
  const wisdom = useDataStore((state) => state.wisdom);
  const festivals = useDataStore((state) => state.festivals);

  const bgImage = require('../../assets/images/splash/splash_01.jpg');

  const coreWisdom = useMemo(() => {
    if (!wisdom.length) return null;

    const dayOfYear = Math.floor(
      (new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24,
    );

    // First priority: Show wisdom from user's primary tradition
    if (primaryTradition) {
      const primaryFiltered = wisdom.filter(
        (w) => w.tradition?.toLowerCase() === primaryTradition.toLowerCase(),
      );
      if (primaryFiltered.length > 0) {
        return primaryFiltered[dayOfYear % primaryFiltered.length];
      }
    }

    // Fallback: Use enabled traditions
    if (!enabledTraditions) return wisdom[0];
    const filtered = wisdom.filter((w) => isTraditionEnabled(w.tradition, enabledTraditions));
    if (!filtered.length) return wisdom[0];
    return filtered[dayOfYear % filtered.length];
  }, [wisdom, enabledTraditions, primaryTradition]);

  const upcomingEvents = useMemo(() => {
    if (!festivals.length || !enabledTraditions) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oneWeekFromNow = new Date(today);
    oneWeekFromNow.setDate(today.getDate() + 7);

    return festivals
      .filter((event) => {
        const d = new Date(event.date);
        if (d < today || d > oneWeekFromNow) return false;
        if (event.faith && !isTraditionEnabled(event.faith, enabledTraditions)) return false;
        return true;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  }, [festivals, enabledTraditions]);

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

            {coreWisdom && (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('WisdomDetail', { wisdom: coreWisdom })}
                style={styles.cardWrapper}
              >
                <View style={styles.card}>
                  <Text style={styles.sectionLabel}>TODAY'S WISDOM</Text>
                  <Text style={styles.wisdomText}>
                    {coreWisdom.translation_en || coreWisdom.short_form || ''}
                  </Text>
                  <Text style={styles.wisdomMeta}>
                    {coreWisdom.source_text || ''}{coreWisdom.source_location ? ` ${coreWisdom.source_location}` : ''} {'\u2022'} {coreWisdom.tradition}
                  </Text>
                  {coreWisdom.transliteration ? (
                    <Text style={styles.wisdomOriginal}>{coreWisdom.transliteration}</Text>
                  ) : coreWisdom.original_script ? (
                    <Text style={styles.wisdomOriginal}>{coreWisdom.original_script}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            )}

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
