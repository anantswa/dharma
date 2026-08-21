import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getFaithTheme } from '../data/faiths';

const FILMS_URL = 'https://dharmaweave.com/cdn/dharma-art/films/catalog.json';
type Film = { id: string; title: string; channel: string; thumb: string; url: string; duration: number; published: string };

const mins = (s: number) => `${Math.round(s / 60)} min`;

export const FilmsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const theme = getFaithTheme('Hindu');
  const [films, setFilms] = useState<Film[]>([]);

  useEffect(() => {
    let alive = true;
    fetch(FILMS_URL).then((r) => r.json())
      .then((d) => { if (alive && Array.isArray(d?.films)) setFilms(d.films); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // Play in-app (embedded player) — never bounce the user out to a browser.
  const open = (f: Film) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    navigation.navigate('FilmPlayer', { id: f.id, title: f.title, channel: f.channel });
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#020617', '#0b1220', '#020617']} style={StyleSheet.absoluteFill} />
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={16}><Ionicons name="chevron-back" size={26} color="#e2e8f0" /></Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.kicker, { color: theme.accent }]}>FILMS</Text>
        <Text style={styles.title}>Watch</Text>
        <Text style={styles.sub}>{films.length} cinematic kathas</Text>

        {films.map((f) => (
          <Pressable key={f.id} style={styles.card} onPress={() => open(f)}>
            <View style={styles.thumbWrap}>
              {!!f.thumb && <ExpoImage source={{ uri: f.thumb }} style={StyleSheet.absoluteFill as any} contentFit="cover" cachePolicy="memory-disk" />}
              <View style={styles.playOverlay}><Ionicons name="play" size={26} color="#fff" /></View>
              <View style={styles.durBadge}><Text style={styles.durTxt}>{mins(f.duration)}</Text></View>
            </View>
            <View style={styles.meta}>
              <Text style={styles.filmTitle} numberOfLines={2}>{f.title}</Text>
              <Text style={styles.filmChan}>{f.channel}</Text>
            </View>
          </Pressable>
        ))}
        {films.length === 0 && <Text style={styles.empty}>Loading films…</Text>}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  topBar: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 4 },
  scroll: { paddingHorizontal: 18, paddingBottom: 40 },
  kicker: { fontSize: 12, letterSpacing: 3, fontWeight: '800' },
  title: { fontSize: 32, color: '#f8fafc', fontFamily: 'Playfair_Bold', marginTop: 4 },
  sub: { fontSize: 13.5, color: '#94a3b8', marginTop: 6, marginBottom: 18 },
  card: { marginBottom: 18 },
  thumbWrap: { height: 200, borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'center', alignItems: 'center' },
  playOverlay: { width: 58, height: 58, borderRadius: 29, backgroundColor: 'rgba(2,6,23,0.55)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)' },
  durBadge: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(2,6,23,0.8)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  durTxt: { color: '#f8fafc', fontSize: 11, fontWeight: '700' },
  meta: { marginTop: 10 },
  filmTitle: { color: '#f1f5f9', fontSize: 16, fontFamily: 'Playfair_Bold', lineHeight: 22 },
  filmChan: { color: '#94a3b8', fontSize: 12.5, marginTop: 3 },
  empty: { color: '#64748b', textAlign: 'center', marginTop: 40 },
});
