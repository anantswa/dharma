import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { articles } from '../data/articles';
import { getFaithTheme } from '../data/faiths';

/** Minimal, dignified markdown → RN. Handles headers, images, blockquotes, bold, paragraphs. */
function renderBody(md: string, accent: string) {
  const blocks = (md || '').split(/\n{2,}/);
  return blocks.map((raw, i) => {
    const b = raw.trim();
    if (!b) return null;
    const img = b.match(/^!\[[^\]]*\]\(([^)]+)\)/);
    if (img) {
      return <ExpoImage key={i} source={{ uri: img[1] }} style={styles.inlineImg} contentFit="cover" cachePolicy="memory-disk" />;
    }
    if (b.startsWith('## ')) return <Text key={i} style={styles.h2}>{b.slice(3)}</Text>;
    if (b.startsWith('# ')) return <Text key={i} style={styles.h1}>{b.slice(2)}</Text>;
    if (b.startsWith('> ')) return <Text key={i} style={[styles.quote, { borderLeftColor: accent }]}>{b.replace(/^> ?/gm, '')}</Text>;
    // paragraph with simple **bold**
    const parts = b.split(/(\*\*[^*]+\*\*)/g);
    return (
      <Text key={i} style={styles.p}>
        {parts.map((p, j) =>
          p.startsWith('**') && p.endsWith('**')
            ? <Text key={j} style={styles.bold}>{p.slice(2, -2)}</Text>
            : p)}
      </Text>
    );
  });
}

export const ArticleReaderScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const theme = getFaithTheme('Hindu');
  const a = (articles as any[]).find((x) => x.id === route.params?.id);
  if (!a) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroWrap}>
          {!!a.hero_url && <ExpoImage source={{ uri: a.hero_url }} style={StyleSheet.absoluteFill as any} contentFit="cover" cachePolicy="memory-disk" />}
          <LinearGradient colors={['rgba(2,6,23,0.2)', 'rgba(2,6,23,0.55)', '#020617']} style={StyleSheet.absoluteFill} />
          <Pressable style={styles.back} onPress={() => navigation.goBack()} hitSlop={16}>
            <Ionicons name="chevron-back" size={24} color="#f8fafc" />
          </Pressable>
          <View style={styles.heroText}>
            <Text style={[styles.tradition, { color: theme.accent }]}>{(a.tradition || '').toUpperCase()}</Text>
            <Text style={styles.title}>{a.title}</Text>
            {!!a.subtitle && <Text style={styles.subtitle}>{a.subtitle}</Text>}
          </View>
        </View>

        <View style={styles.body}>
          {!!a.pull_quote && (
            <Text style={[styles.pull, { color: theme.accent }]}>&ldquo;{a.pull_quote}&rdquo;</Text>
          )}
          {renderBody(a.body_md || '', theme.accent)}
          <Text style={styles.foot}>— DharmaWeave</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  scroll: { paddingBottom: 50 },
  heroWrap: { height: 360, justifyContent: 'flex-end' },
  back: { position: 'absolute', top: 52, left: 14, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(2,6,23,0.5)', alignItems: 'center', justifyContent: 'center' },
  heroText: { padding: 22 },
  tradition: { fontSize: 11, letterSpacing: 2, fontWeight: '800', marginBottom: 6 },
  title: { color: '#f8fafc', fontSize: 28, fontFamily: 'Playfair_Bold', lineHeight: 34 },
  subtitle: { color: '#cbd5e1', fontSize: 13.5, marginTop: 8, fontStyle: 'italic' },
  body: { paddingHorizontal: 22, paddingTop: 18 },
  pull: { fontSize: 20, fontFamily: 'Playfair_Bold', lineHeight: 28, marginBottom: 18 },
  p: { color: '#dbe2ea', fontSize: 16, lineHeight: 26, marginBottom: 16, fontFamily: 'Playfair_Regular' },
  bold: { color: '#f8fafc', fontWeight: '700' },
  h1: { color: '#f8fafc', fontSize: 24, fontFamily: 'Playfair_Bold', marginTop: 8, marginBottom: 12 },
  h2: { color: '#f8fafc', fontSize: 20, fontFamily: 'Playfair_Bold', marginTop: 6, marginBottom: 10 },
  quote: { color: '#cbd5e1', fontSize: 16, fontStyle: 'italic', lineHeight: 25, borderLeftWidth: 3, paddingLeft: 14, marginBottom: 16 },
  inlineImg: { width: '100%', height: 220, borderRadius: 14, marginBottom: 16, backgroundColor: 'rgba(148,163,184,0.12)' },
  foot: { color: '#64748b', fontSize: 13, marginTop: 10, marginBottom: 20 },
});
