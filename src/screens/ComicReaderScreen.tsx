import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getComic } from '../data/comics';
import { getFaithTheme } from '../data/faiths';

const { width } = Dimensions.get('window');

/**
 * Mobile-native comic reader — full-bleed pages, vertical scroll, large readable text.
 * Skips Lemon Squeezy for now: shows the full edition. (Set ENFORCE_PAYWALL later to gate
 * after `previewPages` behind purchase.)
 */
const ENFORCE_PAYWALL = false;

export const ComicReaderScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const theme = getFaithTheme('Hindu');
  const comic = getComic(route.params?.comicId);
  if (!comic) return <View style={styles.container} />;

  const pages = ENFORCE_PAYWALL ? comic.pages.slice(0, comic.previewPages) : comic.pages;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* title page */}
        <View style={styles.titlePage}>
          <ExpoImage source={{ uri: comic.cover }} style={StyleSheet.absoluteFill as any} contentFit="cover" cachePolicy="memory-disk" />
          <LinearGradient colors={['rgba(2,6,23,0.3)', 'rgba(2,6,23,0.85)']} style={StyleSheet.absoluteFill} />
          <View style={styles.titleInner}>
            <Text style={[styles.kicker, { color: theme.accent }]}>ILLUSTRATED EDITION</Text>
            <Text style={styles.bigTitle}>{comic.title}</Text>
            <Text style={styles.bigSub}>{comic.subtitle} · {comic.pages.length} pages</Text>
          </View>
        </View>

        {pages.map((p, i) => (
          <View key={i} style={styles.page}>
            <ExpoImage source={{ uri: p.image }} style={styles.pageImg} contentFit="cover" cachePolicy="memory-disk" />
            <LinearGradient colors={['transparent', 'rgba(2,6,23,0.95)']} style={styles.pageFade} />
            <View style={styles.pageText}>
              {!!p.heading && <Text style={[styles.pageHeading, { color: theme.accent }]}>{p.heading}</Text>}
              {!!p.verse && <Text style={styles.pageVerse}>{p.verse}</Text>}
              {!!p.caption && <Text style={styles.pageCaption}>{p.caption}</Text>}
            </View>
          </View>
        ))}

        {ENFORCE_PAYWALL && comic.pages.length > comic.previewPages && (
          <View style={styles.paywall}>
            <Text style={styles.paywallTitle}>Continue the full edition</Text>
            <Text style={styles.paywallSub}>{comic.pages.length - comic.previewPages} more pages</Text>
          </View>
        )}
        <Text style={styles.end}>🪔  DharmaWeave</Text>
      </ScrollView>

      <Pressable style={styles.back} onPress={() => navigation.goBack()} hitSlop={16}>
        <Ionicons name="chevron-back" size={24} color="#f8fafc" />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  back: { position: 'absolute', top: 52, left: 14, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(2,6,23,0.55)', alignItems: 'center', justifyContent: 'center' },
  titlePage: { height: width * 1.3, justifyContent: 'flex-end' },
  titleInner: { padding: 24 },
  kicker: { fontSize: 11, letterSpacing: 2, fontWeight: '800', marginBottom: 8 },
  bigTitle: { color: '#f8fafc', fontSize: 38, fontFamily: 'Playfair_Bold' },
  bigSub: { color: '#cbd5e1', fontSize: 14, marginTop: 6 },
  page: { width, minHeight: width * 1.3, justifyContent: 'flex-end', backgroundColor: '#020617' },
  pageImg: { width, height: width * 1.34 },
  pageFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: width * 0.7 },
  pageText: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 22 },
  pageHeading: { fontSize: 12, letterSpacing: 1.5, fontWeight: '800', marginBottom: 8 },
  pageVerse: { color: '#f8fafc', fontSize: 19, fontFamily: 'Playfair_Medium', lineHeight: 29, marginBottom: 10 },
  pageCaption: { color: '#cbd5e1', fontSize: 14.5, lineHeight: 22 },
  paywall: { padding: 40, alignItems: 'center' },
  paywallTitle: { color: '#f8fafc', fontSize: 20, fontFamily: 'Playfair_Bold' },
  paywallSub: { color: '#94a3b8', fontSize: 13, marginTop: 6 },
  end: { color: '#64748b', fontSize: 13, textAlign: 'center', paddingVertical: 30 },
});
