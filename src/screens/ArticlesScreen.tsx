import { useNavigation } from '@react-navigation/native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { articles } from '../data/articles';
import { getFaithTheme } from '../data/faiths';

export const ArticlesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const theme = getFaithTheme('Hindu');
  const list = articles as any[];
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#020617', '#0b1220', '#020617']} style={StyleSheet.absoluteFill} />
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={16}><Ionicons name="chevron-back" size={26} color="#e2e8f0" /></Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.kicker, { color: theme.accent }]}>WRITING</Text>
        <Text style={styles.title}>Reflections</Text>
        <Text style={styles.sub}>{list.length} essays on the stories & their meaning</Text>

        {list.map((a) => (
          <Pressable key={a.id} style={styles.card} onPress={() => navigation.navigate('ArticleReader', { id: a.id })}>
            {!!a.hero_url && (
              <ExpoImage source={{ uri: a.hero_url }} style={styles.hero} contentFit="cover" cachePolicy="memory-disk" />
            )}
            <LinearGradient colors={['transparent', 'rgba(2,6,23,0.92)']} style={styles.heroFade} />
            <View style={styles.cardText}>
              <Text style={[styles.cardTradition, { color: theme.accent }]}>{(a.tradition || '').toUpperCase()}</Text>
              <Text style={styles.cardTitle} numberOfLines={2}>{a.title}</Text>
              {!!a.subtitle && <Text style={styles.cardSub} numberOfLines={1}>{a.subtitle}</Text>}
            </View>
          </Pressable>
        ))}
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
  card: { height: 200, borderRadius: 18, overflow: 'hidden', marginBottom: 14, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.6)' },
  hero: { ...StyleSheet.absoluteFillObject },
  heroFade: { ...StyleSheet.absoluteFillObject },
  cardText: { padding: 16 },
  cardTradition: { fontSize: 10, letterSpacing: 1.5, fontWeight: '800', marginBottom: 4 },
  cardTitle: { color: '#f8fafc', fontSize: 20, fontFamily: 'Playfair_Bold', lineHeight: 26 },
  cardSub: { color: '#cbd5e1', fontSize: 12.5, marginTop: 4 },
});
