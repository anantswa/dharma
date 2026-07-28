import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { PRIMARY_FAITHS, getFaithTheme } from '../data/faiths';
import { usePreferencesStore } from '../store/preferencesStore';
import { track } from '../services/analytics';

const ART = 'https://aiwugigdrvijjeoqtpog.supabase.co/storage/v1/object/public/dharma-art';
const CARD_ART: Record<string, string> = {
  Hindu: `${ART}/featured/temple_hero.jpg`,
  Buddhist: `${ART}/featured/bodhi_hero.jpg`,
};

/**
 * First-launch faith chooser — one question, asked once, beautifully.
 * DESIGN LAW: the temple never assumes whose temple it is. Skippable (defaults
 * Hindu), changeable later in Settings.
 */
export const FaithChooser: React.FC = () => {
  const hasChosen = usePreferencesStore((s) => s.hasChosenFaith);
  const chooseFaith = usePreferencesStore((s) => s.chooseFaith);
  const dismissChooser = usePreferencesStore((s) => s.dismissChooser);
  if (hasChosen) return null;

  const pick = (faith: (typeof PRIMARY_FAITHS)[number]) => {
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch { /* noop */ }
    track('faith_chosen', { faith });
    chooseFaith(faith);
  };
  // Skip keeps whatever primaryTradition already is — it must never rewrite a choice
  const skip = () => { track('faith_chooser_skipped'); dismissChooser(); };

  return (
    <Modal visible animationType="fade" transparent={false} onRequestClose={skip}>
      <View style={styles.wrap}>
        <LinearGradient colors={['#020617', '#0b1220', '#020617']} style={StyleSheet.absoluteFill} />
        <Text style={styles.om}>🪷</Text>
        <Text style={styles.title}>Where does your heart bow?</Text>
        <Text style={styles.sub}>Your temple takes this shape — you can change it anytime.</Text>

        {PRIMARY_FAITHS.map((faith) => {
          const t = getFaithTheme(faith);
          return (
            <Pressable key={faith} style={styles.card} onPress={() => pick(faith)}>
              <ExpoImage source={{ uri: CARD_ART[faith] }} style={StyleSheet.absoluteFill as any} contentFit="cover" transition={300} />
              <LinearGradient colors={['transparent', 'rgba(2,6,23,0.55)', 'rgba(2,6,23,0.95)']} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
              <View style={styles.cardInner}>
                <Text style={[styles.cardGreeting, { color: t.accent }]}>{t.greeting}</Text>
                <Text style={styles.cardName}>{t.label === 'Hindu' ? 'The Hindu path' : 'The Buddhist path'}</Text>
                <Text style={styles.cardBlurb}>{t.blurb}</Text>
              </View>
            </Pressable>
          );
        })}

        <Pressable onPress={skip} hitSlop={12}>
          <Text style={styles.skip}>Skip for now</Text>
        </Pressable>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 22, paddingTop: 84, paddingBottom: 40 },
  om: { fontSize: 34, textAlign: 'center', marginBottom: 10 },
  title: { fontSize: 28, color: '#f8fafc', fontFamily: 'Playfair_Bold', textAlign: 'center' },
  sub: { fontSize: 13.5, color: '#94a3b8', textAlign: 'center', marginTop: 8, marginBottom: 26, lineHeight: 20 },
  card: { height: 210, borderRadius: 22, overflow: 'hidden', marginBottom: 16, justifyContent: 'flex-end', backgroundColor: '#0b1220' },
  cardInner: { padding: 18 },
  cardGreeting: { fontSize: 13, fontStyle: 'italic' },
  cardName: { color: '#f8fafc', fontSize: 22, fontFamily: 'Playfair_Bold', marginTop: 4 },
  cardBlurb: { color: '#cbd5e1', fontSize: 12.5, marginTop: 4, lineHeight: 18 },
  skip: { color: '#64748b', fontSize: 13.5, textAlign: 'center', marginTop: 10 },
});
