import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getFaithTheme } from '../data/faiths';
import { usePreferencesStore } from '../store/preferencesStore';
import { useNoticeboard } from '../store/noticeboardStore';
import { track } from '../services/analytics';

/**
 * Noticeboard — the temple's notice wall. Announcements only (new drops, festival
 * specials), streamed from config/noticeboard.json: we post by editing a JSON file,
 * users are never tracked. No comments, no feed mechanics — a wall, not a network.
 */
export const NoticeboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const theme = getFaithTheme(usePreferencesStore((s) => s.primaryTradition));
  const notices = useNoticeboard((s) => s.notices);

  useEffect(() => {
    track('noticeboard_open');
    useNoticeboard.getState().load();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#020617', '#0b1220', '#020617']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={16} style={{ marginBottom: 6 }}>
          <Ionicons name="chevron-back" size={26} color="#e2e8f0" />
        </Pressable>
        <Text style={[styles.kicker, { color: theme.accent }]}>THE NOTICEBOARD</Text>
        <Text style={styles.title}>From the temple</Text>

        {notices.length === 0 && <Text style={styles.empty}>Nothing on the wall yet.</Text>}
        {notices.map((n) => (
          <View key={n.id} style={styles.card}>
            <Text style={styles.date}>{n.date}</Text>
            <Text style={styles.noticeTitle}>{n.title}</Text>
            <Text style={styles.body}>{n.body}</Text>
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  scroll: { paddingHorizontal: 18, paddingTop: 60, paddingBottom: 60 },
  kicker: { fontSize: 11, letterSpacing: 2.5, fontWeight: '800' },
  title: { fontSize: 30, color: '#f8fafc', fontFamily: 'Playfair_Bold', marginTop: 4, marginBottom: 20 },
  empty: { color: '#64748b', marginTop: 30, textAlign: 'center' },
  card: {
    backgroundColor: 'rgba(15,23,42,0.55)', borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.14)', padding: 16, marginBottom: 14,
  },
  date: { color: '#64748b', fontSize: 11.5, marginBottom: 6 },
  noticeTitle: { color: '#f1f5f9', fontSize: 17, fontFamily: 'Playfair_Bold' },
  body: { color: '#cbd5e1', fontSize: 13.5, lineHeight: 21, marginTop: 6 },
});
