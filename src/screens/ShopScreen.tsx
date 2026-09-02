import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Image as ExpoImage } from 'expo-image';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BOOKS, Book, MUSIC_LINKS } from '../data/books';
import { getFaithTheme } from '../data/faiths';

// Live catalog — regenerated from the products DB on every launch (scripts/gen_shop_catalog.py).
// New products appear here with no app update; bundled BOOKS is the offline fallback.
const CATALOG_URL = 'https://dharmaweave.com/cdn/dharma-art/shop/catalog.json';

const open = (url?: string) => {
  if (!url) return;
  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
  Linking.openURL(url).catch(() => {});
};

export const ShopScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const theme = getFaithTheme('Hindu');
  const [books, setBooks] = useState<Book[]>(BOOKS);

  useEffect(() => {
    let alive = true;
    fetch(CATALOG_URL)
      .then((r) => r.json())
      .then((d) => { if (alive && Array.isArray(d?.books) && d.books.length) setBooks(d.books); })
      .catch(() => { /* offline → keep bundled fallback */ });
    return () => { alive = false; };
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* stack screen now (was the Android Store tab) — needs its own way back */}
        <Pressable onPress={() => navigation.goBack()} hitSlop={16} style={{ marginBottom: 6 }}>
          <Ionicons name="chevron-back" size={26} color="#e2e8f0" />
        </Pressable>
        <Text style={styles.title}>Shop</Text>
        <Text style={styles.subtitle}>Sacred stories & sound from DharmaWeave</Text>

        <Text style={[styles.section, { color: theme.accent }]}>GRAPHIC NOVELS</Text>
        {books.map((b) => (
          <View key={b.id} style={styles.card}>
            <ExpoImage source={{ uri: b.cover }} style={styles.cover} contentFit="cover" cachePolicy="memory-disk" />
            <View style={styles.info}>
              <Text style={styles.bookTitle} numberOfLines={2}>{b.name}</Text>
              <Text style={styles.bookDesc} numberOfLines={3}>{b.description}</Text>
              <View style={styles.buyRow}>
                {!!b.amazon && (
                  <Pressable style={[styles.buyBtn, { borderColor: theme.accent }]} onPress={() => open(b.amazon)}>
                    <Text style={[styles.buyTxt, { color: theme.accent }]}>Amazon</Text>
                  </Pressable>
                )}
                {!!b.google && (
                  <Pressable style={[styles.buyBtn, { borderColor: theme.accent }]} onPress={() => open(b.google)}>
                    <Text style={[styles.buyTxt, { color: theme.accent }]}>Play Books</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        ))}

        <Text style={[styles.section, { color: theme.accent, marginTop: 28 }]}>SACRED MUSIC</Text>
        <View style={styles.musicCard}>
          <View style={styles.musicIcon}><Ionicons name="musical-notes" size={26} color={theme.accent} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bookTitle}>Original mantras & chants</Text>
            <Text style={styles.bookDesc} numberOfLines={2}>
              Heart Sutra, Gayatri, Om Mani Padme Hum, Hanuman Chalisa & more — composed by DharmaWeave.
            </Text>
            <View style={styles.buyRow}>
              <Pressable style={[styles.buyBtn, { borderColor: '#1DB954' }]} onPress={() => open(MUSIC_LINKS.spotify)}>
                <Text style={[styles.buyTxt, { color: '#1DB954' }]}>Spotify</Text>
              </Pressable>
              <Pressable style={[styles.buyBtn, { borderColor: theme.accent }]} onPress={() => open(MUSIC_LINKS.appleMusic)}>
                <Text style={[styles.buyTxt, { color: theme.accent }]}>Apple Music</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>More titles release regularly — updates appear here automatically.</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  scroll: { paddingHorizontal: 18, paddingTop: 60, paddingBottom: 110 },
  title: { fontSize: 32, color: '#fbbf24', fontFamily: 'Playfair_Bold' },
  subtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4, marginBottom: 18 },
  section: { fontSize: 12, letterSpacing: 1.5, fontWeight: '800', marginBottom: 12 },
  card: { flexDirection: 'row', gap: 14, backgroundColor: 'rgba(15,23,42,0.55)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(148,163,184,0.14)', padding: 12, marginBottom: 12 },
  cover: { width: 92, height: 134, borderRadius: 10, backgroundColor: 'rgba(148,163,184,0.15)' },
  info: { flex: 1 },
  bookTitle: { color: '#f1f5f9', fontSize: 16, fontFamily: 'Playfair_Bold' },
  bookDesc: { color: '#94a3b8', fontSize: 12.5, lineHeight: 18, marginTop: 5 },
  buyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  price: { fontSize: 14, fontWeight: '800', marginRight: 2 },
  buyBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  buyTxt: { fontSize: 12.5, fontWeight: '700' },
  musicCard: { flexDirection: 'row', gap: 14, backgroundColor: 'rgba(15,23,42,0.55)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(148,163,184,0.14)', padding: 14 },
  musicIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(251,191,36,0.14)', alignItems: 'center', justifyContent: 'center' },
  footer: { color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 22 },
});
