import React, { useMemo } from 'react';
import { View, Text, StyleSheet, SectionList, StatusBar } from 'react-native';
import { BlurView } from 'expo-blur';
import { usePreferencesStore, isTraditionEnabled } from '../store/preferencesStore';

// Import your specific data structure
const eventsDataRaw = require('../data/calendar/events_2025.json');

type CalendarEvent = {
  date: string;
  name: string;
  faith: string;
  category: string;
};

type SectionData = {
  title: string;
  data: CalendarEvent[];
};

export const CalendarScreen: React.FC = () => {
  const enabledTraditions = usePreferencesStore((s) => s.enabledTraditions);

  const sections = useMemo(() => {
    // 1. Merge 2025 and 2026 arrays into one master list
    const list2025 = eventsDataRaw.events_2025 || [];
    const list2026 = eventsDataRaw.events_2026 || [];
    const allEvents: CalendarEvent[] = [...list2025, ...list2026];

    // 2. Filter by Tradition (Respecting Settings)
    const filtered = allEvents.filter(e => {
      // Always show Secular/National holidays, filter religious ones
      if (e.faith === 'Secular') return true;
      return isTraditionEnabled(e.faith);
    });

    // 3. Group by Month (e.g. "November 2025")
    const grouped: Record<string, CalendarEvent[]> = {};
    
    filtered.forEach(event => {
      const date = new Date(event.date);
      // Format: "November 2025"
      const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      if (!grouped[monthKey]) grouped[monthKey] = [];
      grouped[monthKey].push(event);
    });

    // 4. Convert to SectionList format
    // We rely on the order of keys, but let's ensure months are sorted by time
    return Object.keys(grouped)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map(key => ({
        title: key,
        data: grouped[key].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      }));

  }, [enabledTraditions]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Sacred Calendar</Text>
        <Text style={styles.subtitle}>Observances and festivals.</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item, index) => item.date + item.name + index}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.monthHeader}>
            <Text style={styles.monthTitle}>{title}</Text>
            <View style={styles.line} />
          </View>
        )}
        
        renderItem={({ item }) => (
          <BlurView intensity={30} tint="dark" style={styles.card}>
            <View style={styles.dateBox}>
              <Text style={styles.dayText}>
                {new Date(item.date).getDate()}
              </Text>
              <Text style={styles.weekdayText}>
                {new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
              </Text>
            </View>
            
            <View style={styles.details}>
              <Text style={styles.eventTitle}>{item.name}</Text>
              <Text style={styles.traditionBadge}>{item.faith} • {item.category}</Text>
            </View>
          </BlurView>
        )}
        
        ListEmptyComponent={
          <Text style={styles.emptyText}>No events found for your active traditions.</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { paddingTop: 60, paddingHorizontal: 20, marginBottom: 10 },
  title: { fontSize: 32, color: '#fbbf24', fontFamily: 'Playfair_Bold' },
  subtitle: { fontSize: 16, color: '#94a3b8', marginTop: 4, fontFamily: 'System' },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  
  monthHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 12 },
  monthTitle: { color: '#e2e8f0', fontSize: 18, fontFamily: 'Playfair_Bold', marginRight: 12 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  
  card: { 
    flexDirection: 'row', 
    marginBottom: 12, 
    borderRadius: 16, 
    overflow: 'hidden',
    backgroundColor: 'rgba(30,41,59,0.4)',
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16
  },
  dateBox: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingRight: 16, 
    borderRightWidth: 1, 
    borderRightColor: 'rgba(255,255,255,0.1)',
    marginRight: 16,
    width: 60
  },
  dayText: { fontSize: 24, color: '#fbbf24', fontFamily: 'Playfair_Bold' },
  weekdayText: { fontSize: 10, color: '#94a3b8', fontWeight: '700', marginTop: 2 },
  
  details: { flex: 1, justifyContent: 'center' },
  eventTitle: { fontSize: 16, color: '#f1f5f9', fontFamily: 'System', fontWeight: '600', lineHeight: 22, marginBottom: 6 },
  traditionBadge: { 
    fontSize: 11, 
    color: '#cbd5e1', 
    textTransform: 'uppercase', 
    letterSpacing: 1, 
    opacity: 0.7 
  },
  emptyText: { color: '#64748b', textAlign: 'center', marginTop: 40, fontSize: 14 }
});