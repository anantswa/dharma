import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GITA_SHLOKAS, GitaShloka } from '../data/gitaShlokas';
import { getFaithTheme } from '../data/faiths';
import { usePreferencesStore } from '../store/preferencesStore';

type Lang = 'hi' | 'en';

/**
 * Bhagavad Gita — Essential Shlokas. An audio learning pack: each verse recited
 * and explained by Kuber (ElevenLabs). Tap a verse to listen; read along in
 * Sanskrit + transliteration, with the meaning in Hindi or English.
 */
export const GitaAudioScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const primaryTradition = usePreferencesStore((s) => s.primaryTradition);
  const theme = getFaithTheme(primaryTradition);

  const [lang, setLang] = useState<Lang>('hi');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(GITA_SHLOKAS[0]?.id ?? null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const unload = useCallback(async () => {
    if (soundRef.current) {
      try { await soundRef.current.unloadAsync(); } catch { /* noop */ }
      soundRef.current = null;
    }
  }, []);

  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true }).catch(() => {});
    return () => { unload(); };
  }, [unload]);

  const toggle = async (item: GitaShloka) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch { /* noop */ }
    setExpandedId(item.id);

    if (playingId === item.id) {
      await unload();
      setPlayingId(null);
      return;
    }
    await unload();
    try {
      const { sound } = await Audio.Sound.createAsync(item.audio, { shouldPlay: true });
      soundRef.current = sound;
      setPlayingId(item.id);
      sound.setOnPlaybackStatusUpdate((s: any) => {
        if (s?.didJustFinish) { setPlayingId(null); unload(); }
      });
    } catch {
      setPlayingId(null);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#020617', '#0b1220', '#020617']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={16} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color="#e2e8f0" />
        </Pressable>
        <View style={styles.langToggle}>
          {(['hi', 'en'] as Lang[]).map((l) => (
            <Pressable
              key={l}
              onPress={() => setLang(l)}
              style={[styles.langBtn, lang === l && { backgroundColor: theme.accent }]}
            >
              <Text style={[styles.langText, lang === l && { color: '#0b1220' }]}>
                {l === 'hi' ? 'हिंदी' : 'EN'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.kicker, { color: theme.accent }]}>BHAGAVAD GITA</Text>
        <Text style={styles.title}>Essential Shlokas</Text>
        <Text style={styles.subtitle}>{GITA_SHLOKAS.length} verses · recited & explained by Agastya</Text>

        {GITA_SHLOKAS.map((item) => {
          const isPlaying = playingId === item.id;
          const open = expandedId === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setExpandedId(open ? null : item.id)}
              style={[styles.card, open && { borderColor: theme.accent }]}
            >
              <View style={styles.cardTop}>
                <Pressable
                  onPress={() => toggle(item)}
                  hitSlop={12}
                  style={[styles.playBtn, { borderColor: theme.accent, backgroundColor: isPlaying ? theme.accent : 'transparent' }]}
                >
                  <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={18}
                    color={isPlaying ? '#0b1220' : theme.accent}
                  />
                </Pressable>
                <View style={{ flex: 1 }}>
                  <Text style={styles.verseTitle}>{lang === 'hi' ? item.titleHi : item.titleEn}</Text>
                  <Text style={styles.versePeek} numberOfLines={open ? undefined : 1}>
                    {item.sanskrit}
                  </Text>
                </View>
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#64748b" />
              </View>

              {open && (
                <View style={styles.cardBody}>
                  <Text style={[styles.translit, { borderLeftColor: theme.accent }]}>{item.transliteration}</Text>
                  <Text style={styles.meaning}>{lang === 'hi' ? item.meaningHi : item.meaningEn}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
        <Text style={styles.footer}>🪔  All narration by Agastya</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: 16, paddingBottom: 8 },
  back: { padding: 4 },
  langToggle: { flexDirection: 'row', backgroundColor: 'rgba(148,163,184,0.15)', borderRadius: 999, padding: 3 },
  langBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  langText: { color: '#cbd5e1', fontSize: 13, fontWeight: '700' },
  scroll: { paddingHorizontal: 18, paddingBottom: 60 },
  kicker: { fontSize: 12, letterSpacing: 3, fontWeight: '800', marginTop: 8 },
  title: { fontSize: 30, color: '#f8fafc', fontFamily: 'Playfair_Bold', marginTop: 4 },
  subtitle: { fontSize: 13.5, color: '#94a3b8', marginTop: 6, marginBottom: 20 },
  card: { borderWidth: 1, borderColor: 'rgba(148,163,184,0.18)', backgroundColor: 'rgba(15,23,42,0.55)', borderRadius: 16, padding: 14, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  verseTitle: { color: '#f1f5f9', fontSize: 15, fontWeight: '700' },
  versePeek: { color: '#94a3b8', fontSize: 13, marginTop: 3, fontFamily: 'Playfair_Medium' },
  cardBody: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(148,163,184,0.12)' },
  translit: { color: '#cbd5e1', fontSize: 13.5, fontStyle: 'italic', lineHeight: 20, borderLeftWidth: 2, paddingLeft: 12, marginBottom: 12 },
  meaning: { color: '#e2e8f0', fontSize: 15, lineHeight: 23, fontFamily: 'Playfair_Regular' },
  footer: { color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 16 },
});
